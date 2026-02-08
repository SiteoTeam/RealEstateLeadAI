import { Router } from 'express';
import { getDb } from '../services/db';

const router = Router();

// Handle Resend Webhooks
// POST /api/webhooks/resend
router.post('/resend', async (req, res) => {
    try {
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
                        adminUrl: `${CLIENT_URL}/w/${lead.website_slug}/admin`,
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
        res.status(500).json({ error: err.message });
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
        return res.status(400).send(`Webhook Error: ${err.message}`);
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

export const webhookRoutes = router;
