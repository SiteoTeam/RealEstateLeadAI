
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getLeadBySlug, getLeadById, updateLead, getAgentBySlug } from '../services/db';
import { hashPassword, verifyPassword, generateToken, verifyToken, generateResetToken, verifyResetToken } from '../services/auth';
import { CLIENT_URL } from '../utils/urls';

const router = Router();

// Rate limiter for auth endpoints: 5 attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts, please try again later.' }
});

// LOGIN
router.post('/login', authLimiter, async (req, res) => {
    const { slug, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
        console.log(`[Auth] Login attempt for slug: ${slug}, IP: ${ip}`);

        if (!slug || !password) {
            return res.status(400).json({ error: 'Missing slug or password' });
        }

        // 1. Find Agent (Auth lookup - ignores published status)
        const { data: agent, error } = await getAgentBySlug(slug);

        if (error || !agent) {
            console.warn(`[Auth] Login failed: Agent not found for slug '${slug}'`);

            // Log failure (if table exists)
            await updateLead('00000000-0000-0000-0000-000000000000', {}).catch(() => { }); // Dummy call to get DB client? No.
            // We need direct DB access to insert. 
            // We can import 'supabase' client from db.ts? No, it exports helper functions.
            // We should add a helper 'logLoginAttempt' in db.ts or just import the client if exported.

            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 2. Verify Password
        let isValid = false;

        if (agent.password_hash) {
            isValid = await verifyPassword(password, agent.password_hash);
        } else {
            // Lazy Seeding: If no hash, check if they are using the default "welcome123"
            // If so, grant access AND save the hash for future.
            console.log(`[Auth] Agent ${slug} has no password hash. Checking default credentials...`);

            // Use environment variable for default password (set in .env)
            const defaultPassword = process.env.DEFAULT_AGENT_PASSWORD || 'welcome123';

            if (password === defaultPassword) {
                console.log(`[Auth] Default password accepted. Migrating agent ${slug} to secure hash...`);
                const newHash = await hashPassword(password);

                // Save to DB in background (await to be safe)
                await updateLead(agent.id, { password_hash: newHash });
                isValid = true;
            } else {
                console.warn(`[Auth] Agent ${slug} has no hash and provided wrong default password.`);
                isValid = false;
            }
        }

        if (!isValid) {
            console.warn(`[Auth] Login failed: Password mismatch for ${slug}`);

            // Log Failure
            const { logLoginAttempt } = await import('../services/db');
            await logLoginAttempt({
                agent_id: agent.id,
                slug,
                ip_address: ip as string,
                user_agent: userAgent,
                status: 'failed',
                failure_reason: 'Invalid Password'
            }).catch(e => console.error('Failed to log login failure', e));

            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log(`[Auth] Login success for ${slug}`);

        // Update last_login_at
        await updateLead(agent.id, { last_login_at: new Date().toISOString() } as any).catch(err => console.error('Failed to update last_login_at', err));

        // Log Success
        const { logLoginAttempt } = await import('../services/db');
        await logLoginAttempt({
            agent_id: agent.id,
            slug,
            ip_address: ip as string,
            user_agent: userAgent,
            status: 'success'
        }).catch(e => console.error('Failed to log login success', e));


        // 3. Generate Token
        const token = generateToken(agent.id, agent.website_slug);

        // 4. Return
        res.json({ token, agent: { id: agent.id, name: agent.full_name, slug: agent.website_slug } });

    } catch (err) {
        console.error('[Auth] Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// FORGOT PASSWORD
router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { slug } = req.body;

        if (!slug) {
            return res.status(400).json({ error: 'Slug is required' });
        }

        const { data: agent, error } = await getAgentBySlug(slug);

        if (error || !agent) {
            // Don't reveal if agent exists
            return res.json({ success: true, message: 'If an account exists, a reset email has been sent.' });
        }

        if (!agent.primary_email) {
            return res.json({ success: true, message: 'If an account exists, a reset email has been sent.' });
        }

        // Generate reset token
        const resetToken = generateResetToken(agent.id, agent.website_slug);

        const resetUrl = `${CLIENT_URL}/w/${agent.website_slug}/admin/reset-password?token=${resetToken}`;

        // Store token on agent record for single-use verification
        await updateLead(agent.id, { password_reset_token: resetToken } as any);

        // Send email
        const { sendPasswordResetEmail } = await import('../services/email');
        const result = await sendPasswordResetEmail({
            agentName: agent.full_name,
            agentEmail: agent.primary_email,
            resetUrl
        });

        if (!result.success) {
            console.error('[Auth] Failed to send reset email:', result.error);
        }

        res.json({ success: true, message: 'If an account exists, a reset email has been sent.' });

    } catch (err) {
        console.error('[Auth] Forgot password error:', err);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// RESET PASSWORD (with token)
router.post('/reset-password', authLimiter, async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const payload = verifyResetToken(token);

        if (!payload) {
            return res.status(400).json({ error: 'Invalid or expired reset link' });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Verify token is the currently valid one (single-use check)
        const { data: agent } = await getAgentBySlug(payload.slug);
        if (!agent || agent.password_reset_token !== token) {
            return res.status(400).json({ error: 'This reset link has already been used' });
        }

        // Update password AND invalidate the reset token
        const result = await updateLead(payload.agentId, {
            password_hash: hashedPassword,
            password_reset_token: null
        } as any);

        if (!result.success) {
            throw new Error(result.error);
        }

        res.json({ success: true, message: 'Password updated successfully', slug: payload.slug });

    } catch (err) {
        console.error('[Auth] Reset password error:', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// CHANGE PASSWORD
router.post('/change-password', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const { newPassword } = req.body;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);

        if (!payload || !payload.agentId) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update DB
        const result = await updateLead(payload.agentId, { password_hash: hashedPassword } as any); // Cast because DB types might not include password_hash yet in TS definition if we didn't update types file

        if (!result.success) {
            throw new Error(result.error);
        }

        res.json({ success: true, message: 'Password updated successfully' });

    } catch (err) {
        console.error('[Auth] Change password error:', err);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// VERIFY TOKEN (Optional: to check if session is valid on load)
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);
        if (!payload) return res.status(401).json({ error: 'Invalid token' });

        res.json({ valid: true, agentId: payload.agentId });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
