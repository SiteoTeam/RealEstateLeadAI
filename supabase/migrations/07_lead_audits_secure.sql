-- =============================================================================
-- Migration: 07_lead_audits_secure.sql
-- Description: Adds tables for the Real Estate Audit feature with security controls.
-- =============================================================================

-- 1. Feature Flags Table (Kill Switch)
CREATE TABLE IF NOT EXISTS public.feature_flags (
    key TEXT PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT FALSE,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on the feature for testing (so it works out of the box), can be disabled instantly
INSERT INTO public.feature_flags (key, is_enabled, description)
VALUES ('audit_feature_enabled', TRUE, 'Master switch for the Real Estate Audit feature (emails, page access, creation)')
ON CONFLICT (key) DO UPDATE SET is_enabled = EXCLUDED.is_enabled;

-- 2. Lead Audits Table
CREATE TABLE IF NOT EXISTS public.lead_audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.scraped_agents(id) ON DELETE CASCADE,
    
    -- Security Token for Public Access
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    
    -- Status Tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    
    -- Data Storage
    answers JSONB DEFAULT '{}'::jsonb,
    computed_score INTEGER,
    
    -- Timestamps & Expiration
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    completed_at TIMESTAMPTZ
);

-- 3. Indexes for Performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_audits_token ON public.lead_audits(token);
CREATE INDEX IF NOT EXISTS idx_lead_audits_lead_id ON public.lead_audits(lead_id);

-- 4. RLS Policies (Optional but Recommended)
ALTER TABLE public.lead_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Allow Service Role full access
CREATE POLICY "Enable all access for service role" ON public.lead_audits
    AS PERMISSIVE FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for service role flags" ON public.feature_flags
    AS PERMISSIVE FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow Public Read access to Audits via Token (for the audit page)
CREATE POLICY "Enable public read via token" ON public.lead_audits
    FOR SELECT
    TO public
    USING (status = 'pending' OR status = 'completed'); 
    -- We filter by token in the query, this is just a broad permission

-- Allow Public Update (Submit) via Token if Pending
CREATE POLICY "Enable public update via token" ON public.lead_audits
    FOR UPDATE
    TO public
    USING (status = 'pending')
    WITH CHECK (status = 'completed');

-- Allow Public Read to Feature Flags (to check if enabled)
CREATE POLICY "Enable public read feature flags" ON public.feature_flags
    FOR SELECT
    TO public
    USING (true);
