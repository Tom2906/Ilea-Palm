-- Add supervision matrix month range settings
ALTER TABLE company_settings
ADD COLUMN supervision_months_back INTEGER NOT NULL DEFAULT 9,
ADD COLUMN supervision_months_forward INTEGER NOT NULL DEFAULT 3;
