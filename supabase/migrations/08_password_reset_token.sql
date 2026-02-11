-- =============================================================================
-- Schema V8: Password Reset Token (Single-Use)
-- Adds a column to store the current valid reset token, nulled after use.
-- Safe: nullable TEXT column, no downtime required.
-- =============================================================================

ALTER TABLE public.scraped_agents ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
