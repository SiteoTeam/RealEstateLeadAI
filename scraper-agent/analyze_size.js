
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function analyze() {
    console.log('--- Analyzing Agent Record Size ---');

    const { data: agents, error } = await supabase
        .from('scraped_agents')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!agents.length) {
        console.log('No agents found to analyze.');
        return;
    }

    let totalSize = 0;
    let maxHeadshotSize = 0;

    agents.forEach(a => {
        const json = JSON.stringify(a);
        const size = Buffer.byteLength(json, 'utf8');
        totalSize += size;

        if (a.headshot_url) {
            const hSize = Buffer.byteLength(a.headshot_url, 'utf8');
            if (hSize > maxHeadshotSize) maxHeadshotSize = hSize;
        }
    });

    const avgSize = totalSize / agents.length;
    console.log(`Average Record Size: ~${Math.round(avgSize)} bytes`);
    console.log(`Max Headshot URL Size: ${maxHeadshotSize} bytes`);

    if (maxHeadshotSize > 1000) {
        console.log('⚠️ WARNING: Headshots might be Base64 encoded!');
    } else {
        console.log('✅ Headshots appear to be standard URLs.');
    }
}

analyze();
