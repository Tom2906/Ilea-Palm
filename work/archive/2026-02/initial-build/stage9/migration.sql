-- ============================================================
-- Migration: Employee Statuses + References + Employee Updates
-- Run this in Supabase SQL Editor
-- ============================================================

-- ==================== EMPLOYEE STATUSES (lookup table) ====================

CREATE TABLE employee_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE employee_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employee_statuses_service_role" ON employee_statuses
  FOR ALL USING (true) WITH CHECK (true);

-- Seed statuses
INSERT INTO employee_statuses (name, display_order) VALUES
  ('Active', 1),
  ('Maternity Leave', 2),
  ('Suspended', 3),
  ('Notice Period', 4),
  ('Bank', 5);

-- ==================== MODIFY EMPLOYEES TABLE ====================

-- Add status_id column with FK
ALTER TABLE employees ADD COLUMN status_id UUID REFERENCES employee_statuses(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN notes TEXT;

-- Set existing active employees to 'Active' status
UPDATE employees
SET status_id = (SELECT id FROM employee_statuses WHERE name = 'Active')
WHERE active = true;

-- ==================== EMPLOYEE REFERENCES ====================

CREATE TABLE employee_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reference_number INTEGER NOT NULL CHECK (reference_number BETWEEN 1 AND 8),
  contact_name TEXT,
  contact_company TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  received BOOLEAN NOT NULL DEFAULT false,
  verbal_ref BOOLEAN NOT NULL DEFAULT false,
  date_requested DATE,
  date_received DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, reference_number)
);

-- RLS
ALTER TABLE employee_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employee_references_service_role" ON employee_references
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_employee_references_employee ON employee_references(employee_id);
