-- Add AI configuration columns to company_settings
-- Safe to re-run (checks for column existence)

-- Add ai_provider column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'company_settings' AND column_name = 'ai_provider'
    ) THEN
        ALTER TABLE company_settings ADD COLUMN ai_provider TEXT DEFAULT 'anthropic';
    END IF;
END $$;

-- Add ai_model column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'company_settings' AND column_name = 'ai_model'
    ) THEN
        ALTER TABLE company_settings ADD COLUMN ai_model TEXT DEFAULT 'claude-haiku-4-5-20250929';
    END IF;
END $$;

-- Add ai_api_key column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'company_settings' AND column_name = 'ai_api_key'
    ) THEN
        ALTER TABLE company_settings ADD COLUMN ai_api_key TEXT;
    END IF;
END $$;
