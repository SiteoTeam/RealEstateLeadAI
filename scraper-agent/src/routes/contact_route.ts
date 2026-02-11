
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendContactEmail } from '../services/email';

const router = Router();

// Contact Form Rate Limiter: 10 requests per 15 minutes per IP
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many contact requests, please try again later.' }
});

router.post('/', contactLimiter, async (req, res) => {
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

        // Fetch agent details to get email
        const { getLeadById } = await import('../services/db');
        const { success: agentSuccess, data: agent } = await getLeadById(agentId);

        if (!agentSuccess || !agent || !agent.primary_email) {
            console.error(`[API] Agent not found or no email for ID: ${agentId}`);
            return res.status(404).json({ error: 'Agent not found' });
        }

        console.log(`[API] Contact form submission for agent ${agent.full_name} (${agent.primary_email}) from ${email}`);

        const result = await sendContactEmail({
            agentName: agent.full_name,
            agentEmail: agent.primary_email,
            visitorName: name,
            visitorEmail: email,
            visitorPhone: phone,
            message,
            // agentId is not in ContactFormData, so we don't pass it.
        });

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        res.json({ success: true });

    } catch (error: any) {
        console.error('[API] Contact form error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

export const contactRoutes = router;
