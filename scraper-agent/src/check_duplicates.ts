import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from root of scraper-agent
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

    // 1. Check for duplicate Names
    console.log('\n--- Checking for Duplicate Names ---');
    const { data: nameCounts, error: nameError } = await db
        .from('scraped_agents')
        .select('full_name');

    if (nameError) {
        console.error('Error fetching names:', nameError.message);
    } else if (nameCounts) {
        const counts: Record<string, number> = {};
        nameCounts.forEach((r: any) => {
            counts[r.full_name] = (counts[r.full_name] || 0) + 1;
        });

        const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} names with duplicates:`);
            for (const [name, count] of duplicates) {
                console.log(`- "${name}": ${count} records`);
                // Fetch the IDs for these duplicates
                const { data: dupeRows } = await db
                    .from('scraped_agents')
                    .select('id, last_contacted_at, source_url')
                    .eq('full_name', name);

                if (dupeRows) {
                    dupeRows.forEach(row => {
                        console.log(`  > ID: ${row.id} | Contacted: ${row.last_contacted_at} | URL: ${row.source_url}`);
                    });
                }
            }
        } else {
            console.log('No duplicate names found.');
        }
    }

    // 2. Check for duplicate URLs (should be unique constraint but let's check)
    console.log('\n--- Checking for Duplicate Source URLs ---');
    const { data: urlCounts, error: urlError } = await db
        .from('scraped_agents')
        .select('source_url');

    if (urlError) {
        console.error('Error fetching URLs:', urlError.message);
    } else if (urlCounts) {
        const counts: Record<string, number> = {};
        urlCounts.forEach((r: any) => {
            counts[r.source_url] = (counts[r.source_url] || 0) + 1;
        });

        const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} URLs with duplicates:`);
            duplicates.forEach(([url, count]) => console.log(`- ${url}: ${count}`));
        } else {
            console.log('No duplicate Source URLs found.');
        }
    }
}

main();
