-- ============================================================
-- Company Settings & Expiry Warning Days Migration
-- ============================================================

-- 1. Create company_settings table (singleton - one row)
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Ilea Palm',

  -- Training defaults
  default_expiry_warning_days INTEGER NOT NULL DEFAULT 30,
  default_notification_days_before INTEGER NOT NULL DEFAULT 0,
  default_reminder_frequency_days INTEGER NOT NULL DEFAULT 7,
  default_notify_employee BOOLEAN NOT NULL DEFAULT true,
  default_notify_admin BOOLEAN NOT NULL DEFAULT true,

  -- Supervision defaults
  default_supervision_frequency_months INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO company_settings (company_name) VALUES ('Ilea Palm');

-- RLS policy
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service access" ON company_settings FOR ALL TO service_role USING (true);

-- 2. Add expiry_warning_days_before to training_courses
ALTER TABLE training_courses
ADD COLUMN expiry_warning_days_before INTEGER NOT NULL DEFAULT 30;

-- Set existing courses to use current notification_days_before value for warning
UPDATE training_courses
SET expiry_warning_days_before = notification_days_before;

-- 3. Add reminder_frequency_days if not exists (check schema)
-- ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS reminder_frequency_days INTEGER NOT NULL DEFAULT 7;

-- 4. Update training_status view to use expiry_warning_days_before for status
DROP VIEW IF EXISTS training_status;

CREATE VIEW training_status AS
SELECT
  e.id as employee_id,
  e.first_name,
  e.last_name,
  e.email,
  e.department,
  tc.id as course_id,
  tc.name as course_name,
  tc.category,
  tc.validity_months,
  tc.expiry_warning_days_before,
  tc.notification_days_before,
  tc.notify_employee,
  tc.notify_admin,
  tc.mandatory_for_roles,
  tr.id as training_record_id,
  tr.completion_date,
  tr.expiry_date,
  CASE
    WHEN tr.completion_date IS NULL THEN 'Not Completed'
    WHEN tr.expiry_date IS NULL THEN 'Completed'
    WHEN tr.expiry_date < CURRENT_DATE THEN 'Expired'
    WHEN tr.expiry_date <= CURRENT_DATE + (tc.expiry_warning_days_before || ' days')::INTERVAL THEN 'Expiring Soon'
    ELSE 'Valid'
  END as status,
  CASE
    WHEN tr.expiry_date IS NOT NULL THEN tr.expiry_date - CURRENT_DATE
    ELSE NULL
  END as days_until_expiry
FROM employees e
CROSS JOIN training_courses tc
LEFT JOIN training_records tr ON
  tr.employee_id = e.id AND
  tr.course_id = tc.id AND
  tr.id = (
    SELECT id FROM training_records
    WHERE employee_id = e.id AND course_id = tc.id
    ORDER BY completion_date DESC LIMIT 1
  )
WHERE e.active = true
  AND (tc.mandatory_for_roles IS NULL OR e.role = ANY(tc.mandatory_for_roles));
