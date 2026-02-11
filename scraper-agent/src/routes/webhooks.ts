import { Router } from 'express';
import { Webhook } from 'svix';
import { getDb } from '../services/db';

const router = Router();

// Handle Resend Webhooks
// POST /api/webhooks/resend
router.post('/resend', async (req, res) => {
    try {
        // Verify webhook signature if secret is configured
        const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
        if (webhookSecret) {
            const svixHeaders = {
                'svix-id': req.headers['svix-id'] as string,
                'svix-timestamp': req.headers['svix-timestamp'] as string,
                'svix-signature': req.headers['svix-signature'] as string,
            };

            if (!svixHeaders['svix-id'] || !svixHeaders['svix-timestamp'] || !svixHeaders['svix-signature']) {
                console.warn('[Webhook] Missing svix verification headers');
                return res.status(401).json({ error: 'Missing webhook verification headers' });
            }

            try {
                const wh = new Webhook(webhookSecret);
                wh.verify(JSON.stringify(req.body), svixHeaders);
            } catch (verifyErr) {
                console.error('[Webhook] Signature verification failed:', verifyErr);
                return res.status(401).json({ error: 'Invalid webhook signature' });
            }
        } else {
            console.warn('[Webhook] RESEND_WEBHOOK_SECRET not set — skipping signature verification');
        }

        const event = req.body;

        // Resend sends an event object like:
        // { type: 'email.sent', data: { created_at, email_id, to, subject, ... } }
        // { type: 'email.opened', data: { created_at, email_id, ... } }

        const type = event.type;
        const data = event.data;

        if (!type || !data || !data.email_id) {
            console.error('[Webhook] Invalid payload:', JSON.stringify(event));
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }

        console.log(`[Webhook] Processing ${type} for ${data.email_id}`);

        const db = getDb();
        if (!db) {
            console.error('[Webhook] DB not available');
            return res.status(500).json({ error: 'Database unavailable' });
        }

        // Map Resend event types to our status
        let status = 'sent';
        switch (type) {
            case 'email.sent': status = 'sent'; break;
            case 'email.delivered': status = 'delivered'; break;
            case 'email.delivery_delayed': status = 'delivery_delayed'; break;
            case 'email.complained': status = 'complained'; break;
            case 'email.bounced': status = 'bounced'; break;
            case 'email.suppressed': status = 'bounced'; break; // Treat suppression as bounce
            case 'email.opened': status = 'opened'; break;
            case 'email.clicked': status = 'clicked'; break;
            default: status = 'sent'; // active/unknown
        }

        console.log(`[Webhook] Updating status to ${status} for ${data.email_id}`);

        // Update the log entry by resend_id
        const { data: updatedLog, error } = await db
            .from('email_logs')
            .update({
                status: status
            })
            .eq('resend_id', data.email_id)
            .select('lead_id, status')
            .single();

        if (error) {
            console.error('[Webhook] DB Update Error:', error);
            // Return 404 so Resend retries (handling race condition where webhook arrives before insert)
            return res.status(404).json({ message: 'Log not found or update failed' });
        }

        console.log(`[Webhook] DB Update Success. LeadID: ${updatedLog?.lead_id}. Checking trial trigger...`);

        // Start Trial on First Click & Send Admin Access Email
        if (type === 'email.clicked' && updatedLog?.lead_id) {
            console.log(`[Webhook] Click detected for lead ${updatedLog.lead_id}. Checking trial status...`);

            // Get lead details first
            const { data: lead } = await db
                .from('scraped_agents')
                .select('id, full_name, primary_email, website_slug, trial_started_at')
                .eq('id', updatedLog.lead_id)
                .single();

            // Only proceed if this is the FIRST click (trial not yet started)
            if (lead && !lead.trial_started_at) {
                console.log(`[Webhook] First click for ${lead.full_name}. Starting trial and sending admin access email...`);

                // Start trial
                const { error: trialError } = await db
                    .from('scraped_agents')
                    .update({ trial_started_at: new Date().toISOString() })
                    .eq('id', updatedLog.lead_id);

                if (trialError) {
                    console.error('[Webhook] Failed to start trial:', trialError);
                }

                // Send admin access email
                if (lead.primary_email && lead.website_slug) {
                    const { sendAdminAccessEmail } = await import('../services/email');
                    const CLIENT_URL = process.env.CLIENT_URL || 'https://siteo.io';
                    const DEFAULT_PASSWORD = process.env.DEFAULT_AGENT_PASSWORD || 'welcome123';

                    const result = await sendAdminAccessEmail({
                        agentName: lead.full_name,
                        agentEmail: lead.primary_email,
                        adminUrl: `${CLIENT_URL}/w/${lead.website_slug}/admin?source=email`,
                        defaultPassword: DEFAULT_PASSWORD
                    });

                    if (result.success) {
                        console.log(`[Webhook] Admin access email sent to ${lead.primary_email}`);
                    } else {
                        console.error('[Webhook] Failed to send admin access email:', result.error);
                    }
                }
            } else {
                console.log('[Webhook] Trial already started or lead not found, skipping admin access email');
            }
        }

        res.json({ success: true });

    } catch (err: any) {
        console.error('[Webhook] Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handle Stripe Webhooks
// POST /api/webhooks/stripe
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeKey) {
    stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
        typescript: true
    } as any);
} else {
    console.warn('[Stripe] STRIPE_SECRET_KEY is missing. Stripe functionality will be disabled.');
}

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/stripe', async (req: any, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('[Stripe Webhook] Missing signature or secret');
        return res.status(400).send('Webhook Error: Missing signature or secret');
    }

    let event;

    try {
        // Use rawBody captured in server.ts middleware
        if (!req.rawBody) {
            throw new Error('Raw body not captured');
        }
        if (!stripe) {
            throw new Error('Stripe not initialized');
        }
        event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret!);
    } catch (err: any) {
        console.error(`[Stripe Webhook] Signature Check Failed: ${err.message}`);
        return res.status(400).send('Webhook Error: Invalid signature');
    }

    // Handle events
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            const leadId = session.metadata?.leadId;

            console.log(`[Stripe Webhook] Payment success for lead: ${leadId}`);

            if (leadId) {
                const { error } = await supabase
                    .from('scraped_agents')
                    .update({
                        is_paid: true,
                        stripe_subscription_id: session.subscription,
                        stripe_customer_id: session.customer
                    })
                    .eq('id', leadId);

                if (error) {
                    console.error('[Stripe Webhook] Failed to update lead status:', error);
                    return res.status(500).send('Database Update Failed');
                }
            }
            break;

        case 'customer.subscription.deleted':
            const sub = event.data.object as Stripe.Subscription;
            console.log('[Stripe Webhook] Subscription deleted:', sub.id);
            // TODO: Set is_paid = false
            break;

        case 'invoice.payment_succeeded':
            const invoice = event.data.object as Stripe.Invoice;
            console.log(`[Stripe Webhook] Invoice payment succeeded: ${invoice.id}`);

            if (invoice.billing_reason === 'subscription_create') {
                // Already handled by checkout.session.completed usually, but good as fallback
                console.log('[Stripe Webhook] Subscription create invoice. Skipping to avoid double email if checkout handles triggers.');
                // Actually checkout.session.completed sets is_paid. It doesn't send email.
                // So we SHOULD send email here.
            }

            // Find agent by customer ID or Email (fallback)
            if (invoice.customer) {
                let { data: agent, error } = await supabase
                    .from('scraped_agents')
                    .select('*')
                    .eq('stripe_customer_id', invoice.customer)
                    .single();

                // Fallback: Try lookup by email if not found by customer ID (Race condition handling)
                if (!agent && invoice.customer_email) {
                    console.log(`[Stripe Webhook] Agent not found by customer ID ${invoice.customer}. Trying email: ${invoice.customer_email}`);
                    const { data: agentByEmail } = await supabase
                        .from('scraped_agents')
                        .select('*')
                        .eq('primary_email', invoice.customer_email)
                        .single();
                    agent = agentByEmail;

                    // If found by email, might as well update the customer ID now?
                    // Actually, checkout.session.completed will do it, but we can do it here too to be safe.
                    if (agent) {
                        await supabase.from('scraped_agents').update({ stripe_customer_id: invoice.customer as string }).eq('id', agent.id);
                    }
                }

                if (agent && agent.primary_email) {
                    const { sendPaymentSuccessEmail } = await import('../services/email');
                    await sendPaymentSuccessEmail({
                        agentName: agent.full_name,
                        agentEmail: agent.primary_email,
                        amount: `$${(invoice.amount_paid / 100).toFixed(2)}`,
                        date: new Date(invoice.created * 1000).toLocaleDateString(),
                        invoiceUrl: invoice.hosted_invoice_url || undefined
                    });
                    console.log(`[Stripe Webhook] Payment success email sent to ${agent.primary_email}`);
                } else {
                    console.warn(`[Stripe Webhook] Agent not found for customer ${invoice.customer} / email ${invoice.customer_email}`);
                }
            }
            break;

        default:
            console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});



// Handle Inbound Emails from Resend
// POST /api/webhooks/resend/inbound
// Handle Inbound Emails from Resend
// POST /api/webhooks/resend/inbound
router.post('/resend/inbound', async (req, res) => {
    try {
        const payload = req.body;

        // 1. Unwrap Payload (Resend events are wrapped in 'data')
        const emailData = payload.data || payload;
        const { from, to, subject, html, text, headers } = emailData;

        console.log(`[Webhook] Inbound email received from: ${from}`);

        // --- SAFETY CHECKS (CRITICAL) ---

        // 2. Hard Sender Block (Prevent self-loops)
        const lowerFrom = from?.toLowerCase() || '';
        if (
            lowerFrom.includes('siteoteam@gmail.com') ||
            lowerFrom.includes('hello@siteo.io') ||
            lowerFrom.endsWith('@siteo.io')
        ) {
            console.warn(`[Webhook] BLOCKED: Email from internal/forwarding address (${from}). Stopping to prevent loop.`);
            return res.status(200).send('Blocked (Loop Protection)');
        }

        // 3. Loop Detection via Headers or Subject
        // Resend adds specific headers. If we see them, it might be a forwarded message coming back.
        // Also check for our own subject prefix.
        if (subject?.startsWith('[Siteo Inbound]')) {
            console.warn(`[Webhook] BLOCKED: Detected recursive subject (${subject}).`);
            return res.status(200).send('Blocked (Recursive Subject)');
        }

        // Check headers for Resend-ID or other loop indicators if provided in payload
        // Note: Resend incoming webhook payload 'headers' structure varies, strictly checking subject/sender is safest for now.

        // 4. Strict Recipient Filtering
        // Only forward if it was sent TO hello@siteo.io
        // (This prevents forwarding emails cc'd to others or random misroutes)
        const recipientList = Array.isArray(to) ? to : [to];
        const isForSiteo = recipientList.some((r: string) => r && r.toLowerCase().includes('hello@siteo.io'));

        if (!isForSiteo) {
            console.log(`[Webhook] SKIPPED: Email not addressed to hello@siteo.io (To: ${to})`);
            return res.status(200).send('Skipped (Not for hello@siteo.io)');
        }

        // --- FORWARDING LOGIC ---

        const FORWARD_TO = 'siteoteam@gmail.com';
        const SENDER_IDENTITY = 'Siteo <hello@siteo.io>'; // MUST be verified domain

        // Dynamic import
        const { resend } = await import('../services/email');

        if (!resend) {
            console.error('[Webhook] Resend client not configured.');
            return res.status(500).json({ error: 'Resend client not configured' });
        }

        console.log(`[Webhook] Forwarding safe email from ${from} to ${FORWARD_TO}`);

        const { error } = await resend.emails.send({
            from: SENDER_IDENTITY,
            to: FORWARD_TO,
            replyTo: from, // Critical: Allows you to hit "Reply" in Gmail and go to the original sender
            subject: `[Siteo Inbound] ${subject || '(No Subject)'}`,
            html: `
                <div style="font-family: sans-serif; background: #f4f4f5; padding: 20px;">
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e4e4e7;">
                        <div style="border-bottom: 1px solid #e4e4e7; padding-bottom: 12px; margin-bottom: 20px;">
                            <h3 style="margin: 0 0 8px 0; color: #18181b;">Inbound Message</h3>
                            <p style="margin: 0; color: #52525b; font-size: 14px;">
                                <strong>From:</strong> ${from}<br>
                                <strong>To:</strong> hello@siteo.io<br>
                                <strong>Original Subject:</strong> ${subject}
                            </p>
                        </div>
                        
                        <div style="font-size: 15px; line-height: 1.6; color: #18181b;">
                            ${html || text || '<em style="color:#71717a">No content provided</em>'}
                        </div>
                    </div>
                </div>
            `,
            // Start simple: no attachments forwarding in v1 to ensure stability
        });

        if (error) {
            console.error('[Webhook] Forwarding FAILED:', error);
            // We return 200 to Resend to stop it from retrying (which could cause billing spikes if logic was buggy)
            // But we treat it as a hard failure in logs.
            return res.status(200).json({ error: 'Forwarding failed but acknowledged' });
        }

        console.log('[Webhook] Forwarding SUCCESS.');
        res.status(200).json({ success: true, message: 'Email forwarded safetly' });

    } catch (err: any) {
        console.error('[Webhook] CRITICAL ERROR:', err);
        // Always acknowledge to stop retries if it's a code error preventing loop explosions
        res.status(200).json({ error: 'Internal Error' });
    }
});

export const webhookRoutes = router;
