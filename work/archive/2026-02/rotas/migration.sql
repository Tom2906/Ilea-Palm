-- Rota Feature Migration
-- Run in Supabase SQL editor

-- Shift types (A, D, DS, S, E, L, RDO)
CREATE TABLE shift_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  default_hours NUMERIC(4,1) NOT NULL,
  includes_sleep BOOLEAN NOT NULL DEFAULT false,
  display_color TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Seed shift types per legend
-- D  = Day Work Period 07:30 - 22:30 (15h)
-- S  = Sleep In 22:30 - 07:30 (9h)
-- DS = Day + Sleep (15h, includes sleep)
-- A  = Admin Hours 09:00 - 17:00 (7.5h)
-- E  = Early Work Period 07:30 - 17:00 (9.5h)
-- L  = Late Work Period 17:00 - 22:30 (5.5h)
-- RDO = Requested Day Off (0h)
INSERT INTO shift_types (code, name, default_hours, includes_sleep, display_color, sort_order) VALUES
  ('A',   'Admin',              7.5,  false, '#DBEAFE', 1),
  ('D',   'Day',               15.0,  false, '#FEF3C7', 2),
  ('DS',  'Day + Sleep',       15.0,  true,  '#EDE9FE', 3),
  ('S',   'Sleep',              9.0,  true,  '#E0E7FF', 4),
  ('E',   'Early',              9.5,  false, '#D1FAE5', 5),
  ('L',   'Late',               5.5,  false, '#FEE2E2', 6),
  ('RDO', 'Requested Day Off',  0.0,  false, '#F3F4F6', 7);

-- Individual shift assignments
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_type_id UUID NOT NULL REFERENCES shift_types(id),
  hours NUMERIC(4,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE INDEX idx_shifts_employee ON shifts(employee_id);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_employee_date ON shifts(employee_id, date);

-- Monthly contracted hours (global across all staff, varies by month)
CREATE TABLE rota_monthly_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  month INT NOT NULL,
  contracted_hours NUMERIC(5,1) NOT NULL,
  UNIQUE(year, month)
);

-- Rota-specific default filters (separate from Training/Supervision filters)
ALTER TABLE company_settings
  ADD COLUMN default_hidden_rota_roles TEXT[] DEFAULT '{}',
  ADD COLUMN default_hidden_rota_employee_statuses TEXT[] DEFAULT '{}';
