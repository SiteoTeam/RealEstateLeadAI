
import * as dotenv from 'dotenv';
import { vercelService } from './services/vercel';

dotenv.config();

async function testVercel() {
    console.log('Testing Vercel Connection...');
    console.log('Project ID:', process.env.VERCEL_PROJECT_ID);

    // TEST TRICK: Force undefined Team ID to see if that fixes it
    // process.env.VERCEL_TEAM_ID = ''; 
    // Actually, let's just modify the service call logic in this script or mocked service?
    // Easier: Let's explicitly try to call the API without the Team ID manually here.

    const token = process.env.VERCEL_AUTH_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    console.log('--- TEST 1: With Current Env ---');
    try {
        await vercelService.getDomainStatus('siteo.io');
        console.log('✅ Success with current settings!');
    } catch (e: any) {
        console.log(`❌ Failed with current settings: ${e.message} (${e.status})`);
    }

    console.log('\n--- TEST 2: Without Team ID (Personal Account) ---');
    try {
        const url = `https://api.vercel.com/v10/projects/${projectId}/domains/siteo.io`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            console.log('✅ Success WITHOUT Team ID!');
            console.log('DIAGNOSIS: You need to remove VERCEL_TEAM_ID from your .env file.');
        } else {
            console.log(`❌ Failed without Team ID: ${res.status}`);
        }
    } catch (e) { console.log(e); }

}

// testVercel(); // Removed self execution to allow async below
testVercel();
