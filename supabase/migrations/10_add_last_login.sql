
-- Add last_login_at column to scraped_agents table
ALTER TABLE scraped_agents ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Index for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_scraped_agents_last_login_at ON scraped_agents(last_login_at);
