
require('dotenv').config({ path: '.env' });

async function manualSend() {
    console.log('--- Manual Email Send Test ---');
    try {
        const { sendAdminAccessEmail } = require('./src/services/email');

        // Use a test email (or the lead's email if safe)
        // I'll use the FROM_EMAIL as the TO email for safety, or just log what happens
        const TEST_EMAIL = process.env.FROM_EMAIL || 'support@siteo.io';

        console.log(`Sending test email to: ${TEST_EMAIL}`);

        const result = await sendAdminAccessEmail({
            agentName: 'Test Agent',
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
