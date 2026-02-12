
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from one level up (since we are in src/scripts)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function expireKaren() {
    console.log('Searching for "Karen Sharp"...');

    const { data: agents, error } = await db
        .from('scraped_agents')
        .select('*')
        .ilike('full_name', '%Karen Sharp%');

    if (error) {
        console.error('Error finding agent:', error);
        return;
    }

    if (!agents || agents.length === 0) {
        console.error('❌ Karen Sharp not found!');
        return;
    }

    console.log(`Found ${agents.length} agent(s) named Karen Sharp.`);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 35); // 35 days ago (Expired)

    for (const agent of agents) {
        console.log(`Expiring agent: ${agent.full_name} (${agent.id})`);

        const { error: updateError } = await db
            .from('scraped_agents')
            .update({
                is_paid: false,
                trial_started_at: targetDate.toISOString()
            })
            .eq('id', agent.id);

        if (updateError) {
            console.error('Error updating agent:', updateError);
        } else {
            console.log('✅ Successfully marked as EXPIRED.');
        }
    }
}

expireKaren();
