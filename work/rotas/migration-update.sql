-- Rota Migration Update
-- Run AFTER the original migration (shift_types + shifts already exist)

-- Fix "A" shift type name: Awake → Admin
UPDATE shift_types SET name = 'Admin', display_color = '#DBEAFE' WHERE code = 'A';

-- Update existing shift type colors
UPDATE shift_types SET display_color = '#FEF3C7' WHERE code = 'D';
UPDATE shift_types SET display_color = '#EDE9FE' WHERE code = 'DS';

-- Add new shift types (skip if already exist)
INSERT INTO shift_types (code, name, default_hours, includes_sleep, display_color, sort_order)
VALUES
  ('S',   'Sleep',              9.0,  true,  '#E0E7FF', 4),
  ('E',   'Early',              9.5,  false, '#D1FAE5', 5),
  ('L',   'Late',               5.5,  false, '#FEE2E2', 6),
  ('RDO', 'Requested Day Off',  0.0,  false, '#F3F4F6', 7)
ON CONFLICT (code) DO NOTHING;

-- Monthly contracted hours table
CREATE TABLE IF NOT EXISTS rota_monthly_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  month INT NOT NULL,
  contracted_hours NUMERIC(5,1) NOT NULL,
  UNIQUE(year, month)
);

-- Rota-specific default filters on company_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_settings' AND column_name = 'default_hidden_rota_roles'
  ) THEN
    ALTER TABLE company_settings
      ADD COLUMN default_hidden_rota_roles TEXT[] DEFAULT '{}',
      ADD COLUMN default_hidden_rota_employee_statuses TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Drop contracted_hours_per_week from employees if it was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'contracted_hours_per_week'
  ) THEN
    ALTER TABLE employees DROP COLUMN contracted_hours_per_week;
  END IF;
END $$;
