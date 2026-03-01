/**
 * API Service
 * Centralized API calls for the agent scraper
 */

import type { CBAgentProfile } from '../types/agent'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Database Profile Interface
export interface DBProfile {
    id: string
    full_name: string
    brokerage: string
    city: string | null
    state: string | null
    primary_email: string | null
    primary_phone: string | null
    headshot_url: string | null
    logo_url: string | null
    brokerage_logo_url: string | null
    bio: string | null
    office_name: string | null
    office_address: string | null
    office_phone: string | null
    license_number: string | null
    facebook_url: string | null
    linkedin_url: string | null
    instagram_url: string | null
    twitter_url: string | null
    youtube_url: string | null
    source_url: string
    website_slug: string | null
    website_published: boolean
    website_config: any | null
    is_paid?: boolean // Added for CRM
    stripe_subscription_id?: string | null // Added for Stripe Management
    last_login_at?: string | null // Added for Login Tracking
    stripe_customer_id?: string | null // Added for Billing Portal
    trial_started_at?: string | null // Added for Trial Logic
    last_contacted_at?: string | null // Added for Emailed Leads
    is_unsubscribed?: boolean // Added for Unsubscribe Logic
    cold_call_status?: string | null // Added for Cold Calling CRM
    cold_call_notes?: string | null // Added for Cold Calling CRM
    cold_call_date?: string | null // Added for Cold Calling CRM
    created_at: string
    updated_at: string
}

/**
 * Validate a Coldwell Banker URL
 */
export function isValidCBUrl(url: string): boolean {
    return url.includes('coldwellbanker.com') && url.includes('/agents/')
}

import { getAuthHeaders } from '../utils/auth'
/**
 * Extract an agent profile from a CB URL
 */
export async function extractProfile(url: string): Promise<CBAgentProfile> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
    }

    const response = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url })
    })

    if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized: Please login')

        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        // Handle extraction_errors array if present (from 422)
        if (errorData.extraction_errors && Array.isArray(errorData.extraction_errors)) {
            throw new Error(errorData.extraction_errors.join(', '))
        }
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
    }

    return response.json()
}

/**
 * Fetch all saved leads from the database
 */
export async function getLeads(): Promise<DBProfile[]> {
    const response = await fetch(`${API_BASE}/api/leads`, {
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized: Please login')
        throw new Error('Failed to fetch leads')
    }

    return response.json()
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to delete lead')
    }
}

/**
 * Update lead website configuration
 */
export async function updateLeadConfig(
    id: string,
    config: { website_slug?: string; website_published?: boolean }
): Promise<void> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
    }

    const response = await fetch(`${API_BASE}/api/leads/${id}/config`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(config)
    })

    if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update config')
    }
}

/**
 * Get website by slug (public)
 */
export async function getWebsiteBySlug(slug: string): Promise<DBProfile> {
    const response = await fetch(`${API_BASE}/api/website/${slug}`)

    if (!response.ok) {
        throw new Error('Website not found')
    }

    return response.json()
}

/**
 * Update lead profile data
 */
export async function updateLead(
    id: string,
    data: Partial<Omit<DBProfile, 'id' | 'created_at' | 'updated_at' | 'source_url'>>
): Promise<void> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
    }

    const response = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update lead')
    }
}

/**
 * Fetch email logs (admin)
 */
import type { EmailLog } from '../types/email'
export async function getEmailLogs(): Promise<EmailLog[]> {
    const response = await fetch(`${API_BASE}/api/admin/emails`, {
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to fetch email logs')
    }

    const json = await response.json()
    return Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
}

/**
 * Create Stripe Checkout Session
 */
export async function createCheckoutSession(leadId: string, returnUrl: string): Promise<{ url: string }> {
    const response = await fetch(`${API_BASE}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ leadId, returnUrl })
    })

    if (!response.ok) {
        throw new Error('Failed to create checkout session')
    }

    return response.json()
}

/**
 * Delete email logs for a recipient
 */
export async function deleteEmailLogs(recipient: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/admin/emails/${encodeURIComponent(recipient)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to delete email logs')
    }
}

/**
 * Cancel Subscription
 */
export async function cancelSubscription(leadId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/api/stripe/cancel-subscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ leadId })
    })

    if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to cancel subscription')
    }

    return response.json()
}

/**
 * Prune Expired Leads (Manual Admin Action)
 */
export async function pruneExpiredLeads(): Promise<{ success: boolean; deleted: number }> {
    const response = await fetch(`${API_BASE}/api/admin/prune-expired`, {
        method: 'POST',
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to prune expired leads')
    }

    return response.json()
}

/**
 * Mark a lead for cold calling (adds to Cold Calls pipeline)
 */
export async function markAsColdCall(id: string, status: string = 'queued'): Promise<void> {
    return updateLead(id, {
        cold_call_status: status,
        cold_call_date: new Date().toISOString()
    } as any)
}

/**
 * Update cold call status and optional notes
 */
export async function updateColdCallStatus(
    id: string,
    status: string,
    notes?: string
): Promise<void> {
    const data: any = {
        cold_call_status: status,
        cold_call_date: new Date().toISOString()
    }
    if (notes !== undefined) {
        data.cold_call_notes = notes
    }
    return updateLead(id, data)
}
