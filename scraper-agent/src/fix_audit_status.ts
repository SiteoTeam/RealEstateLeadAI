import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
const envPath = path.resolve(__dirname, '../.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

async function main() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
        process.exit(1);
    }

    const db = createClient(supabaseUrl, supabaseKey);
    console.log('Connected to Supabase');

    // 1. Fetch all leads that have an audit but last_contacted_at is NULL
    // This is a bit tricky with Supabase JS standard query builder for joins/existence.
    // We'll fetch all audits first (assuming not millions) or filter in code.
    // Actually, let's fetch leads with NO last_contacted_at first.

    console.log('Fetching uncontacted leads...');
    const { data: leads, error: leadsError } = await db
        .from('scraped_agents')
        .select('id, full_name, primary_email')
        .is('last_contacted_at', null)
        .limit(1000);

    if (leadsError) {
        console.error('Error fetching leads:', leadsError.message);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log('No uncontacted leads found.');
        return;
    }

    console.log(`Found ${leads.length} uncontacted leads. Checking for audits...`);

    let fixedCount = 0;

    for (const lead of leads) {
        // Check if this lead has an audit
        const { data: audits, error: auditError } = await db
            .from('lead_audits')
            .select('id, created_at')
            .eq('lead_id', lead.id)
            .limit(1);

        if (auditError) {
            console.error(`Error checking audit for ${lead.full_name}:`, auditError.message);
            continue;
        }

        if (audits && audits.length > 0) {
            console.log(`Found audit for ${lead.full_name} (${lead.id}). Fixing status...`);

            // Update last_contacted_at
            // Use current time or audit creation time?
            // Use current time to be safe, or audit time if available.
            const auditTime = audits[0].created_at || new Date().toISOString();

            const { error: updateError } = await db
                .from('scraped_agents')
                .update({ last_contacted_at: new Date().toISOString() }) // Use NOW to update status
                .eq('id', lead.id);

            if (updateError) {
                console.error(`Failed to update ${lead.full_name}:`, updateError.message);
            } else {
                console.log(`✓ Fixed ${lead.full_name}`);
                fixedCount++;
            }
        }
    }

    console.log(`\nFinished! Fixed ${fixedCount} leads.`);
}

main();
