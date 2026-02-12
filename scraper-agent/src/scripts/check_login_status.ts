
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function run() {
    const { data } = await supabase.from('scraped_agents').select('full_name, last_login_at');
    console.log(JSON.stringify(data, null, 2));
}
run();
