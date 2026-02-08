
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function reset() {
    console.log('--- Resetting Trial for Last Logged Agent ---');
    // 1. Get last log
    const { data: logs, error: logError } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (logError || !logs.length) {
        console.error('No logs found or error:', logError);
        return;
    }

    const log = logs[0];
    if (!log.lead_id) {
        console.error('Last log has no lead_id');
        return;
    }

    console.log(`Resetting trial for Lead ID: ${log.lead_id}`);

    const { error } = await supabase
        .from('scraped_agents')
        .update({ trial_started_at: null })
        .eq('id', log.lead_id);

    if (error) {
        console.error('Reset failed:', error);
    } else {
        console.log('✅ Trial Reset Successfully!');
    }
}

reset();
