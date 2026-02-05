-- Appraisal Milestones Table
-- Tracks employee appraisal milestones (3 month review, 6 month probation, etc.)
-- Created: 2026-02-05

CREATE TABLE appraisal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN (
    '3_month', '6_month_probation', '9_month', '12_month',
    'year2_3month', 'year2_6month', 'year2_9month', 'year2_annual',
    'year3_3month', 'year3_6month', 'year3_9month', 'year3_appraisal'
  )),
  due_date DATE NOT NULL,
  completed_date DATE,
  conducted_by_id UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, milestone_type)
);

-- Index for common queries
CREATE INDEX idx_appraisal_milestones_employee ON appraisal_milestones(employee_id);
CREATE INDEX idx_appraisal_milestones_due_date ON appraisal_milestones(due_date);
CREATE INDEX idx_appraisal_milestones_status ON appraisal_milestones(completed_date) WHERE completed_date IS NULL;

-- Enable RLS
ALTER TABLE appraisal_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policy for service_role (full access)
CREATE POLICY "service_role_appraisal_milestones" ON appraisal_milestones
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE appraisal_milestones IS 'Tracks employee appraisal milestones based on start date';
COMMENT ON COLUMN appraisal_milestones.milestone_type IS 'Type of milestone: 3_month, 6_month_probation, 9_month, 12_month, year2_*, year3_*';
COMMENT ON COLUMN appraisal_milestones.due_date IS 'Calculated from employee start_date + milestone offset';
COMMENT ON COLUMN appraisal_milestones.completed_date IS 'NULL if not completed, date when appraisal was conducted';
COMMENT ON COLUMN appraisal_milestones.conducted_by_id IS 'Employee who conducted the appraisal (typically supervisor)';
