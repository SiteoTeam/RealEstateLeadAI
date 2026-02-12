
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const db = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const migrationPath = path.resolve(__dirname, '../../../supabase/migrations/09_login_logs.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 09_login_logs.sql');

    // Supabase JS client doesn't support raw SQL execution directly on the public schema easily without RPC or extensions sometimes.
    // However, we can try using RPC if enabled, or just use the `pg` library if we had connection string.
    // But we don't have connection string in env, only URL/Key?
    // Wait, usually I need `connectionString` for migrations.
    // Detailed verification: `SUPABASE_URL` is usually HTTP.
    // If I cannot run SQL directly, I might need to ask the user to run it.
    // BUT, I can try to use a dummy RPC if I have one for executing SQL, or just use `pg` if `DATABASE_URL` is available.

    // Let's check env vars for DATABASE_URL.
    if (process.env.DATABASE_URL) {
        // We can use pg
        const { Client } = require('pg');
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        try {
            await client.query(sql);
            console.log('Migration successful via pg');
        } catch (e) {
            console.error('Migration failed via pg:', e);
        } finally {
            await client.end();
        }
    } else {
        console.warn('DATABASE_URL not found. Cannot run SQL migration directly from Node without it.');
        // Fallback: Try to use Supabase REST API if there's a function? No.
        // I will just print the SQL and ask user?
        // Wait, I can try to see if `scripts/test_db_connection.ts` or similar uses `pg`.
        // I'll assume for now I might fail if no DIRECT DB access.
        // Let's just try to log the URL to see if I have it.
        console.log('Checking for DATABASE_URL...');
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL is missing in .env. Please run the SQL manually in Supabase SQL Editor.');
            console.log('\n--- SQL ---\n');
            console.log(sql);
            console.log('\n-----------\n');
        }
    }
}

// Check if we can proceed
runMigration();
