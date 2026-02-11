/**
 * API Server for Agent Scraper
 * 
 * Exposes the CB extraction as an HTTP endpoint for the web frontend.
 * Automatically saves extracted profiles to the Lead Management System (Supabase).
 */

import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import { verifySupabaseUser } from './middleware/supabaseAuth';
import { adminRoutes } from './routes/admin';
import { publicRoutes } from './routes/public';
import { webhookRoutes } from './routes/webhooks';
import { stripeRoutes } from './routes/stripe';
import agentRoutes from './routes/agent';
import { auditRoutes } from './routes/audit';
import { leadsRoutes } from './routes/leads';
import { websiteRoutes } from './routes/website';
import { contactRoutes } from './routes/contact_route';
import { seedDefaultPasswords } from './services/auth';

dotenv.config();

console.log('[Server] Starting Agent Scraper API...');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: [
        'https://siteo.io',
        'https://www.siteo.io',
        ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173'] : [])
    ],
    credentials: true
}));

// Capture raw body for Stripe webhook verification
app.use(express.json({
    verify: (req: any, res, buf) => {
        req.rawBody = buf;
    }
}));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api', leadsRoutes); // Mounts /extract, /leads
app.use('/api/website', websiteRoutes); // Mounts /:slug
app.use('/api/contact', contactRoutes); // Mounts /

// Admin Seed Route (Protected)
app.post('/api/admin/seed-passwords', verifySupabaseUser, async (req, res) => {
    try {
        await seedDefaultPasswords();
        res.json({ success: true, message: 'Seeding process triggered' });
    } catch (err: any) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
});
