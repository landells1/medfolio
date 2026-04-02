-- Add hidden_specialties column to profiles.
-- This stores specialty IDs the user has chosen to hide from their sidebar
-- and dashboard. Portfolio data (portfolio_items, uploads) is NEVER deleted
-- when a specialty is hidden — it reappears automatically if the user
-- re-enables the specialty.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hidden_specialties TEXT[] NOT NULL DEFAULT '{}';
