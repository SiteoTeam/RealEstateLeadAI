
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function diagnose() {
    console.log('--- DB DIAGNOSTIC REPORT ---');

    // 1. Count Total Agents
    const { count: totalAgents, error: countError } = await supabase
        .from('scraped_agents')
        .select('*', { count: 'exact', head: true });

    console.log(`TOTAL: ${totalAgents}`);
    console.log(`EMAILED: ${emailedAgents}`);
    console.log(`LOGS: ${totalLogs}`);

    // 4. Sample Agents (to check if they exist)
    const { data: sample, error: sampleError } = await supabase
        .from('scraped_agents')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    /*
    if (sample) {
        console.log('Most Recent 5 Agents:');
        sample.forEach(a => console.log(`- ${a.full_name} (${a.created_at})`));
    }
    */
}

diagnose();
