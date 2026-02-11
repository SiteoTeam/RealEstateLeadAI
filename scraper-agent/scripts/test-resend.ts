import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
console.log('API Key:', apiKey ? 'Found' : 'Missing');

if (!apiKey) process.exit(1);

const resend = new Resend(apiKey);

async function main() {
    try {
        console.log('1. Sending test email...');
        const { data: sendData, error: sendError } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev',
            subject: 'Debug Test ' + Date.now(),
            html: '<p>Debug test</p>'
        });

        if (sendError) {
            console.error('Send Error:', sendError);
            return;
        }
        console.log('Email Sent! ID:', sendData?.id);

        console.log('2. Waiting 5 seconds...');
        await new Promise(r => setTimeout(r, 5000));

        console.log('3. Fetching logs...');
        // @ts-ignore
        const response = await (resend.emails as any).list();
        console.log('List Response:', JSON.stringify(response, null, 2));

        if (response.data && response.data.length > 0) {
            console.log('SUCCESS: Found logs!');
        } else {
            console.log('FAILURE: List returned empty array.');
        }

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

main();
