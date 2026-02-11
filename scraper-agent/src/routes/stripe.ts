import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseUser, AuthenticatedRequest } from '../middleware/supabaseAuth';

const router = express.Router();

// Initialize Stripe
// If key is missing, we'll handle it gracefully in the endpoint or let it throw
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    apiVersion: '2024-12-18.acacia', // Latest stable API version as of early 2025 (approx)
    typescript: true,
} as any);

// Initialize Supabase (Service Role for admin access)
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', verifySupabaseUser, async (req: AuthenticatedRequest, res) => {
    try {
        const { leadId, returnUrl } = req.body;

        if (!leadId) {
            return res.status(400).json({ error: 'Missing leadId' });
        }

        // Ownership check: agents can only act on their own leadId
        if (req.user?.role === 'agent' && req.user?.id !== leadId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('[Stripe] Missing STRIPE_SECRET_KEY');
            return res.status(500).json({ error: 'Payment system not configured (Missing Key)' });
        }

        // Get Lead info to personalize checkout
        const { data: lead, error } = await supabase
            .from('scraped_agents')
            .select('*')
            .eq('id', leadId)
            .single();

        if (error || !lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        console.log(`[Stripe] Creating checkout session for lead: ${lead.full_name} (${leadId})`);

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            // Redirects
            success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
            cancel_url: `${returnUrl}?canceled=true`,
            // Metadata for Webhook
            metadata: {
                leadId: leadId,
                slug: lead.slug,
                type: 'subscription_activation'
            },
            // Pre-fill email if available
            customer_email: lead.primary_email,
        });

        res.json({ url: session.url });

    } catch (err: any) {
        console.error('[Stripe] Error creating session:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/stripe/cancel-subscription
router.post('/cancel-subscription', verifySupabaseUser, async (req: AuthenticatedRequest, res) => {
    try {
        const { leadId } = req.body;

        if (!leadId) {
            return res.status(400).json({ error: 'Missing leadId' });
        }

        // Ownership check: agents can only act on their own leadId
        if (req.user?.role === 'agent' && req.user?.id !== leadId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('[Stripe] Missing STRIPE_SECRET_KEY');
            return res.status(500).json({ error: 'Payment system not configured' });
        }

        // Get Lead to find subscription ID
        const { data: lead, error } = await supabase
            .from('scraped_agents')
            .select('id, full_name, stripe_subscription_id')
            .eq('id', leadId)
            .single();

        if (error || !lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        if (!lead.stripe_subscription_id) {
            return res.status(400).json({ error: 'No active subscription found' });
        }

        console.log(`[Stripe] Canceling subscription for ${lead.full_name}: ${lead.stripe_subscription_id}`);

        // Cancel the subscription at period end (graceful cancellation)
        await stripe.subscriptions.update(lead.stripe_subscription_id, {
            cancel_at_period_end: true
        });

        // Update DB to reflect pending cancellation
        await supabase
            .from('scraped_agents')
            .update({ subscription_status: 'canceling' })
            .eq('id', leadId);

        res.json({ success: true, message: 'Subscription will be canceled at end of billing period' });

    } catch (err: any) {
        console.error('[Stripe] Cancel subscription error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/stripe/create-portal-session
router.post('/create-portal-session', verifySupabaseUser, async (req: AuthenticatedRequest, res) => {
    try {
        const { leadId, returnUrl } = req.body;

        if (!leadId) {
            return res.status(400).json({ error: 'Missing leadId' });
        }

        // Ownership check: agents can only act on their own leadId
        if (req.user?.role === 'agent' && req.user?.id !== leadId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Get Lead to find stripe_customer_id
        const { data: lead, error } = await supabase
            .from('scraped_agents')
            .select('id, stripe_customer_id')
            .eq('id', leadId)
            .single();

        if (error || !lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        if (!lead.stripe_customer_id) {
            return res.status(400).json({ error: 'No associated Stripe customer found' });
        }

        // Create Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: lead.stripe_customer_id,
            return_url: returnUrl,
        });

        res.json({ url: session.url });

    } catch (err: any) {
        console.error('[Stripe] Error creating portal session:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export const stripeRoutes = router;
