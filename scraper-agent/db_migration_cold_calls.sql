-- Cold Calling CRM: Add columns to scraped_agents
-- Run this in the Supabase SQL Editor

ALTER TABLE scraped_agents 
  ADD COLUMN IF NOT EXISTS cold_call_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cold_call_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cold_call_date TIMESTAMPTZ DEFAULT NULL;

-- Optional: index for filtering cold call leads
CREATE INDEX IF NOT EXISTS idx_scraped_agents_cold_call_status 
  ON scraped_agents(cold_call_status) 
  WHERE cold_call_status IS NOT NULL;
