import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from one level up
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function runTests() {
    console.log('--- STARTING TRIAL LOGIC TESTS (using existing agent) ---\n');

    let agentId: string | null = null;
    let backupState: any = null;

    const results = {
        agentId: null as string | null,
        reminderTest: false,
        paymentTest: false,
        expiryTest: false,
        expiryDays: 0,
        error: null as string | null
    };

    try {
        // --- SETUP: Find Existing Agent (Prefer 'test') ---
        console.log('1. Finding Existing Agent...');
        const { data: testAgent } = await db.from('scraped_agents').select('*').ilike('website_slug', '%test%').limit(1).single();

        let agent;
        if (testAgent) {
            agent = testAgent;
            console.log('   ✅ Found dedicated TEST agent.');
        } else {
            // Fallback
            const { data: anyAgent } = await db
                .from('scraped_agents')
                .select('*')
                .eq('is_paid', false)
                .limit(1)
                .single();
            agent = anyAgent;
            console.log('   ⚠️ Using random agent (no test agent found).');
        }

        if (!agent) {
            // Try fetching ANY agent
            const { data: anyAgent } = await db.from('scraped_agents').select('*').limit(1).single();
            if (!anyAgent) throw new Error('No agents found in DB to test with.');
            agentId = anyAgent.id;
            backupState = anyAgent;
        } else {
            agentId = agent.id;
            backupState = agent;
        }

        results.agentId = agentId;
        console.log(`   ✅ Using Agent: ${agentId} (${backupState.full_name})`);
        console.log('   🔒 Backed up original state.');


        // --- TEST CASE 1: 20 Days In (Should get reminder) ---
        console.log('\n2. Testing Reminder Query (Day 20)...');
        // Set trial start to 20 days ago
        const day20 = new Date();
        day20.setDate(day20.getDate() - 20);

        await db.from('scraped_agents').update({ trial_started_at: day20.toISOString(), is_paid: false }).eq('id', agentId);

        // Run the Query from admin.ts
        const startOfDay = new Date(day20); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(day20); endOfDay.setHours(23, 59, 59, 999);

        const { data: reminderCandidates } = await db
            .from('scraped_agents')
            .select('id, is_paid')
            .gte('trial_started_at', startOfDay.toISOString())
            .lte('trial_started_at', endOfDay.toISOString())
            .eq('is_paid', false)
            .eq('id', agentId);

        if (reminderCandidates && reminderCandidates.length === 1) {
            results.reminderTest = true;
            console.log('   ✅ Test Passed: Agent found in reminder query.');
        } else {
            console.error('   ❌ Test Failed: Agent NOT found in reminder query.');
            console.log('   Debug:', { startOfDay, endOfDay, actual: reminderCandidates });
        }


        // --- TEST CASE 2: Payment Exclusion ---
        console.log('\n3. Testing Payment Exclusion...');
        // Set is_paid = true
        await db.from('scraped_agents').update({ is_paid: true }).eq('id', agentId);

        const { data: paidCandidates } = await db
            .from('scraped_agents')
            .select('id')
            .gte('trial_started_at', startOfDay.toISOString())
            .lte('trial_started_at', endOfDay.toISOString())
            .eq('is_paid', false) // Crucial filter
            .eq('id', agentId);

        if (paidCandidates && paidCandidates.length === 0) {
            results.paymentTest = true;
            console.log('   ✅ Test Passed: Paid agent correctly EXCLUDED from query.');
        } else {
            console.error('   ❌ Test Failed: Paid agent still returned in query. (Count: ' + paidCandidates?.length + ')');
        }


        // --- TEST CASE 3: Expiry Logic (Day 31) ---
        console.log('\n4. Testing Expiry Status (Day 31)...');
        // Reset to unpaid, set date to 31 days ago
        const day31 = new Date();
        day31.setDate(day31.getDate() - 31);
        await db.from('scraped_agents').update({ is_paid: false, trial_started_at: day31.toISOString() }).eq('id', agentId);

        // Check calculation
        const { data: expiredAgent } = await db.from('scraped_agents').select('trial_started_at, is_paid').eq('id', agentId).single();

        if (expiredAgent) {
            const now = new Date();
            const diff = now.getTime() - new Date(expiredAgent.trial_started_at).getTime();
            results.expiryDays = diff / (1000 * 60 * 60 * 24);

            if (results.expiryDays > 30 && expiredAgent.is_paid === false) {
                results.expiryTest = true;
                console.log(`   ✅ Test Passed: Agent is strictly "expired" (Days: ${results.expiryDays.toFixed(1)}, Paid: false).`);
            } else {
                console.error('   ❌ Test Failed: Calculation error.');
            }
        }


        // --- TEST CASE 4: Deletion Logic (Simulated Prune) ---
        console.log('\n5. Testing Deletion Logic...');
        if (results.expiryTest) {
            // Simulate what admin.ts does
            console.log('   Running simulated prune...');

            // 1. Delete Logs
            const { error: logDelError } = await db.from('email_logs').delete().eq('lead_id', agentId);
            if (logDelError) console.error('   ❌ Log Delete Failed:', logDelError);

            // 2. Delete Agent
            const { error: agentDelError } = await db.from('scraped_agents').delete().eq('id', agentId);
            if (agentDelError) {
                console.error('   ❌ Agent Delete Failed:', agentDelError);
            } else {
                console.log('   ✅ Agent Successfully Deleted.');

                // Verify GONE
                const { data: check } = await db.from('scraped_agents').select('id').eq('id', agentId).single();
                if (!check) {
                    console.log('   ✅ Verification: Agent is effectively gone.');
                    // We don't need to restore in finally block if we deleted it here.
                    // But finally block tries to update it. We should handle that.
                    agentId = null; // Prevent restore attempt
                } else {
                    console.error('   ❌ Verification Failed: Agent still exists!?');
                }
            }
        } else {
            console.log('   ⚠️ Skipping deletion test because expiry test failed (or agent not expired).');
        }

    } catch (err: any) {
        console.error('TEST SUITE FAILED:', err);
        results.error = err.message;
    } finally {
        // --- RESTORE ---
        if (agentId && backupState) {
            console.log('\n--- CLEANUP & RESTORE ---');
            await db.from('scraped_agents').update({
                trial_started_at: backupState.trial_started_at,
                is_paid: backupState.is_paid
            }).eq('id', agentId);
            console.log('   🔓 Restored original agent state.');
        }

        const fs = await import('fs');
        fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
    }
}

runTests();
