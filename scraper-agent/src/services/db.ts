/**
 * Database Service
 * Handles interactions with Supabase for the Lead Management System
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { CBAgentProfile } from '../extractors/coldwellbanker';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 * Singleton pattern to reuse the client instance
 */
function getSupabaseClient(): SupabaseClient | null {
    if (supabaseClient) return supabaseClient;

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('[DB] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Auto-save disabled.');
        return null;
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
}

// Export the singleton function for lazy loading (safer for module init)
export const getDb = getSupabaseClient;

// Deprecated: Do not use top-level supabase const as it crashes if env vars aren't ready
// export const supabase = getSupabaseClient()!;

/**
 * Save extracted Coldwell Banker profile to the database
 * Uses UPSERT based on the unique source_url
 */
export async function saveProfile(profile: CBAgentProfile): Promise<{ success: boolean; id?: string; error?: string }> {
    const client = getSupabaseClient();

    // Fail silently if DB is not configured (don't block the UI)
    if (!client) {
        return { success: false, error: 'Database not configured' };
    }

    console.log(`[DB] Saving profile for: ${profile.full_name}`);

    try {
        // Map the flattened CBAgentProfile to the schema expected by the table

        // Helper to generate a slug (simple version)
        const generateSlug = (name: string) => {
            return name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
        };

        const record: any = {
            full_name: profile.full_name,
            brokerage: 'Coldwell Banker Realty',
            city: _extractCity(profile.office_address) || 'Unknown',
            state: _extractState(profile.office_address) || 'XX',
            source_platform: 'coldwellbanker',
            source_url: profile.profile_url,
            primary_email: profile.email,
            primary_phone: profile.mobile_phone || profile.office_phone,
            office_phone: profile.office_phone,
            license_number: profile.license_number,

            // Default Website Config
            // Use existing slug if available (will be handled by merge logic below or DB constraint)
            // But we need a default if it's new.
            // Actually, best place to handle "new vs existing" logic is AFTER checking existing.
            // So we set these here, but might override from 'existing' later.
            website_slug: generateSlug(profile.full_name),
            website_published: true, // Force publish by default

            // Visuals
            headshot_url: profile.headshot_url,
            logo_url: profile.logo_url,
            brokerage_logo_url: profile.brokerage_logo_url,

            // Details
            bio: profile.bio,
            office_name: profile.office_name,
            office_address: profile.office_address,

            // Socials
            facebook_url: profile.social_links.facebook,
            linkedin_url: profile.social_links.linkedin,
            instagram_url: profile.social_links.instagram,
            twitter_url: profile.social_links.twitter,
            youtube_url: profile.social_links.youtube,

            // Store full data blob for future-proofing
            raw_profile: profile,

            updated_at: new Date().toISOString()
        };

        // 1. Check if the agent already exists by source_url
        const { data: existing, error: fetchError } = await client
            .from('scraped_agents')
            .select('*')
            .eq('source_url', profile.profile_url)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = JSON object requested, multiple (or no) results returned
            console.error('[DB] Error checking existing profile:', fetchError.message);
            // Continue to upsert as fallback? Or fail? Let's buffer and try upsert.
        }

        if (existing) {
            console.log(`[DB] Found existing profile ID: ${existing.id}`);

            // PRESERVE MANUAL EDITS
            // Strategies:
            // A) If existing primary_email is different, keep existing (user likely edited it)
            // B) If existing BIO is different, keep existing? (maybe dangerous if they want fresh bio)
            // Let's stick strictly to what the user asked: "email updated everywhere".

            if (existing.primary_email && existing.primary_email !== record.primary_email) {
                console.log(`[DB] Preserving existing email (${existing.primary_email}) over scraped email (${record.primary_email})`);
                record.primary_email = existing.primary_email;
            }

            // We can add similar logic for other fields if needed, e.g. phone
            // WE ALSO PRESERVE THE EXISTING SLUG if it exists, to avoid breaking links
            if (existing.website_slug) {
                record.website_slug = existing.website_slug;
            }

            // We can add similar logic for other fields if needed, e.g. phone
            if (existing.primary_phone && existing.primary_phone !== record.primary_phone) {
                // For now, let phone update unless we want to lock it too.
                // record.primary_phone = existing.primary_phone;
            }
        }

        // Upsert: Insert or Update if source_url exists
        // (If existing, we just modified 'record' to match specific existing fields, so the update won't revert them)
        const { data, error } = await client
            .from('scraped_agents')
            .upsert(record, {
                onConflict: 'source_url',
                ignoreDuplicates: false
            })
            .select('id')
            .single();

        if (error) {
            console.error('[DB] Error saving profile:', error.message);
            return { success: false, error: error.message };
        }

        console.log(`[DB] ✓ Profile saved successfully (ID: ${data.id})`);
        return { success: true, id: data.id };

    } catch (err) {
        console.error('[DB] Unexpected error:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Fetch all saved leads from the database
 */
export async function getLeads(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const client = getSupabaseClient();

    if (!client) {
        return { success: false, error: 'Database not configured' };
    }

    try {
        const { data, error } = await client
            .from('scraped_agents')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1000); // Increased limit to 1000

        if (error) {
            console.error('[DB] Error fetching leads:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Fetch uncontacted leads for batch processing
 */
export async function getUncontactedLeads(limit: number = 10): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { data, error } = await client
            .from('scraped_agents')
            .select('*')
            .is('last_contacted_at', null)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[DB] Error fetching uncontacted leads:', error.message);
            return { success: false, error: error.message };
        }
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Mark a lead as contacted
 */
export async function markLeadAsContacted(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { error } = await client
            .from('scraped_agents')
            .update({ last_contacted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('[DB] Error marking lead contacted:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Delete a lead by ID
 */
/**
 * Delete a lead by ID
 * If the lead has an active Stripe subscription, cancel it first.
 */
export async function deleteLead(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        // 1. Get the lead to check for subscription
        const { data: lead, error: fetchError } = await client
            .from('scraped_agents')
            .select('stripe_subscription_id')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('[DB] Error fetching lead for deletion:', fetchError);
            // If lead not found, we can consider success (idempotent) or error. Let's error for safety.
            return { success: false, error: fetchError.message };
        }

        // 2. Cancel Stripe Subscription if exists
        if (lead?.stripe_subscription_id) {
            const stripeKey = process.env.STRIPE_SECRET_KEY;
            if (stripeKey) {
                console.log(`[DB] Cancelling subscription ${lead.stripe_subscription_id} for lead ${id}...`);
                try {
                    // Dynamic import or require for Stripe since it's not a top-level import in this file
                    const Stripe = require('stripe');
                    const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' });

                    await stripe.subscriptions.cancel(lead.stripe_subscription_id);
                    console.log(`[DB] ✓ Subscription cancelled.`);
                } catch (stripeErr: any) {
                    console.error('[DB] Failed to cancel subscription:', stripeErr.message);
                    // Proceed with delete anyway? Or block?
                    // User requested "it will also cancel the subscription".
                    // If cancellation fails, maybe we should block deletion to avoid orphaned subscription.
                    return { success: false, error: `Failed to cancel subscription: ${stripeErr.message}` };
                }
            } else {
                console.warn('[DB] STRIPE_SECRET_KEY missing. Cannot cancel subscription.');
                // Proceed?
            }
        }

        // 3. Delete the lead
        const { error } = await client
            .from('scraped_agents')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return { success: true };
    } catch (err) {
        console.error('[DB] Error deleting lead:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Update lead website configuration (slug, published status)
 */
export async function updateLeadConfig(
    id: string,
    config: { website_slug?: string; website_published?: boolean }
): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { error } = await client
            .from('scraped_agents')
            .update(config)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('[DB] Error updating lead config:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Get a lead by its website slug
 */
export async function getLeadBySlug(slug: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { data, error } = await client
            .from('scraped_agents')
            .select('*')
            .eq('website_slug', slug)
            .eq('website_published', true)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error('[DB] Error fetching lead by slug:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Get agent by slug for LOGIN (ignores published status)
 */
export async function getAgentBySlug(slug: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { data, error } = await client
            .from('scraped_agents')
            .select('*')
            .eq('website_slug', slug)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error('[DB] Error fetching agent by slug:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Get a lead by its ID
 */
export async function getLeadById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { data, error } = await client
            .from('scraped_agents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        console.error('[DB] Error fetching lead by ID:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Update a lead's profile data
 * Accepts partial data - only updates provided fields
 */
export interface LeadUpdateData {
    full_name?: string;
    primary_email?: string;
    primary_phone?: string;
    bio?: string;
    city?: string;
    state?: string;
    office_name?: string;
    office_address?: string;
    facebook_url?: string;
    linkedin_url?: string;
    instagram_url?: string;
    twitter_url?: string;
    youtube_url?: string;
    headshot_url?: string;
    password_hash?: string;
    is_paid?: boolean;
    trial_started_at?: string;
    is_unsubscribed?: boolean;
}

export async function unsubscribeLead(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { error } = await client
            .from('scraped_agents')
            .update({ do_not_contact: true, sequence_stopped: true, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('[DB] Error unsubscribing lead:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

export async function updateLead(
    id: string,
    data: LeadUpdateData
): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        // Filter out undefined values
        const cleanData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                cleanData[key] = value;
            }
        }

        if (Object.keys(cleanData).length === 0) {
            return { success: false, error: 'No data to update' };
        }

        cleanData.updated_at = new Date().toISOString();

        console.log(`[DB] Updating lead ${id}:`, Object.keys(cleanData));

        const { error } = await client
            .from('scraped_agents')
            .update(cleanData)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('[DB] Error updating lead:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

// Helpers to extract city/state from the unstructured address string
// Format is usually: "123 Main St, City, ST 12345"
function _extractCity(address: string | null): string | null {
    if (!address) return null;
    const parts = address.split(',');
    if (parts.length >= 2) {
        // City is roughly the second to last part
        return parts[parts.length - 2].trim();
    }
    return null;
}

function _extractState(address: string | null): string | null {
    if (!address) return null;
    const match = address.match(/\b([A-Z]{2})\b/);
    return match ? match[1] : null;
}

/**
 * Audit Feature Helpers
 */

/**
 * Check if a feature flag is enabled
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    const { data } = await client
        .from('feature_flags')
        .select('is_enabled')
        .eq('key', key)
        .single();

    return data?.is_enabled || false;
}

/**
 * Create a new audit for a lead
 */
export async function createAudit(leadId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        // 1. Check if there is an active (pending) audit for this lead
        // If so, return it instead of creating a new one (idempotency)
        const { data: existing } = await client
            .from('lead_audits')
            .select('*')
            .eq('lead_id', leadId)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .single();

        if (existing) {
            return { success: true, data: existing };
        }

        // 2. Create new audit
        const { data, error } = await client
            .from('lead_audits')
            .insert({
                lead_id: leadId,
                token: crypto.randomUUID(), // Cryptographically random UUID (matches DB column type)
                status: 'pending',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
            })
            .select('*')
            .single();

        if (error) throw error;
        return { success: true, data };

    } catch (err) {
        console.error('[DB] Error creating audit:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Get audit by token (Public Access)
 */
export async function getAuditByToken(token: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { data, error } = await client
            .from('lead_audits')
            .select(`
                *,
                lead:lead_id (
                    full_name,
                    brokerage,
                    website_slug,
                    primary_email
                )
            `)
            .eq('token', token)
            .single();

        if (error) throw error;
        return { success: true, data };

    } catch (err) {
        console.error('[DB] Error fetching audit by token:', err);
        return { success: false, error: 'Audit not found or expired' };
    }
}

/**
 * Submit Audit Answers & Score
 */
export async function submitAudit(token: string, answers: any, score: number): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { error } = await client
            .from('lead_audits')
            .update({
                status: 'completed',
                answers: answers,
                computed_score: score,
                completed_at: new Date().toISOString()
            })
            .eq('token', token)
            .eq('status', 'pending'); // Optimistic locking: only update if still pending

        if (error) throw error;
        return { success: true };

    } catch (err) {
        console.error('[DB] Error submitting audit:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/**
 * Log login attempts (success or failure)
 */
export async function logLoginAttempt(data: {
    agent_id?: string;
    slug: string;
    ip_address: string;
    user_agent?: string;
    status: 'success' | 'failed';
    failure_reason?: string;
}): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    try {
        await client.from('login_logs').insert({
            agent_id: data.agent_id,
            slug: data.slug,
            ip_address: data.ip_address,
            user_agent: data.user_agent,
            status: data.status,
            failure_reason: data.failure_reason
        });
    } catch (err) {
        console.error('[DB] Failed to log login attempt:', err);
    }
}

// ─── Email Sequence Helpers ───────────────────────────────────────────────────

/** Fetch leads whose follow-up is due and sequence is still active */
export async function getLeadsDueForFollowup(limit: number = 10): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { data, error } = await client
            .from('scraped_agents')
            .select('*')
            .lte('next_followup_at', new Date().toISOString())
            .eq('sequence_stopped', false)
            .eq('do_not_contact', false)
            .not('next_followup_at', 'is', null)
            .order('next_followup_at', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (err) {
        console.error('[DB] Error fetching follow-up leads:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

const FOLLOWUP_DELAYS_DAYS = [0, 3, 7, 14, 21]; // step index → days after step 0

/** Advance lead to next sequence step and set next send time */
export async function advanceLeadSequence(id: string, nextStep: number): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    const isLast = nextStep >= FOLLOWUP_DELAYS_DAYS.length;
    const daysUntilNext = !isLast ? FOLLOWUP_DELAYS_DAYS[nextStep] - FOLLOWUP_DELAYS_DAYS[nextStep - 1] : 0;
    const nextFollowupAt = !isLast
        ? new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000).toISOString()
        : null;

    try {
        const { error } = await client
            .from('scraped_agents')
            .update({
                email_sequence_step: nextStep,
                next_followup_at: nextFollowupAt,
                sequence_stopped: isLast,
                last_contacted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('[DB] Error advancing sequence:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/** Stop sequence for a lead (clicked, complained, bounced, manual) */
export async function stopLeadSequence(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { error } = await client
            .from('scraped_agents')
            .update({ sequence_stopped: true, next_followup_at: null })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/** Mark lead as do-not-contact (hard bounce) */
export async function markLeadDoNotContact(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Database not configured' };

    try {
        const { error } = await client
            .from('scraped_agents')
            .update({ do_not_contact: true, sequence_stopped: true, next_followup_at: null })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}
