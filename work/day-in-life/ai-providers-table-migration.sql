-- Create AI Providers table for managing multiple AI provider configurations
-- Safe to re-run

-- Create ai_providers table
CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'gemini')),
    name TEXT NOT NULL, -- User-friendly name like "Production Claude", "Test GPT", etc.
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing provider configs to ai_providers table
DO $$
DECLARE
    settings_row RECORD;
    anthropic_id UUID;
    openai_id UUID;
    gemini_id UUID;
BEGIN
    -- Get current settings
    SELECT * INTO settings_row FROM company_settings LIMIT 1;

    -- Migrate Anthropic key if exists
    IF settings_row.anthropic_api_key IS NOT NULL AND settings_row.anthropic_api_key != '' THEN
        INSERT INTO ai_providers (provider, name, api_key)
        VALUES ('anthropic', 'Anthropic (Claude)', settings_row.anthropic_api_key)
        ON CONFLICT DO NOTHING
        RETURNING id INTO anthropic_id;
    END IF;

    -- Migrate OpenAI key if exists
    IF settings_row.openai_api_key IS NOT NULL AND settings_row.openai_api_key != '' THEN
        INSERT INTO ai_providers (provider, name, api_key)
        VALUES ('openai', 'OpenAI (GPT)', settings_row.openai_api_key)
        ON CONFLICT DO NOTHING
        RETURNING id INTO openai_id;
    END IF;

    -- Migrate Gemini key if exists
    IF settings_row.gemini_api_key IS NOT NULL AND settings_row.gemini_api_key != '' THEN
        INSERT INTO ai_providers (provider, name, api_key)
        VALUES ('gemini', 'Google (Gemini)', settings_row.gemini_api_key)
        ON CONFLICT DO NOTHING
        RETURNING id INTO gemini_id;
    END IF;
END $$;

-- Add new columns to company_settings for Day in the Life configuration
DO $$
BEGIN
    -- Add day_in_life_provider_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'company_settings'
        AND column_name = 'day_in_life_provider_id'
    ) THEN
        ALTER TABLE company_settings
        ADD COLUMN day_in_life_provider_id UUID REFERENCES ai_providers(id),
        ADD COLUMN day_in_life_model TEXT;

        -- Set default provider based on existing ai_provider
        UPDATE company_settings
        SET day_in_life_provider_id = (
            SELECT id FROM ai_providers
            WHERE provider = company_settings.ai_provider
            LIMIT 1
        ),
        day_in_life_model = ai_model;
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_providers(is_active) WHERE is_active = true;
