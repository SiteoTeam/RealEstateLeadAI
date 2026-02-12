
-- Create login_logs table to track authentication attempts
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES scraped_agents(id) ON DELETE CASCADE,
    slug TEXT,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL, -- 'success', 'failed'
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Improve query performance on logs
CREATE INDEX IF NOT EXISTS idx_login_logs_agent_id ON login_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_slug ON login_logs(slug);
