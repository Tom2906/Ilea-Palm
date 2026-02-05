-- ============================================================
-- Supervision Matrix Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add columns to employees table for reporting structure
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS reports_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supervision_frequency INTEGER DEFAULT 2 CHECK (supervision_frequency IN (1, 2));

-- Create supervision_records table
CREATE TABLE IF NOT EXISTS supervision_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  conducted_by_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  supervision_date DATE NOT NULL,
  period TEXT NOT NULL, -- 'YYYY-MM' format for grouping
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_supervision_date CHECK (supervision_date IS NOT NULL)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_supervision_records_employee
  ON supervision_records(employee_id);

CREATE INDEX IF NOT EXISTS idx_supervision_records_conductor
  ON supervision_records(conducted_by_id);

CREATE INDEX IF NOT EXISTS idx_supervision_records_period
  ON supervision_records(period);

CREATE INDEX IF NOT EXISTS idx_supervision_records_date
  ON supervision_records(supervision_date DESC);

CREATE INDEX IF NOT EXISTS idx_employees_reports_to
  ON employees(reports_to) WHERE reports_to IS NOT NULL;

-- Enable RLS on supervision_records
ALTER TABLE supervision_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service access" ON supervision_records
  FOR ALL TO service_role USING (true);

-- Create a view for supervision status summary
CREATE OR REPLACE VIEW supervision_status AS
SELECT
  e.id as employee_id,
  e.first_name,
  e.last_name,
  e.email,
  e.role,
  e.department,
  e.reports_to,
  e.supervision_frequency,
  supervisor.first_name || ' ' || supervisor.last_name as supervisor_name,
  (
    SELECT MAX(supervision_date)
    FROM supervision_records sr
    WHERE sr.employee_id = e.id
  ) as last_supervision_date,
  (
    SELECT CURRENT_DATE - MAX(supervision_date)
    FROM supervision_records sr
    WHERE sr.employee_id = e.id
  ) as days_since_last_supervision,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM supervision_records sr WHERE sr.employee_id = e.id)
      THEN 'Never'
    WHEN (CURRENT_DATE - (SELECT MAX(supervision_date) FROM supervision_records sr WHERE sr.employee_id = e.id)) > 90
      THEN 'Overdue'
    WHEN (CURRENT_DATE - (SELECT MAX(supervision_date) FROM supervision_records sr WHERE sr.employee_id = e.id)) > 60
      THEN 'Due Soon'
    ELSE 'OK'
  END as status,
  e.start_date
FROM employees e
LEFT JOIN employees supervisor ON supervisor.id = e.reports_to
WHERE e.active = true
ORDER BY e.last_name, e.first_name;

-- Comments for documentation
COMMENT ON COLUMN employees.reports_to IS 'UUID of the supervisor/manager this employee reports to';
COMMENT ON COLUMN employees.supervision_frequency IS 'Number of supervisions required per period (1 or 2)';
COMMENT ON TABLE supervision_records IS 'Records of completed supervision sessions';
COMMENT ON COLUMN supervision_records.period IS 'Year-month in YYYY-MM format for grouping and filtering';
