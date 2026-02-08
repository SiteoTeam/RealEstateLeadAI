
import dotenv from 'dotenv';
dotenv.config();

import { sendAdminAccessEmail } from './src/services/email';

async function manualSend() {
    console.log('--- Manual Email Send Test (TS) ---');
    try {
        const TEST_EMAIL = process.env.FROM_EMAIL || 'support@siteo.io';

        console.log(`Sending test email to: ${TEST_EMAIL}`);

        const result = await sendAdminAccessEmail({
            agentName: 'Test Agent TS',
            agentEmail: TEST_EMAIL,
            adminUrl: 'https://siteo.io/w/test-slug/admin',
            defaultPassword: 'test-password-123'
        });

        console.log('Send Result:', result);

    } catch (err) {
        console.error('Manual Send Error:', err);
    }
}

manualSend();
