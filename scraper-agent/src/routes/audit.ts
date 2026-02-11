
import express from 'express';
import { verifySupabaseUser } from '../middleware/supabaseAuth';
import { createAudit, getAuditByToken, submitAudit, isFeatureEnabled } from '../services/db';
import { sendAuditEmail } from '../services/email';
import { getLeadById } from '../services/db';

const router = express.Router();

const AUDIT_FEATURE_KEY = 'audit_feature_enabled';

// Middleware to check feature flag
const checkAuditFeature = async (req: any, res: any, next: any) => {
    const enabled = await isFeatureEnabled(AUDIT_FEATURE_KEY);
    if (!enabled) {
        return res.status(503).json({ error: 'Audit feature is currently disabled.' });
    }
    next();
};

// 1. Create Audit (Protected) - Admins trigger this
router.post('/create', verifySupabaseUser, checkAuditFeature, async (req, res) => {
    const { leadId } = req.body;

    if (!leadId) {
        return res.status(400).json({ error: 'Lead ID is required' });
    }

    try {
        // Fetch lead details first
        const leadResult = await getLeadById(leadId);
        if (!leadResult.success || !leadResult.data) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        const lead = leadResult.data;

        if (!lead.primary_email) {
            return res.status(400).json({ error: 'Lead has no email configured' });
        }

        // Create the audit record
        const auditResult = await createAudit(leadId);
        if (!auditResult.success || !auditResult.data) {
            return res.status(500).json({ error: auditResult.error || 'Failed to create audit' });
        }
        const audit = auditResult.data;

        // Construct the Public Audit URL
        // Currently running on localhost or via environment variable?
        // Let's rely on the referer or a configured base URL.
        const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173'; // Default to local dev
        const auditUrl = `${APP_URL}/audit/${audit.token}?source=audit`;

        // Send Email
        const emailResult = await sendAuditEmail({
            agentName: lead.full_name,
            agentEmail: lead.primary_email,
            auditUrl: auditUrl
        });

        if (!emailResult.success) {
            // Note: We created the audit but failed to send email.
            // We return success: false for the UI to show an error, but the audit record exists.
            return res.status(500).json({ error: 'Audit created but email failed: ' + emailResult.error });
        }

        res.json({ success: true, auditId: audit.id, message: 'Audit sent successfully' });

    } catch (err: any) {
        console.error('[Audit API] Error creating audit:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Audit by Token (Public)
router.get('/:token', checkAuditFeature, async (req, res) => {
    const { token } = req.params;

    try {
        const result = await getAuditByToken(token);

        if (!result.success || !result.data) {
            return res.status(404).json({ error: 'Audit not found or expired' });
        }

        const audit = result.data;

        // Check expiration
        if (new Date(audit.expires_at) < new Date() && audit.status !== 'completed') {
            return res.status(410).json({ error: 'This audit link has expired.' });
        }

        // Return safe data (mask sensitive lead info if needed, but name/brokerage is public usually)
        res.json({
            token: audit.token,
            status: audit.status,
            agentName: audit.lead?.full_name,
            brokerage: audit.lead?.brokerage,
            websiteSlug: audit.lead?.website_slug, // Potentially useful for personalization
            expiresAt: audit.expires_at,
            results: audit.status === 'completed' ? {
                score: audit.computed_score,
                answers: audit.answers,
                completedAt: audit.completed_at
            } : undefined
        });

    } catch (err: any) {
        console.error('[Audit API] Error fetching audit:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Submit Audit (Public)
router.post('/:token/submit', checkAuditFeature, async (req, res) => {
    const { token } = req.params;
    const { answers } = req.body;

    console.log('[Audit Submit] ===== START =====');
    console.log('[Audit Submit] Token:', token);
    console.log('[Audit Submit] Answers:', JSON.stringify(answers));

    if (!answers) {
        return res.status(400).json({ error: 'Answers are required' });
    }

    try {
        // 1. Get Audit to check status
        const auditResult = await getAuditByToken(token);
        console.log('[Audit Submit] DB result success:', auditResult.success);

        if (!auditResult.success || !auditResult.data) {
            console.log('[Audit Submit] ABORT: Audit not found');
            return res.status(404).json({ error: 'Audit not found' });
        }
        const audit = auditResult.data;

        // Log the full lead object to diagnose missing fields
        console.log('[Audit Submit] audit.status:', audit.status);
        console.log('[Audit Submit] audit.lead:', JSON.stringify(audit.lead));
        console.log('[Audit Submit] audit.lead_id:', audit.lead_id);

        if (audit.status === 'completed') {
            console.log('[Audit Submit] ABORT: Already completed');
            return res.status(400).json({ error: 'Audit already completed' });
        }

        if (new Date(audit.expires_at) < new Date()) {
            console.log('[Audit Submit] ABORT: Expired');
            return res.status(410).json({ error: 'Audit link expired' });
        }

        // 2. Calculate Score & Scenario Server-Side
        const positives = [answers.hasWebsite, answers.hasFollowUp, answers.noZillowRel].filter(Boolean).length;

        let baseScore: number;
        let scenario: number;
        const variance = Math.floor(Math.random() * 7) - 3;

        if (positives === 3) {
            scenario = 1;
            baseScore = 88 + variance;
        } else if (positives === 2) {
            scenario = 2;
            baseScore = 63 + variance;
        } else if (positives === 1) {
            scenario = 3;
            baseScore = 42 + variance;
        } else {
            scenario = 4;
            baseScore = 22 + variance;
        }

        const score = Math.max(15, Math.min(95, baseScore));
        console.log('[Audit Submit] Score:', score, 'Scenario:', scenario);

        // 3. Save to DB
        const saveResult = await submitAudit(token, answers, score);
        console.log('[Audit Submit] Save result:', JSON.stringify(saveResult));

        if (!saveResult.success) {
            return res.status(500).json({ error: saveResult.error });
        }

        // 4. Send Admin Access Email (so they can claim the site)
        console.log('[Audit Submit] Checking email conditions...');
        console.log('[Audit Submit]   audit.lead exists?', !!audit.lead);
        console.log('[Audit Submit]   audit.lead?.primary_email?', audit.lead?.primary_email);
        console.log('[Audit Submit]   audit.lead?.full_name?', audit.lead?.full_name);
        console.log('[Audit Submit]   audit.lead?.website_slug?', audit.lead?.website_slug);

        if (audit.lead && audit.lead.primary_email) {
            console.log('[Audit Submit] ✅ Conditions met, sending admin access email...');
            try {
                const { sendAdminAccessEmail } = await import('../services/email');
                const CLIENT_URL = process.env.VITE_APP_URL || 'https://siteo.io';
                const slug = audit.lead.website_slug || audit.lead_id;
                const adminUrl = `${CLIENT_URL}/w/${slug}/admin?source=email`;
                const password = process.env.DEFAULT_AGENT_PASSWORD || 'welcome123';

                console.log('[Audit Submit] Email params:', {
                    agentName: audit.lead.full_name,
                    agentEmail: audit.lead.primary_email,
                    adminUrl,
                    password: '***'
                });

                const emailResult = await sendAdminAccessEmail({
                    agentName: audit.lead.full_name,
                    agentEmail: audit.lead.primary_email,
                    adminUrl,
                    defaultPassword: password
                });

                console.log('[Audit Submit] Email result:', JSON.stringify(emailResult));
            } catch (emailErr: any) {
                console.error('[Audit Submit] ❌ Email send exception:', emailErr.message);
            }
        } else {
            console.log('[Audit Submit] ⚠️ SKIPPED email: conditions not met');
            if (!audit.lead) {
                console.log('[Audit Submit]   → audit.lead is falsy (null/undefined)');
            } else if (!audit.lead.primary_email) {
                console.log('[Audit Submit]   → primary_email is falsy:', audit.lead.primary_email);
            }
        }

        console.log('[Audit Submit] ===== DONE =====');
        res.json({
            success: true,
            results: {
                score,
                scenario,
                answers
            }
        });

    } catch (err: any) {
        console.error('[Audit API] Error submitting audit:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export const auditRoutes = router;
