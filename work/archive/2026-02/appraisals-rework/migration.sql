-- Appraisal System Rework Migration
-- Replaces fixed 12-milestone grid with frequency-based model
-- Run against Supabase PostgreSQL

-- 1. Add appraisal_frequency_months to employees (default 3)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS appraisal_frequency_months INTEGER DEFAULT 3;

-- 2. Add review_number column to appraisal_milestones
ALTER TABLE appraisal_milestones
  ADD COLUMN IF NOT EXISTS review_number INTEGER;

-- 3. Drop the old unique constraint (milestone_type based)
ALTER TABLE appraisal_milestones
  DROP CONSTRAINT IF EXISTS appraisal_milestones_employee_id_milestone_type_key;

-- 4. Migrate existing data: map milestone_type to review_number
UPDATE appraisal_milestones SET review_number = CASE milestone_type
  WHEN '3_month' THEN 1
  WHEN '6_month_probation' THEN 2
  WHEN '9_month' THEN 3
  WHEN '12_month' THEN 4
  WHEN 'year2_3month' THEN 5
  WHEN 'year2_6month' THEN 6
  WHEN 'year2_9month' THEN 7
  WHEN 'year2_annual' THEN 8
  WHEN 'year3_3month' THEN 9
  WHEN 'year3_6month' THEN 10
  WHEN 'year3_9month' THEN 11
  WHEN 'year3_appraisal' THEN 12
END WHERE review_number IS NULL;

-- 5. Make review_number NOT NULL after migration
ALTER TABLE appraisal_milestones ALTER COLUMN review_number SET NOT NULL;

-- 6. Add new unique constraint (employee + review_number)
ALTER TABLE appraisal_milestones
  ADD CONSTRAINT appraisal_milestones_employee_review_unique
  UNIQUE (employee_id, review_number);

-- 7. Drop milestone_type column (no longer needed)
ALTER TABLE appraisal_milestones DROP COLUMN IF EXISTS milestone_type;

-- 8. Add appraisal grid settings to company_settings
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS appraisal_reviews_back INTEGER DEFAULT 2;
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS appraisal_reviews_forward INTEGER DEFAULT 2;
