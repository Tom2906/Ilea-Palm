-- Add separate API key columns for each provider
-- Safe to re-run: uses IF NOT EXISTS checks

DO $$
BEGIN
    -- Add provider-specific API key columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'company_settings'
        AND column_name = 'anthropic_api_key'
    ) THEN
        ALTER TABLE company_settings
        ADD COLUMN anthropic_api_key TEXT,
        ADD COLUMN openai_api_key TEXT,
        ADD COLUMN gemini_api_key TEXT;

        -- Migrate existing ai_api_key to appropriate provider column
        UPDATE company_settings
        SET
            anthropic_api_key = CASE WHEN ai_provider = 'anthropic' THEN ai_api_key ELSE NULL END,
            openai_api_key = CASE WHEN ai_provider = 'openai' THEN ai_api_key ELSE NULL END,
            gemini_api_key = CASE WHEN ai_provider = 'gemini' THEN ai_api_key ELSE NULL END;
    END IF;
END $$;
