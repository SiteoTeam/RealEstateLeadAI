
import express from 'express';
import { verifySupabaseUser } from '../middleware/supabaseAuth';
import { createAudit, getAuditByToken, submitAudit, isFeatureEnabled } from '../services/db';
import { sendAuditEmail } from '../services/email';
import { getLeadById } from '../services/db';
import { CLIENT_URL } from '../utils/urls';

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
        const auditUrl = `${CLIENT_URL}/audit/${audit.token}?source=audit`;

        // Send Email
        const emailResult = await sendAuditEmail({
            agentName: lead.full_name,
            agentEmail: lead.primary_email,
            auditUrl: auditUrl,
            leadId: leadId
        });

        if (!emailResult.success) {
            // Note: We created the audit but failed to send email.
            // We return success: false for the UI to show an error, but the audit record exists.
            return res.status(500).json({ error: 'Audit created but email failed: ' + emailResult.error });
        }

        res.json({ success: true, auditId: audit.id, message: 'Audit sent successfully' });

    } catch (err: any) {
        console.error('[Audit API] Error creating audit:', err);
        res.status(500).json({ error: 'Internal server error' });
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

    if (!answers) {
        return res.status(400).json({ error: 'Answers are required' });
    }

    try {
        // 1. Get Audit to check status
        const auditResult = await getAuditByToken(token);
        if (!auditResult.success || !auditResult.data) {
            return res.status(404).json({ error: 'Audit not found' });
        }
        const audit = auditResult.data;

        if (audit.status === 'completed') {
            return res.status(400).json({ error: 'Audit already completed' });
        }

        if (new Date(audit.expires_at) < new Date()) {
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

        // 3. Save to DB
        const saveResult = await submitAudit(token, answers, score);

        if (!saveResult.success) {
            return res.status(500).json({ error: saveResult.error });
        }

        // Note: Admin access email is triggered automatically by the
        // Resend email.clicked webhook in webhooks.ts when the agent
        // first clicks the audit email link.

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
