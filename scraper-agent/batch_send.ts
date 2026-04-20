import 'dotenv/config';
import { getUncontactedLeads, markLeadAsContacted, advanceLeadSequence } from './src/services/db';
import { sendWelcomeEmail } from './src/services/email';

// Configuration
const BATCH_SIZE = 10;
const DELAY_MS = 2000; // 2 seconds between emails

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBatch() {
    console.log('--- Starting Batch Email Process ---');
    console.log(`Time: ${new Date().toISOString()}`);

    try {
        // 1. Get uncontacted leads
        const result = await getUncontactedLeads(BATCH_SIZE);

        if (!result.success || !result.data) {
            console.error('Failed to fetch leads:', result.error);
            process.exit(1);
        }

        const leads = result.data;
        console.log(`Found ${leads.length} uncontacted leads.`);

        if (leads.length === 0) {
            console.log('No new leads to contact.');
            process.exit(0);
        }

        let sentCount = 0;
        let failCount = 0;

        // 2. Process each lead
        for (const lead of leads) {
            console.log(`\nProcessing: ${lead.full_name} (${lead.primary_email})`);

            // Check if email is valid-ish
            if (!lead.primary_email || !lead.primary_email.includes('@')) {
                console.warn('  Skipping: Invalid email');
                failCount++;
                continue;
            }

            // Construct data
            const emailData = {
                agentName: lead.full_name,
                agentEmail: lead.primary_email,
                websiteUrl: `https://siteo.io/w/${lead.website_slug || lead.id}?source=email`,
                adminUrl: `https://siteo.io/agents/${lead.website_slug || lead.id}/admin`,
                defaultPassword: 'welcome-siteo',
                leadId: lead.id,
                city: lead.city
            };

            // In TEST MODE, maybe override recipient?
            // Uncomment to force all emails to yourself for safety during testing
            // const TEST_EMAIL = process.env.TEST_EMAIL || 'siteoteam@gmail.com'; // Default fallback
            // console.log(`  [TEST MODE] Sending to ${TEST_EMAIL} instead of ${lead.primary_email}`);
            // emailData.agentEmail = TEST_EMAIL;

            // 3. Send Email
            const sendResult = await sendWelcomeEmail(emailData);

            if (sendResult.success) {
                console.log('  ✓ Email sent');

                // 4. Mark as contacted and initiate follow-up sequence
                const updateResult = await advanceLeadSequence(lead.id, 1);
                // Also mark as contacted manually just in case, though advanceLeadSequence handles last_contacted_at
                await markLeadAsContacted(lead.id);

                if (updateResult.success) {
                    console.log('  ✓ Database updated & entered sequence');
                    sentCount++;
                } else {
                    console.error('  ✗ Failed to update database sequence:', updateResult.error);
                }
            } else {
                console.error('  ✗ Email failed:', sendResult.error);
                failCount++;
            }

            // 5. Wait
            await sleep(DELAY_MS);
        }

        console.log('\n--- Batch Complete ---');
        console.log(`Sent: ${sentCount}`);
        console.log(`Failed: ${failCount}`);

    } catch (err) {
        console.error('Batch Process Error:', err);
        process.exit(1);
    }
}

runBatch();
