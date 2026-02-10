
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from current directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

import * as fs from 'fs';

async function check() {
    console.log('--- Checking lead_audits ---');
    const { data, error } = await supabase
        .from('lead_audits')
        .select(`
            *,
            lead:lead_id (full_name, primary_email)
        `);

    if (error) {
        console.error('Error fetching audits:', error);
        fs.writeFileSync('audit_debug_error.txt', JSON.stringify(error, null, 2));
    } else {
        console.log(`Found ${data.length} audits.`);
        fs.writeFileSync('audit_list.json', JSON.stringify(data, null, 2));
    }
}

check();
