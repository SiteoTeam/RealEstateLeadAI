/**
 * API Server for Agent Scraper
 * 
 * Exposes the CB extraction as an HTTP endpoint for the web frontend.
 * Automatically saves extracted profiles to the Lead Management System (Supabase).
 */

import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { extractCBProfile } from './extractors/coldwellbanker';
import { saveProfile } from './services/db';

dotenv.config();

console.log('[Server] Starting Agent Scraper API...');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
// Capture raw body for Stripe webhook verification
app.use(express.json({
    verify: (req: any, res, buf) => {
        req.rawBody = buf;
    }
}));

import { verifySupabaseUser } from './middleware/supabaseAuth';
import { adminRoutes } from './routes/admin';
app.use('/api/admin', adminRoutes);

import { publicRoutes } from './routes/public';
app.use('/api/public', publicRoutes);

import { webhookRoutes } from './routes/webhooks';
app.use('/api/webhooks', webhookRoutes);

import { stripeRoutes } from './routes/stripe';
app.use('/api/stripe', stripeRoutes);

import agentRoutes from './routes/agent';
app.use('/api/agent', agentRoutes);

import { auditRoutes } from './routes/audit';
app.use('/api/audit', auditRoutes);

import { cronRoutes } from './routes/cron';
app.use('/api/cron', cronRoutes);
import { seedDefaultPasswords } from './services/auth';

// Run seeding on startup
// seedDefaultPasswords().catch(err => console.error('[Server] Seeding failed:', err));

// Admin Seed Route (Protected)
app.post('/api/admin/seed-passwords', verifySupabaseUser, async (req, res) => {
    try {
        await seedDefaultPasswords();
        res.json({ success: true, message: 'Seeding process triggered' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// CB Profile Extraction - PROTECTED
app.post('/api/extract', verifySupabaseUser, async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Validate it's a CB URL
    if (!url.includes('coldwellbanker.com')) {
        return res.status(400).json({ error: 'URL must be from coldwellbanker.com' });
    }

    try {
        console.log(`[API] Extracting profile from: ${url}`);
        const profile = await extractCBProfile(url);

        if (!profile.extraction_success) {
            // If provided extracted data but marked as failed, return it with 422
            return res.status(422).json(profile);
        }

        // Auto-Save to Database
        console.log('[API] Auto-saving profile to Lead Management System...');
        const saveResult = await saveProfile(profile);

        // Return profile with save status
        res.json({
            ...profile,
            saved_to_db: saveResult.success,
            db_id: saveResult.id,
            db_error: saveResult.error
        });

    } catch (error: any) {
        console.error('[API] Extraction error:', error);
        res.status(500).json({ error: error.message || 'Extraction failed' });
    }
});

import { getLeads } from './services/db';

// Get All Leads - PROTECTED
app.get('/api/leads', verifySupabaseUser, async (req, res) => {
    try {
        console.log('[API] Fetching leads...');
        const result = await getLeads();

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json(result.data);
    } catch (error: any) {
        console.error('[API] Error fetching leads:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// Delete Lead - PROTECTED
import { deleteLead, updateLeadConfig, getLeadBySlug } from './services/db';

app.delete('/api/leads/:id', verifySupabaseUser, async (req, res) => {
    try {
        const { id } = req.params;
        const leadId = Array.isArray(id) ? id[0] : id; // Handle potential array from params

        console.log(`[API] Deleting lead: ${leadId}`);

        const result = await deleteLead(leadId);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error deleting lead:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

// Update Lead Website Config (slug, published)
app.patch('/api/leads/:id/config', verifySupabaseUser, async (req, res) => {
    try {
        const { id } = req.params;
        const leadId = Array.isArray(id) ? id[0] : id;

        const { website_slug, website_published } = req.body;
        console.log(`[API] Updating lead config: ${leadId}`, { website_slug, website_published });

        const result = await updateLeadConfig(leadId, { website_slug, website_published });

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating lead config:', error);
        res.status(500).json({ error: 'Failed to update lead config' });
    }
});

// Get Website by Slug (Public) - LEFT PUBLIC
app.get('/api/website/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const slugValue = Array.isArray(slug) ? slug[0] : slug;

        console.log(`[API] Fetching website: ${slugValue}`);

        const result = await getLeadBySlug(slugValue);

        if (!result.success || !result.data) {
            return res.status(404).json({ error: 'Website not found' });
        }

        res.json(result.data);
    } catch (error: any) {
        console.error('[API] Error fetching website:', error);
        res.status(500).json({ error: 'Failed to fetch website' });
    }
});

// Contact Form Submission
import { sendContactEmail } from './services/email';

// Update Lead Profile Data - PROTECTED
import { updateLead } from './services/db';

app.patch('/api/leads/:id', verifySupabaseUser, async (req, res) => {
    try {
        const { id } = req.params;
        const leadId = Array.isArray(id) ? id[0] : id;

        const updateData = req.body;

        console.log(`[API] Updating lead profile: ${leadId}`);

        const result = await updateLead(leadId, updateData);

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[API] Error updating lead:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, message, agentId, token } = req.body;

        // Validate required fields
        if (!name || !email || !message || !agentId) {
            return res.status(400).json({ error: 'Missing required fields: name, email, message, agentId' });
        }

        // --- reCAPTCHA Validation ---
        const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;
        if (RECAPTCHA_SECRET) {
            if (!token) {
                return res.status(400).json({ error: 'Missing reCAPTCHA token' });
            }
            try {
                // Verify token with Google
                const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`;
                // Using axios (already imported? No, need to import or require)
                // Since this is a TS file and axios is in package.json, let's use dynamic import or require
                const axios = require('axios');
                const recaptchaRes = await axios.post(verifyUrl);

                const { success, score } = recaptchaRes.data;

                if (!success || (score !== undefined && score < 0.5)) {
                    console.warn(`[API] reCAPTCHA failed for ${email}: Success=${success}, Score=${score}`);
                    return res.status(400).json({ error: 'Message flagged as spam by reCAPTCHA.' });
                }
                console.log(`[API] reCAPTCHA passed: Score=${score}`);

            } catch (verErr: any) {
                console.error('[API] reCAPTCHA verification error:', verErr.message);
                // Fail open or closed? Let's fail closed for security
                return res.status(500).json({ error: 'Spam check failed' });
            }
        }
        // ----------------------------

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        console.log(`[API] Contact form submission for agent ${agentId} from ${email}`);

        // Fetch agent details to get their email
        const { getLeadById } = await import('./services/db');
        const agentResult = await getLeadById(agentId);

        if (!agentResult.success || !agentResult.data) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        const agent = agentResult.data;
        if (!agent.primary_email) {
            return res.status(400).json({ error: 'Agent has no email configured' });
        }

        // Send email
        const emailResult = await sendContactEmail({
            visitorName: name,
            visitorEmail: email,
            visitorPhone: phone,
            message,
            agentName: agent.full_name,
            agentEmail: agent.primary_email,
        });

        if (!emailResult.success) {
            console.error('[API] Email send failed:', emailResult.error);
            return res.status(500).json({ error: 'Failed to send message. Please try again.' });
        }

        res.json({ success: true, message: 'Your message has been sent!' });

    } catch (error: any) {
        console.error('[API] Contact form error:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Agent Scraper API running on http://localhost:${PORT}`);
    console.log(`   POST /api/extract - Extract & Auto-Save CB profile (Protected)`);
    console.log(`   POST /api/cron    - Trigger Manual Batch Emails (Protected)`);
    console.log(`   POST /api/contact - Send contact form email (Public)`);
    console.log(`   GET  /api/health  - Health check\n`);
});

// Global Error Handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
    // Ideally we'd restart, but preventing immediate exit might help debug
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});
