-- SQL Script to Backfill Missing 'Emailed' Leads

-- 1. Find all emails that are in `email_logs` but NOT in `scraped_agents` (the "Orphans")
-- 2. Insert them as basic leads into `scraped_agents`
-- 3. Mark them as 'contacted' so they show up in the correct tab

INSERT INTO scraped_agents (
    full_name,
    primary_email,
    last_contacted_at,
    -- Default required fields
    brokerage,
    website_slug,
    website_published,
    created_at,
    updated_at
)
SELECT DISTINCT
    INITCAP(SPLIT_PART(el.recipient, '@', 1)) as full_name, -- Use part before @ as Name
    LOWER(TRIM(el.recipient)) as primary_email,
    el.created_at as last_contacted_at,
    'Email Contact' as brokerage,
    -- Generate a simple unique slug using email prefix + random string to avoid conflicts
    LOWER(SPLIT_PART(el.recipient, '@', 1)) || '-' || SUBSTRING(md5(random()::text) from 1 for 4) as website_slug,
    false as website_published,
    el.created_at,
    NOW()
FROM email_logs el
WHERE NOT EXISTS (
    SELECT 1 FROM scraped_agents sa 
    WHERE LOWER(TRIM(sa.primary_email)) = LOWER(TRIM(el.recipient))
);

-- OPTIONAL: If some leads exist but just missing the 'last_contacted_at' flag:
UPDATE scraped_agents
SET last_contacted_at = (
    SELECT MAX(created_at) FROM email_logs 
    WHERE LOWER(TRIM(email_logs.recipient)) = LOWER(TRIM(scraped_agents.primary_email))
)
WHERE last_contacted_at IS NULL
AND EXISTS (
    SELECT 1 FROM email_logs 
    WHERE LOWER(TRIM(email_logs.recipient)) = LOWER(TRIM(scraped_agents.primary_email))
);

-- Returns how many rows were inserted/updated (Supabase SQL Editor will show this automatically)
