-- Drop review_number column from appraisal_milestones
-- Review numbers are now calculated from chronological due_date order
-- Unique constraint changes from (employee_id, review_number) to (employee_id, due_date)

-- Drop old unique constraint
ALTER TABLE appraisal_milestones
  DROP CONSTRAINT IF EXISTS appraisal_milestones_employee_review_unique;

-- Drop review_number column
ALTER TABLE appraisal_milestones
  DROP COLUMN IF EXISTS review_number;

-- Add new unique constraint on (employee_id, due_date)
ALTER TABLE appraisal_milestones
  ADD CONSTRAINT appraisal_milestones_employee_due_date_unique
  UNIQUE (employee_id, due_date);
