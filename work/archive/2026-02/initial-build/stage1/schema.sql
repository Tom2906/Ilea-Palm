-- ============================================================
-- Employee Training Management System - Database Schema
-- Run this in Supabase SQL Editor (all at once)
-- ============================================================

-- ==================== TABLES ====================

-- employees (must be created before users due to FK)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'Residential Support Worker',
  start_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- users (authentication, separate from employees)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- training_courses
CREATE TABLE training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Online Mandatory', 'F2F Mandatory', 'Additional')),
  validity_months INTEGER, -- null = never expires
  notification_days_before INTEGER NOT NULL DEFAULT 30,
  notify_employee BOOLEAN NOT NULL DEFAULT true,
  notify_admin BOOLEAN NOT NULL DEFAULT true,
  mandatory_for_roles TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- training_records
CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES training_courses(id) ON DELETE RESTRICT,
  completion_date DATE NOT NULL,
  expiry_date DATE, -- auto-calculated from course validity_months
  certificate_url TEXT,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (expiry_date IS NULL OR expiry_date > completion_date)
);

-- onboarding_items
CREATE TABLE onboarding_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- onboarding_records
CREATE TABLE onboarding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES onboarding_items(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'not_required')),
  completed_date DATE,
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, item_id)
);

-- notification_log
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_record_id UUID NOT NULL REFERENCES training_records(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  course_id UUID NOT NULL REFERENCES training_courses(id),
  recipient_email TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('employee', 'admin')),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('expiry_warning', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  days_until_expiry INTEGER
);

-- audit_log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== VIEW ====================

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
    WHEN tr.expiry_date <= CURRENT_DATE + (tc.notification_days_before || ' days')::INTERVAL THEN 'Expiring Soon'
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

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies (our .NET API uses service_role key)
CREATE POLICY "Service access" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON employees FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON training_courses FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON training_records FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON onboarding_items FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON onboarding_records FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON notification_log FOR ALL TO service_role USING (true);
CREATE POLICY "Service access" ON audit_log FOR ALL TO service_role USING (true);

-- ==================== INDEXES ====================

CREATE INDEX idx_training_records_employee ON training_records(employee_id);
CREATE INDEX idx_training_records_course ON training_records(course_id);
CREATE INDEX idx_training_records_expiry ON training_records(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_employees_active ON employees(active) WHERE active = true;
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_onboarding_records_employee ON onboarding_records(employee_id);
CREATE INDEX idx_notification_log_record ON notification_log(training_record_id);
CREATE INDEX idx_notification_log_sent ON notification_log(sent_at);
