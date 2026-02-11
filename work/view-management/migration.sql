-- View Management: user_grid_views table
-- Stores named view configurations (filters, row order, column visibility) per user per grid

CREATE TABLE IF NOT EXISTS user_grid_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grid_type TEXT NOT NULL,
    name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- At most one default view per user per grid type
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_grid_views_default
    ON user_grid_views (user_id, grid_type) WHERE is_default = true;

-- Fast lookup by user + grid type
CREATE INDEX IF NOT EXISTS idx_user_grid_views_user_grid
    ON user_grid_views (user_id, grid_type);
