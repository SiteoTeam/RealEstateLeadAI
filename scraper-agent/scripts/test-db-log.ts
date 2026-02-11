import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Testing DB connection...');
    console.log('URL:', supabaseUrl);

    const { data, error } = await supabase.from('email_logs').insert({
        recipient: 'test-script@example.com',
        subject: 'Direct DB Test',
        status: 'sent',
        created_at: new Date().toISOString()
    }).select().single();

    if (error) {
        console.error('INSERT FAILED:', error);
    } else {
        console.log('INSERT SUCCESS:', data);
    }

    console.log('Reading back...');
    const { data: readData, error: readError } = await supabase.from('email_logs').select('*').limit(1);
    console.log('READ RESULT:', readData);
}

main();
