import { Router } from 'express';
import { getDb } from '../services/db';
import multer from 'multer';
import { verifySupabaseUser, AuthenticatedRequest } from '../middleware/supabaseAuth'; // Use the secure middleware
import { CLIENT_URL } from '../utils/urls';

const router = Router();

// File upload validation: images only, 5MB max
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WebP, and GIF are allowed.`));
        }
    }
});

// Unified Admin Routes - reusing Supabase Auth
// Removed /login (insecure). Use Platform Login instead.

// GET CONFIG: GET /api/admin/config/:id
// Changed to accept ID parameter since we use centralized auth
router.get('/config/:id', verifySupabaseUser, async (req: AuthenticatedRequest, res) => {
    try {
        const { id } = req.params;

        // Authorization: Agents can only read their own config
        if (req.user?.role === 'agent' && req.user?.id !== id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        const { data, error } = await db
            .from('scraped_agents')
            .select('website_config')
            .eq('id', id)
            .single();

        if (error) throw error;

        res.json(data?.website_config || {});
    } catch (err: any) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPDATE CONFIG: PATCH /api/admin/config/:id
router.patch('/config/:id', verifySupabaseUser, async (req: AuthenticatedRequest, res) => {
    try {
        const { id } = req.params;

        // Authorization: Agents can only update their own config
        if (req.user?.role === 'agent' && req.user?.id !== id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Ensure user has permission (Platform Admin can edit anyone)
        // const { id: userId } = req.user; 

        const updates = req.body;

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        // Fetch existing config first to MERGE instead of overwrite
        const { data: existing, error: fetchError } = await db
            .from('scraped_agents')
            .select('website_config')
            .eq('id', id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        const currentConfig = existing?.website_config || {};
        const mergedConfig = { ...currentConfig, ...updates };

        console.log('[Admin] Updating config:', { updates, mergedConfig });

        const { error } = await db
            .from('scraped_agents')
            .update({
                website_config: mergedConfig,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// UPLOAD IMAGE: POST /api/admin/upload/:slug
// Need slug to organize folder
router.post('/upload/:slug', verifySupabaseUser, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
        const { slug } = req.params;
        const file = req.file;

        // Authorization: Agents can only upload to their own slug folder
        if (req.user?.role === 'agent' && req.user?.slug !== slug) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        console.log('Upload request received for:', slug);

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        const fileExt = file.originalname.split('.').pop();
        const fileName = `${slug}/${Date.now()}.${fileExt}`;

        console.log('Uploading to Storage:', fileName);

        const { data, error } = await db
            .storage
            .from('agent-assets')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) {
            console.error('Storage Upload Error:', error);
            throw error;
        }

        const { data: { publicUrl } } = db
            .storage
            .from('agent-assets')
            .getPublicUrl(fileName);

        console.log('Upload success:', publicUrl);
        res.json({ url: publicUrl });

    } catch (err: any) {
        console.error('Upload Endpoint Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- DOMAIN MANAGEMENT ROUTES ---
import { vercelService } from '../services/vercel';

// ADD DOMAIN: POST /api/admin/domains
router.post('/domains', verifySupabaseUser, async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.status(400).json({ error: 'Domain is required' });

        const result = await vercelService.addDomain(String(domain).trim());
        res.json(result);
    } catch (err: any) {
        console.error('Add domain error:', err.message);
        if (err.details) {
            return res.status(err.status || 400).json(err.details);
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET DOMAIN STATUS: GET /api/admin/domains/:domain
router.get('/domains/:domain', verifySupabaseUser, async (req, res) => {
    try {
        const { domain } = req.params;
        const result = await vercelService.getDomainStatus(String(domain).trim());
        res.json(result || { error: 'Domain not found' });
    } catch (err: any) {
        console.error('Get domain error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// VERIFY DOMAIN: POST /api/admin/domains/:domain/verify
router.post('/domains/:domain/verify', verifySupabaseUser, async (req, res) => {
    try {
        const { domain } = req.params;
        const result = await vercelService.verifyDomain(String(domain).trim());
        res.json(result);
    } catch (err: any) {
        console.error('Verify domain error:', err.message);
        if (err.details) {
            return res.status(err.status || 400).json(err.details);
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE DOMAIN: DELETE /api/admin/domains/:domain
router.delete('/domains/:domain', verifySupabaseUser, async (req, res) => {
    try {
        const { domain } = req.params;
        const result = await vercelService.removeDomain(String(domain).trim());
        res.json(result);
    } catch (err: any) {
        console.error('Remove domain error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// NOTIFY AGENT: POST /api/admin/notify-agent/:id
router.post('/notify-agent/:id', verifySupabaseUser, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        // 1. Fetch Agent Details
        const { data: agent, error } = await db
            .from('scraped_agents')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // 2. Prepare Email Data
        // Determine live URL (Custom Domain or Subdirectory)
        const customDomain = agent.website_config?.custom_domain;
        const slug = agent.website_slug;

        // Base URL from env or default
        // Fallback for dev

        // If custom domain is set and working, use it? Or just always link to the platform wrapper?
        // Let's use the direct link logic similar to the frontend "Open Website" button
        const safeSlug = slug || id;
        const websiteUrl = customDomain
            ? `https://${customDomain}`
            : `${CLIENT_URL}/w/${safeSlug}?source=email`;

        const adminUrl = `${CLIENT_URL}/w/${safeSlug}/admin/login?source=email`;

        // Get default password from env or constant
        // Note: In a real app we might not send this if they've already logged in, 
        // but for this onboarding flow we assume it's their first time.
        const defaultPassword = process.env.DEFAULT_AGENT_PASSWORD || 'welcome123';

        // 3. Send Email
        const { sendWelcomeEmail } = await import('../services/email');
        const result = await sendWelcomeEmail({
            agentName: agent.full_name,
            agentEmail: agent.primary_email || agent.raw_profile?.email, // Fallback to raw profile email
            websiteUrl,
            adminUrl,
            defaultPassword,
            leadId: agent.id // Critical for webhook tracking
        });

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        // Update last_contacted_at on success
        const { error: updateError } = await db
            .from('scraped_agents')
            .update({ last_contacted_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) console.error('[Admin] Failed to update last_contacted_at:', updateError);

        res.json({ success: true, id: result.id });

    } catch (err: any) {
        console.error('[Admin] Notify agent CRITICAL error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET EMAILS: GET /api/admin/emails
router.get('/emails', verifySupabaseUser, async (req, res) => {
    try {
        console.log('[Admin] Fetching email logs (DB mode)...');
        const { getDb } = await import('../services/db');
        const db = getDb();

        if (!db) {
            console.error('[Admin] Database not initialized');
            return res.status(500).json({ error: 'Database not initialized' });
        }

        const { data, error } = await db
            .from('email_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error) {
            console.error('[Admin] DB Error fetching logs:', error);
            throw error;
        }

        console.log(`[Admin] Successfully fetched ${data?.length} logs`);
        res.json({ data: data || [] });

    } catch (err: any) {
        console.error('Fetch emails error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE EMAILS: DELETE /api/admin/emails/:recipient
router.delete('/emails/:recipient', verifySupabaseUser, async (req, res) => {
    try {
        const { recipient } = req.params;
        const decodedRecipient = decodeURIComponent(String(recipient));

        console.log(`[Admin] Deleting email logs for: ${decodedRecipient}`);

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        const { error } = await db
            .from('email_logs')
            .delete()
            .eq('recipient', decodedRecipient);

        if (error) throw error;

        res.json({ success: true });
    } catch (err: any) {
        console.error('Delete emails error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// TEST EMAIL: POST /api/admin/test-email
router.post('/test-email', verifySupabaseUser, async (req, res) => {
    // ... (existing test email logic) ...
});

// TRIGGER BATCH: POST /api/admin/trigger-batch
router.post('/trigger-batch', verifySupabaseUser, async (req, res) => {
    try {
        console.log('[Admin] Manually triggering batch email process...');

        // Dynamic imports to ensure fresh state
        const { getUncontactedLeads, markLeadAsContacted } = await import('../services/db');
        const { sendWelcomeEmail } = await import('../services/email');

        // Authorization: Only platform admins can trigger batches manually
        if ((req as AuthenticatedRequest).user?.role === 'agent') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const batchSize = Math.min(Number(req.body.batchSize) || 5, 20);

        const result = await getUncontactedLeads(batchSize);
        if (!result.success || !result.data) {
            return res.status(500).json({ error: result.error || 'Failed to fetch leads' });
        }

        const leads = result.data;
        const stats = { sent: 0, failed: 0, skipped: 0 };
        const logs: string[] = [];

        if (leads.length === 0) {
            return res.json({ message: 'No new leads to contact', stats, logs });
        }

        // Process in background to avoid timeout? 
        // No, let's process and return results so admin sees what happened.
        for (const lead of leads) {
            if (!lead.primary_email || !lead.primary_email.includes('@')) {
                stats.skipped++;
                continue;
            }

            const safeSlug = lead.website_slug || lead.id;
            const emailData = {
                agentName: lead.full_name,
                agentEmail: lead.primary_email,
                websiteUrl: `${CLIENT_URL}/w/${safeSlug}?source=email`,
                adminUrl: `${CLIENT_URL}/w/${safeSlug}/admin/login?source=email`,
                defaultPassword: process.env.DEFAULT_AGENT_PASSWORD || 'welcome123',
                leadId: lead.id
            };

            const sendResult = await sendWelcomeEmail(emailData);

            if (sendResult.success) {
                const updateResult = await markLeadAsContacted(lead.id);
                if (updateResult.success) {
                    stats.sent++;
                    logs.push(`Sent to ${lead.primary_email}`);
                } else {
                    stats.failed++;
                    logs.push(`DB Update Failed for ${lead.primary_email}`);
                }
            } else {
                stats.failed++;
                logs.push(`Email Failed to ${lead.primary_email}: ${sendResult.error}`);
            }

            await new Promise(r => setTimeout(r, 500)); // Rate limit safety
        }

        res.json({ success: true, stats, logs });

    } catch (err: any) {
        console.error('[Admin] Trigger batch error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// TRIGGER BATCH AUDIT: POST /api/admin/trigger-batch-audit
router.post('/trigger-batch-audit', verifySupabaseUser, async (req, res) => {
    try {
        console.log('[Admin] Manually triggering batch AUDIT process...');

        // Dynamic imports
        const { getUncontactedLeads, markLeadAsContacted, createAudit } = await import('../services/db');
        const { sendAuditEmail } = await import('../services/email');

        // Authorization: Only platform admins
        if ((req as AuthenticatedRequest).user?.role === 'agent') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const batchSize = Math.min(Number(req.body.batchSize) || 5, 20);

        const result = await getUncontactedLeads(batchSize);
        if (!result.success || !result.data) {
            return res.status(500).json({ error: result.error || 'Failed to fetch leads' });
        }

        const leads = result.data;
        const stats = { sent: 0, failed: 0, skipped: 0 };
        const logs: string[] = [];

        if (leads.length === 0) {
            return res.json({ message: 'No new leads to contact', stats, logs });
        }

        for (const lead of leads) {
            if (!lead.primary_email || !lead.primary_email.includes('@')) {
                stats.skipped++;
                continue;
            }

            // 1. Create Audit
            const auditRes = await createAudit(lead.id);
            if (!auditRes.success || !auditRes.data) {
                stats.failed++;
                logs.push(`Failed to create audit for ${lead.primary_email}`);
                continue;
            }

            const auditToken = auditRes.data.token;
            // Use the audit details page or the audit visualization page?
            // Usually /audit/:token
            const auditUrl = `${CLIENT_URL}/audit/${auditToken}?source=email_batch`;

            // 2. Send Audit Email
            const emailData = {
                agentName: lead.full_name,
                agentEmail: lead.primary_email,
                auditUrl: auditUrl,
                leadId: lead.id
            };

            const sendResult = await sendAuditEmail(emailData);

            if (sendResult.success) {
                const updateResult = await markLeadAsContacted(lead.id);
                if (updateResult.success) {
                    stats.sent++;
                    logs.push(`Audit Sent to ${lead.primary_email}`);
                } else {
                    stats.failed++;
                    logs.push(`DB Update Failed for ${lead.primary_email}`);
                }
            } else {
                stats.failed++;
                logs.push(`Email Failed to ${lead.primary_email}: ${sendResult.error}`);
            }

            await new Promise(r => setTimeout(r, 500)); // Rate limit safety
        }

        res.json({ success: true, stats, logs });

    } catch (err: any) {
        console.error('[Admin] Trigger batch audit error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CRON: Send Trial Expiry Reminders

// CRON: Send Trial Expiry Reminders
// POST /api/admin/cron/trial-expiry-reminders
// Call this daily (e.g., via Render Cron, GitHub Actions, or external scheduler)
router.post('/cron/trial-expiry-reminders', async (req, res) => {
    try {
        // Verify cron secret (optional security)
        const cronSecret = req.headers['x-cron-secret'];
        const expectedSecret = process.env.CRON_SECRET;
        if (expectedSecret && cronSecret !== expectedSecret) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        const TRIAL_DURATION_DAYS = 30;
        const REMINDER_DAYS_BEFORE = 10;
        const DAYS_SINCE_TRIAL_START = TRIAL_DURATION_DAYS - REMINDER_DAYS_BEFORE; // 20 days

        // Find agents whose trial started exactly 20 days ago (so 10 days left)
        // We check for a 24-hour window to avoid missing anyone
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - DAYS_SINCE_TRIAL_START);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        console.log(`[Cron] Checking for trials started between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

        const { data: agents, error } = await db
            .from('scraped_agents')
            .select('id, full_name, primary_email, website_slug, trial_started_at, is_paid')
            .gte('trial_started_at', startOfDay.toISOString())
            .lte('trial_started_at', endOfDay.toISOString())
            .eq('is_paid', false); // Only unpaid (trial) users

        if (error) throw error;

        if (!agents || agents.length === 0) {
            console.log('[Cron] No trial reminders to send today');
            return res.json({ success: true, sent: 0 });
        }

        console.log(`[Cron] Found ${agents.length} agents to remind`);

        const { sendTrialExpiryReminderEmail } = await import('../services/email');
        const CLIENT_URL = process.env.CLIENT_URL || 'https://siteo.io';
        let sentCount = 0;

        for (const agent of agents) {
            if (!agent.primary_email || !agent.website_slug) continue;

            const result = await sendTrialExpiryReminderEmail({
                agentName: agent.full_name,
                agentEmail: agent.primary_email,
                adminUrl: `${CLIENT_URL}/w/${agent.website_slug}/admin?source=email`,
                daysLeft: REMINDER_DAYS_BEFORE
            });

            if (result.success) {
                sentCount++;
                console.log(`[Cron] Sent reminder to ${agent.primary_email}`);
            } else {
                console.error(`[Cron] Failed to send to ${agent.primary_email}:`, result.error);
            }
        }

        res.json({ success: true, sent: sentCount, total: agents.length });

    } catch (err: any) {
        console.error('[Cron] Trial reminders error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CRON ENDPOINT: POST /api/admin/cron/run-batch
// Authenticated via CRON_SECRET header
router.post('/cron/run-batch', async (req, res) => {
    const cronSecret = req.headers['x-cron-secret'] || req.headers['authorization']?.replace('Bearer ', '');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || cronSecret !== expectedSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('[Cron] Triggering batch email process...');
        const { getUncontactedLeads, markLeadAsContacted } = await import('../services/db');
        const { sendWelcomeEmail } = await import('../services/email');

        // Default to 5 emails per run for cron
        const batchSize = 5;

        const result = await getUncontactedLeads(batchSize);
        if (!result.success || !result.data) {
            return res.json({ success: true, count: 0, message: 'No leads to process' });
        }

        const leads = result.data;
        let sentCount = 0;

        for (const lead of leads) {
            // Use centralized URL logic
            const safeSlug = lead.website_slug || lead.id;
            // For cron, we want to track source=cron or similar
            // But let's keep consistent with manual batch for now -> source=email
            const websiteUrl = lead.website_config?.custom_domain
                ? `https://${lead.website_config.custom_domain}`
                : `${CLIENT_URL}/w/${safeSlug}?source=email`;

            const adminUrl = `${CLIENT_URL}/w/${safeSlug}/admin/login?source=email`;
            const defaultPassword = process.env.DEFAULT_AGENT_PASSWORD || 'welcome123';

            const emailResult = await sendWelcomeEmail({
                agentName: lead.full_name,
                agentEmail: lead.primary_email,
                websiteUrl,
                adminUrl,
                defaultPassword,
                leadId: lead.id
            });

            if (emailResult.success) {
                await markLeadAsContacted(lead.id);
                sentCount++;
            }
        }

        res.json({ success: true, sent: sentCount });

    } catch (err: any) {
        console.error('[Cron] Batch error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Purge agents with no email - PROTECTED
// POST /api/admin/purge-no-email
router.post('/purge-no-email', verifySupabaseUser, async (_req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        // Find all agents with null or empty primary_email
        const { data: nullAgents, error: nullError } = await db
            .from('scraped_agents')
            .select('id')
            .is('primary_email', null);

        if (nullError) {
            console.error('[Admin] Fetch null-email agents error:', nullError);
            return res.status(500).json({ error: nullError.message });
        }

        const { data: emptyAgents, error: emptyError } = await db
            .from('scraped_agents')
            .select('id')
            .eq('primary_email', '');

        if (emptyError) {
            console.error('[Admin] Fetch empty-email agents error:', emptyError);
            return res.status(500).json({ error: emptyError.message });
        }

        const ids = [
            ...(nullAgents || []),
            ...(emptyAgents || [])
        ].map((a: any) => a.id);

        if (ids.length === 0) {
            return res.json({ success: true, deleted: 0 });
        }

        console.log(`[Admin] Purging ${ids.length} agents with no email...`);

        const { error: deleteError } = await db
            .from('scraped_agents')
            .delete()
            .in('id', ids);

        if (deleteError) {
            console.error('[Admin] Delete error:', deleteError);
            return res.status(500).json({ error: deleteError.message });
        }

        console.log(`[Admin] Purged ${ids.length} no-email agents.`);
        res.json({ success: true, deleted: ids.length });

    } catch (err: any) {
        console.error('[Admin] Purge no-email error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

export const adminRoutes = router;

// CRON: Prune Expired Trials (Delete unpaid agents > 30 days)
// POST /api/admin/cron/prune-expired
router.post('/cron/prune-expired', async (req, res) => {
    try {
        const cronSecret = req.headers['x-cron-secret'] || req.headers['authorization']?.replace('Bearer ', '');
        const expectedSecret = process.env.CRON_SECRET;

        if (expectedSecret && cronSecret !== expectedSecret) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        const TRIAL_DURATION_DAYS = 30;

        // Find agents whose trial started > 30 days ago AND are unpaid
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - TRIAL_DURATION_DAYS);

        console.log(`[Cron] Pruning agents with trial started before ${cutoffDate.toISOString()}`);

        const { data: expiredAgents, error } = await db
            .from('scraped_agents')
            .select('id, full_name, primary_email, website_slug')
            .lt('trial_started_at', cutoffDate.toISOString())
            .eq('is_paid', false);

        if (error) throw error;

        if (!expiredAgents || expiredAgents.length === 0) {
            console.log('[Cron] No expired agents to prune.');
            return res.json({ success: true, deleted: 0 });
        }

        console.log(`[Cron] Found ${expiredAgents.length} expired agents to prune.`);
        let deletedCount = 0;

        for (const agent of expiredAgents) {
            console.log(`[Cron] Deleting expired agent: ${agent.full_name} (${agent.id})`);

            // 1. Delete Storage Assets (if possible/needed)
            // Note: Storage often requires listing files first.
            // Simplified: Try to delete known potential files if usage pattern is predictable,
            // or rely on manual cleanup. Getting full recursive delete is expensive here.
            // We'll skip complex storage cleanup for V1 to ensure DB consistency first.

            // 2. Delete Email Logs explicitly (in case CASCADE is missing)
            await db.from('email_logs').delete().eq('lead_id', agent.id);
            // Also delete by recipient email just in case lead_id wasn't linked?
            // Safer to stick to lead_id to avoid deleting unrelated logs.

            // 3. Delete the Agent (Cascades to lead_audits usually)
            const { error: deleteError } = await db
                .from('scraped_agents')
                .delete()
                .eq('id', agent.id);

            if (deleteError) {
                console.error(`[Cron] Failed to delete agent ${agent.id}:`, deleteError);
            } else {
                deletedCount++;
            }
        }

        res.json({ success: true, deleted: deletedCount });

    } catch (err: any) {
        console.error('[Cron] Prune expired error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// MANUAL PRUNE: POST /api/admin/prune-expired
// Secured by Session Auth (for Admin UI button)
router.post('/prune-expired', verifySupabaseUser, async (req, res) => {
    try {
        // Authorization: Only platform admins 
        // For now, any authenticated user (since this is single-tenant admin app effectively)

        const db = getDb();
        if (!db) return res.status(500).json({ error: 'Database not available' });

        const TRIAL_DURATION_DAYS = 30;

        // Find agents whose trial started > 30 days ago AND are unpaid
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - TRIAL_DURATION_DAYS);

        console.log(`[Manual] Pruning agents with trial started before ${cutoffDate.toISOString()}`);

        const { data: expiredAgents, error } = await db
            .from('scraped_agents')
            .select('id, full_name, primary_email, website_slug')
            .lt('trial_started_at', cutoffDate.toISOString())
            .eq('is_paid', false);

        if (error) throw error;

        if (!expiredAgents || expiredAgents.length === 0) {
            console.log('[Manual] No expired agents to prune.');
            return res.json({ success: true, deleted: 0 });
        }

        console.log(`[Manual] Found ${expiredAgents.length} expired agents to prune.`);
        let deletedCount = 0;

        for (const agent of expiredAgents) {
            console.log(`[Manual] Deleting expired agent: ${agent.full_name} (${agent.id})`);

            // 1. Delete Email Logs
            await db.from('email_logs').delete().eq('lead_id', agent.id);

            // 2. Delete Agent
            const { error: deleteError } = await db
                .from('scraped_agents')
                .delete()
                .eq('id', agent.id);

            if (deleteError) {
                console.error(`[Manual] Failed to delete agent ${agent.id}:`, deleteError);
            } else {
                deletedCount++;
            }
        }

        res.json({ success: true, deleted: deletedCount });

    } catch (err: any) {
        console.error('[Manual] Prune expired error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
