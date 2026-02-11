
import * as dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

async function testEmail() {
    console.log('Testing Resend configuration...');
    console.log('API Key present:', !!RESEND_API_KEY);
    console.log('From Email:', FROM_EMAIL);

    if (!RESEND_API_KEY) {
        console.error('Error: RESEND_API_KEY is missing.');
        return;
    }

    const resend = new Resend(RESEND_API_KEY);

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: 'delivered@resend.dev', // safe test address
            subject: 'Test Email from Agent Scraper',
            html: '<p>This is a test email to verify configuration.</p>'
        });

        if (error) {
            console.error('Resend Error:', error);
        } else {
            console.log('Success! Email ID:', data?.id);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testEmail();
