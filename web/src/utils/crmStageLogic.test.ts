/**
 * CRM Stage Logic — Unit Tests
 *
 * Verifies the pipeline stage assignment logic that determines where each
 * lead appears on the CRM board. These tests run independently of the
 * browser, confirming that the business logic is correct everywhere.
 *
 * Run:  npx vitest run src/utils/crmStageLogic.test.ts
 */

import { describe, it, expect } from 'vitest'
import { getStage, isSystemEmail, isTrialExpired, getSortedLeadLogs } from './crmStageLogic'
import type { DBProfile } from '../services/api'
import type { EmailLog } from '../types/email'

// ─── Test Helpers ────────────────────────────────────────────────────

/** Minimal lead with sensible defaults. Override any field via `overrides`. */
function makeLead(overrides: Partial<DBProfile> = {}): DBProfile {
    return {
        id: 'lead-1',
        full_name: 'Test Agent',
        brokerage: 'Test Brokerage',
        city: 'New York',
        state: 'NY',
        primary_email: 'test@example.com',
        primary_phone: null,
        headshot_url: null,
        logo_url: null,
        brokerage_logo_url: null,
        bio: null,
        office_name: null,
        office_address: null,
        office_phone: null,
        license_number: null,
        facebook_url: null,
        linkedin_url: null,
        instagram_url: null,
        twitter_url: null,
        youtube_url: null,
        source_url: 'https://coldwellbanker.com/agents/test',
        website_slug: 'test-agent',
        website_published: true,
        website_config: null,
        is_paid: false,
        last_login_at: null,
        trial_started_at: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        ...overrides,
    }
}

/** Minimal email log. Override any field via `overrides`. */
function makeLog(overrides: Partial<EmailLog> = {}): EmailLog {
    return {
        id: `log-${Math.random().toString(36).slice(2, 8)}`,
        recipient: 'test@example.com',
        subject: 'Your Website Audit',
        status: 'delivered',
        created_at: '2026-01-15T10:00:00Z',
        ...overrides,
    }
}

// ─── isSystemEmail ───────────────────────────────────────────────────

describe('isSystemEmail', () => {
    it('returns false for outreach subjects', () => {
        expect(isSystemEmail('Your Website Audit')).toBe(false)
        expect(isSystemEmail('Welcome to Siteo')).toBe(false)
    })

    it('returns true for admin access emails', () => {
        expect(isSystemEmail('Your Admin Access Details')).toBe(true)
    })

    it('returns true for password reset emails', () => {
        expect(isSystemEmail('Reset Your Password')).toBe(true)
    })

    it('returns true for payment emails', () => {
        expect(isSystemEmail('Payment Successful!')).toBe(true)
    })

    it('returns true for trial reminder emails', () => {
        expect(isSystemEmail('5 Days Left on Your Trial')).toBe(true)
    })

    it('returns true for receipt emails', () => {
        expect(isSystemEmail('Your Siteo Receipt')).toBe(true)
    })

    it('returns false for undefined/empty', () => {
        expect(isSystemEmail(undefined)).toBe(false)
        expect(isSystemEmail('')).toBe(false)
    })
})

// ─── isTrialExpired ──────────────────────────────────────────────────

describe('isTrialExpired', () => {
    it('returns false when trial has not started', () => {
        expect(isTrialExpired(makeLead({ trial_started_at: null }))).toBe(false)
    })

    it('returns false when trial started recently', () => {
        const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        expect(isTrialExpired(makeLead({ trial_started_at: recent }))).toBe(false)
    })

    it('returns true when trial started > 30 days ago', () => {
        const old = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days ago
        expect(isTrialExpired(makeLead({ trial_started_at: old }))).toBe(true)
    })

    it('returns false at exactly 30 days', () => {
        const exact30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        expect(isTrialExpired(makeLead({ trial_started_at: exact30 }))).toBe(false)
    })
})

// ─── getSortedLeadLogs ──────────────────────────────────────────────

describe('getSortedLeadLogs', () => {
    it('returns empty array when lead has no email', () => {
        const lead = makeLead({ primary_email: null })
        expect(getSortedLeadLogs(lead, [makeLog()])).toEqual([])
    })

    it('matches logs by recipient email (case-insensitive)', () => {
        const lead = makeLead({ primary_email: 'Test@Example.com' })
        const log = makeLog({ recipient: 'test@example.com' })
        expect(getSortedLeadLogs(lead, [log])).toHaveLength(1)
    })

    it('matches logs by to[] array', () => {
        const lead = makeLead({ primary_email: 'test@example.com' })
        const log = makeLog({ recipient: undefined, to: ['test@example.com'] })
        expect(getSortedLeadLogs(lead, [log])).toHaveLength(1)
    })

    it('sorts newest first', () => {
        const lead = makeLead()
        const logOld = makeLog({ created_at: '2026-01-01T00:00:00Z', subject: 'Old' })
        const logNew = makeLog({ created_at: '2026-01-10T00:00:00Z', subject: 'New' })
        const result = getSortedLeadLogs(lead, [logOld, logNew])
        expect(result[0].subject).toBe('New')
        expect(result[1].subject).toBe('Old')
    })

    it('excludes logs for other recipients', () => {
        const lead = makeLead({ primary_email: 'test@example.com' })
        const mine = makeLog({ recipient: 'test@example.com' })
        const other = makeLog({ recipient: 'other@example.com' })
        expect(getSortedLeadLogs(lead, [mine, other])).toHaveLength(1)
    })
})

// ─── getStage — Priority Order ──────────────────────────────────────

describe('getStage — priority order', () => {
    it('returns "Paid" for paid leads regardless of other fields', () => {
        const lead = makeLead({ is_paid: true, last_login_at: '2026-01-01T00:00:00Z' })
        expect(getStage(lead, [])).toBe('Paid')
    })

    it('returns "Expired" for unpaid leads with expired trial', () => {
        const old = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
        const lead = makeLead({ is_paid: false, trial_started_at: old })
        expect(getStage(lead, [])).toBe('Expired')
    })

    it('returns "Connected" for leads with custom domain', () => {
        const lead = makeLead({ website_config: { custom_domain: 'mysite.com' } })
        expect(getStage(lead, [])).toBe('Connected')
    })

    it('returns "LoggedIn" for leads with last_login_at', () => {
        const lead = makeLead({ last_login_at: '2026-01-10T00:00:00Z' })
        expect(getStage(lead, [])).toBe('LoggedIn')
    })

    it('returns "New" for leads with no email logs', () => {
        const lead = makeLead()
        expect(getStage(lead, [])).toBe('New')
    })
})

// ─── getStage — Email-Based Stages ──────────────────────────────────

describe('getStage — email-based stages', () => {
    it('returns "Delivered" when only delivered emails exist', () => {
        const lead = makeLead()
        const logs = [makeLog({ status: 'delivered' })]
        expect(getStage(lead, logs)).toBe('Delivered')
    })

    it('returns "Opened" when latest email was opened', () => {
        const lead = makeLead()
        const logs = [makeLog({ status: 'opened' })]
        expect(getStage(lead, logs)).toBe('Opened')
    })

    it('returns "Clicked" when latest email was clicked', () => {
        const lead = makeLead()
        const logs = [makeLog({ status: 'clicked' })]
        expect(getStage(lead, logs)).toBe('Clicked')
    })

    it('returns "Bounced" when any email bounced', () => {
        const lead = makeLead()
        const logs = [
            makeLog({ status: 'clicked', created_at: '2026-01-15T00:00:00Z' }),
            makeLog({ status: 'bounced', created_at: '2026-01-16T00:00:00Z' }),
        ]
        expect(getStage(lead, logs)).toBe('Bounced')
    })
})

// ─── getStage — THE REGRESSION FIX (no downgrade) ───────────────────

describe('getStage — no downgrade regression', () => {
    it('★ stays "Clicked" after sending a NEW delivered email', () => {
        const lead = makeLead()
        const logs = [
            // Old outreach email that was clicked
            makeLog({ status: 'clicked', subject: 'Your Website Audit', created_at: '2026-01-10T00:00:00Z' }),
            // NEW outreach email just sent (status: delivered)
            makeLog({ status: 'delivered', subject: 'Follow-Up Email', created_at: '2026-01-15T00:00:00Z' }),
        ]
        expect(getStage(lead, logs)).toBe('Clicked')
    })

    it('★ stays "Opened" after sending a NEW delivered email', () => {
        const lead = makeLead()
        const logs = [
            makeLog({ status: 'opened', subject: 'Your Website Audit', created_at: '2026-01-10T00:00:00Z' }),
            makeLog({ status: 'delivered', subject: 'Follow-Up Email', created_at: '2026-01-15T00:00:00Z' }),
        ]
        expect(getStage(lead, logs)).toBe('Opened')
    })

    it('★ stays "Clicked" even with multiple newer delivered emails', () => {
        const lead = makeLead()
        const logs = [
            makeLog({ status: 'clicked', subject: 'Audit', created_at: '2026-01-05T00:00:00Z' }),
            makeLog({ status: 'delivered', subject: 'Follow-Up 1', created_at: '2026-01-10T00:00:00Z' }),
            makeLog({ status: 'delivered', subject: 'Follow-Up 2', created_at: '2026-01-15T00:00:00Z' }),
            makeLog({ status: 'delivered', subject: 'Follow-Up 3', created_at: '2026-01-20T00:00:00Z' }),
        ]
        expect(getStage(lead, logs)).toBe('Clicked')
    })

    it('★ upgrades from "Opened" to "Clicked" when a newer email is clicked', () => {
        const lead = makeLead()
        const logs = [
            makeLog({ status: 'opened', subject: 'Audit', created_at: '2026-01-05T00:00:00Z' }),
            makeLog({ status: 'clicked', subject: 'Follow-Up', created_at: '2026-01-10T00:00:00Z' }),
        ]
        expect(getStage(lead, logs)).toBe('Clicked')
    })
})

// ─── getStage — System Email Filtering ──────────────────────────────

describe('getStage — system email filtering', () => {
    it('ignores admin access emails for stage determination', () => {
        const lead = makeLead()
        const logs = [
            makeLog({ status: 'clicked', subject: 'Your Website Audit', created_at: '2026-01-10T00:00:00Z' }),
            makeLog({ status: 'delivered', subject: 'Your Admin Access Details', created_at: '2026-01-15T00:00:00Z' }),
        ]
        // The admin access email should be filtered out — stage stays "Clicked"
        expect(getStage(lead, logs)).toBe('Clicked')
    })

    it('returns "Delivered" when only system emails exist (no outreach)', () => {
        const lead = makeLead()
        const logs = [
            makeLog({ status: 'opened', subject: 'Your Admin Access Details', created_at: '2026-01-15T00:00:00Z' }),
            makeLog({ status: 'delivered', subject: 'Reset Your Password', created_at: '2026-01-16T00:00:00Z' }),
        ]
        // Only system emails → outreachLogs is empty → returns 'Delivered'
        expect(getStage(lead, logs)).toBe('Delivered')
    })
})

// ─── getStage — LoggedIn takes priority over email status ───────────

describe('getStage — LoggedIn priority', () => {
    it('LoggedIn overrides Clicked email status', () => {
        const lead = makeLead({ last_login_at: '2026-01-20T00:00:00Z' })
        const logs = [makeLog({ status: 'clicked' })]
        expect(getStage(lead, logs)).toBe('LoggedIn')
    })

    it('LoggedIn overrides Delivered email status', () => {
        const lead = makeLead({ last_login_at: '2026-01-20T00:00:00Z' })
        const logs = [makeLog({ status: 'delivered' })]
        expect(getStage(lead, logs)).toBe('LoggedIn')
    })

    it('LoggedIn is overridden by Paid', () => {
        const lead = makeLead({ is_paid: true, last_login_at: '2026-01-20T00:00:00Z' })
        expect(getStage(lead, [])).toBe('Paid')
    })
})
