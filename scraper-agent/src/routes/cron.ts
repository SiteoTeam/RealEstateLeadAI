
import express from 'express';
import { getUncontactedLeads, markLeadAsContacted } from '../services/db';
import { sendAdminAccessEmail } from '../services/email';

const router = express.Router();

router.post('/run-batch', async (req, res) => {
    // 1. Verify Secret
    const authHeader = req.headers['authorization'];
    // Check for "Bearer <secret>" or just "<secret>"
    const secret = authHeader?.replace('Bearer ', '');

    const CRON_SECRET = process.env.CRON_SECRET;

    if (!CRON_SECRET || secret !== CRON_SECRET) {
        console.warn(`[Cron] Unauthorized access attempt. Provided: ${secret ? '***' : 'none'}`);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Parse Params
    // Limit batch size to prevent timeout
    const batchSize = Math.min(Number(req.query.batch) || 5, 20);

    console.log(`[Cron] Starting batch email process (Limit: ${batchSize})...`);

    try {
        const result = await getUncontactedLeads(batchSize);

        if (!result.success || !result.data) {
            return res.status(500).json({ error: result.error || 'Failed to fetch leads' });
        }

        const leads = result.data;
        const stats = { sent: 0, failed: 0, skipped: 0 };
        const logs: string[] = [];

        if (leads.length === 0) {
            return res.json({ message: 'No new leads to contact', stats });
        }

        for (const lead of leads) {
            console.log(`[Cron] Processing lead: ${lead.primary_email}`);

            // Safety Check
            if (!lead.primary_email || !lead.primary_email.includes('@')) {
                stats.skipped++;
                continue;
            }

            // Construct Data
            const emailData = {
                agentName: lead.full_name,
                agentEmail: lead.primary_email,
                // Ensure this URL is correct for your app structure
                adminUrl: `${process.env.VITE_APP_URL || 'https://siteo.io'}/w/${lead.website_slug || lead.id}/admin?source=email`,
                defaultPassword: 'welcome-siteo'
            };

            // Send
            const sendResult = await sendAdminAccessEmail(emailData);

            if (sendResult.success) {
                const updateResult = await markLeadAsContacted(lead.id);
                if (updateResult.success) {
                    stats.sent++;
                    logs.push(`Sent to ${lead.primary_email}`);
                } else {
                    stats.failed++;
                    logs.push(`DB Update Failed for ${lead.primary_email}: ${updateResult.error}`);
                }
            } else {
                stats.failed++;
                logs.push(`Email Failed to ${lead.primary_email}: ${sendResult.error}`);
            }

            // Small delay
            await new Promise(r => setTimeout(r, 500));
        }

        res.json({ success: true, stats, logs });

    } catch (err: any) {
        console.error('[Cron] Batch error:', err);
        res.status(500).json({ error: err.message });
    }
});

export const cronRoutes = router;
