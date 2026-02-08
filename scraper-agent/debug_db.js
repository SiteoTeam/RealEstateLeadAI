
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function debug() {
    console.log('--- Deep Debug ---');

    const { data: welcomeLogs, error: logError } = await supabase
        .from('email_logs')
        .select('*')
        .ilike('subject', '%Question about your listings%')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!welcomeLogs.length) return;

    const log = welcomeLogs[0];
    const leadId = log.lead_id;

    const { data: lead } = await supabase
        .from('scraped_agents')
        .select('*') // GET EVERYTHING
        .eq('id', leadId)
        .single();

    console.log('Lead Full Data:', JSON.stringify(lead, null, 2));

    if (!lead.website_slug) {
        console.error('❌ ERROR: Missing website_slug! Email cannot be sent.');
    }
    if (!lead.primary_email) {
        console.error('❌ ERROR: Missing primary_email!');
    }
}

debug();
