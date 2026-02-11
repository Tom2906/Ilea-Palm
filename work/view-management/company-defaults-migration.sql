-- Migration: Add company default views support
-- Date: 2026-02-11
-- Description: Adds is_company_default column to user_grid_views table
--              Allows admins to set org-wide default views that apply to all users
--              who haven't set their own personal default.

-- Add is_company_default column
ALTER TABLE user_grid_views
ADD COLUMN IF NOT EXISTS is_company_default BOOLEAN NOT NULL DEFAULT false;

-- Unique index: one company default per grid type (global, not per user)
-- This ensures only one company default can exist per grid type
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_grid_views_company_default
  ON user_grid_views (grid_type) WHERE is_company_default = true;

-- Note: Existing index idx_user_grid_views_default remains unchanged
-- It enforces one personal default per user per grid type
