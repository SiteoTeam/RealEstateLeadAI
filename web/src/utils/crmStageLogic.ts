/**
 * CRM Stage Logic — Pure functions extracted from CRMBoard.tsx for testability.
 *
 * These determine which pipeline stage a lead belongs to, based on
 * payment status, trial, login, custom domain, and email engagement.
 */

import type { DBProfile } from '../services/api'
import type { EmailLog } from '../types/email'

export type Stage = 'New' | 'Delivered' | 'Opened' | 'Clicked' | 'LoggedIn' | 'Connected' | 'Paid' | 'Bounced' | 'Expired'

// System/transactional email subjects to EXCLUDE from pipeline tracking
// Only outreach emails (welcome, audit) should drive pipeline position
const SYSTEM_SUBJECT_PATTERNS = [
    'admin access',
    'reset your',
    'payment successful',
    'days left',
    'siteo receipt',
]

export function isSystemEmail(subject?: string): boolean {
    if (!subject) return false
    const lower = subject.toLowerCase()
    return SYSTEM_SUBJECT_PATTERNS.some(p => lower.includes(p))
}

export function isTrialExpired(lead: DBProfile): boolean {
    if (!lead.trial_started_at) return false
    const start = new Date(lead.trial_started_at)
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    const days = diff / (1000 * 60 * 60 * 24)
    return days > 30
}

/**
 * Get sorted email logs for a lead, newest first.
 * Matches on lead.primary_email against log.recipient or log.to[].
 */
export function getSortedLeadLogs(lead: DBProfile, emailLogs: EmailLog[]): EmailLog[] {
    const normalize = (email?: string | null) => email?.trim().toLowerCase() || ''
    const leadEmail = normalize(lead.primary_email)
    if (!leadEmail) return []

    return emailLogs.filter(l =>
        normalize(l.recipient) === leadEmail ||
        (l.to && l.to.some(t => normalize(t) === leadEmail))
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Status hierarchy — matches the webhook's STATUS_RANK
const STATUS_RANK: Record<string, number> = {
    sent: 0, delivered: 1, delivery_delayed: 1,
    opened: 2, clicked: 3
}

/**
 * Determine the CRM pipeline stage for a lead.
 *
 * Priority order:
 *   Paid > Expired > Connected > LoggedIn > Bounced > (email status) > New
 *
 * For email-based stages, uses the HIGHEST status across ALL outreach emails
 * so that sending a new email never demotes a lead that already clicked/opened.
 */
export function getStage(lead: DBProfile, emailLogs: EmailLog[]): Stage {
    if (lead.is_paid) return 'Paid'
    if (!lead.is_paid && isTrialExpired(lead)) return 'Expired'
    if (lead.website_config?.custom_domain) return 'Connected'
    if (lead.last_login_at) return 'LoggedIn'

    const allLogs = getSortedLeadLogs(lead, emailLogs)
    if (allLogs.length === 0) return 'New'

    // Check if ANY log has bounced (terminal — always surface this)
    const hasBounce = allLogs.some(l => ['bounced', 'failed', 'suppressed'].includes(l.status))
    if (hasBounce) return 'Bounced'

    // Filter to outreach emails only
    const outreachLogs = allLogs.filter(l => !isSystemEmail(l.subject))

    if (outreachLogs.length === 0) return 'Delivered'

    // Use the HIGHEST status across ALL outreach emails
    let highestRank = 0
    for (const log of outreachLogs) {
        const rank = STATUS_RANK[log.status] ?? 0
        if (rank > highestRank) highestRank = rank
    }

    if (highestRank >= 3) return 'Clicked'
    if (highestRank >= 2) return 'Opened'
    return 'Delivered'
}
