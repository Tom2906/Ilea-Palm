-- ============================================================
-- Supervision Exceptions Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create supervision_exceptions table
CREATE TABLE IF NOT EXISTS supervision_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM' format
  exception_type TEXT NOT NULL CHECK (exception_type IN ('not_required', 'annual_leave', 'sick_leave')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, period)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_supervision_exceptions_employee
  ON supervision_exceptions(employee_id);

CREATE INDEX IF NOT EXISTS idx_supervision_exceptions_period
  ON supervision_exceptions(period);

CREATE INDEX IF NOT EXISTS idx_supervision_exceptions_type
  ON supervision_exceptions(exception_type);

-- Enable RLS on supervision_exceptions
ALTER TABLE supervision_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service access" ON supervision_exceptions
  FOR ALL TO service_role USING (true);

-- Comments for documentation
COMMENT ON TABLE supervision_exceptions IS 'Tracks when employee supervision is excused for a month';
COMMENT ON COLUMN supervision_exceptions.period IS 'Year-month in YYYY-MM format';
COMMENT ON COLUMN supervision_exceptions.exception_type IS 'Reason: not_required, annual_leave, or sick_leave';
