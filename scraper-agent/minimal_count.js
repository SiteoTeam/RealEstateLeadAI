
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function count() {
    // Just count. Head only.
    const { count: total, error } = await supabase
        .from('scraped_agents')
        .select('*', { count: 'exact', head: true });

    console.log(`TOTAL DB COUNT: ${total}`);

    const { count: emailed, error: err2 } = await supabase
        .from('scraped_agents')
        .select('*', { count: 'exact', head: true })
        .not('last_contacted_at', 'is', null);

    console.log(`EMAILED DB COUNT: ${emailed}`);
}

count();
