-- ============================================================
-- Migration: Fix pending_notifications to use simple date math
-- Run this in Supabase SQL Editor
-- ============================================================
-- The old view depended on training_status statuses to decide
-- who gets notified. That's the wrong approach — notifications
-- should just be: "expiry_date is within notification_days_before
-- days from now, and we haven't reminded within
-- reminder_frequency_days." No status dependency.
-- ============================================================

DROP VIEW IF EXISTS pending_notifications;

CREATE VIEW pending_notifications AS

-- Employee notifications
SELECT
  tr.id AS training_record_id,
  e.id AS employee_id,
  e.first_name,
  e.last_name,
  e.email AS recipient_email,
  tc.id AS course_id,
  tc.name AS course_name,
  tc.category,
  tr.expiry_date,
  (tr.expiry_date - CURRENT_DATE) AS days_until_expiry,
  CASE
    WHEN tr.expiry_date < CURRENT_DATE THEN 'Expired'
    ELSE 'Expiring Soon'
  END AS status,
  'employee' AS recipient_type,
  CASE
    WHEN tr.expiry_date < CURRENT_DATE THEN 'expired'
    ELSE 'expiry_warning'
  END AS notification_type,
  tc.notification_days_before,
  tc.reminder_frequency_days
FROM training_records tr
JOIN employees e ON e.id = tr.employee_id
JOIN training_courses tc ON tc.id = tr.course_id
WHERE e.active = true
  AND tc.notify_employee = true
  AND tr.expiry_date IS NOT NULL
  AND tr.expiry_date <= CURRENT_DATE + (tc.notification_days_before || ' days')::INTERVAL
  AND tr.id = (
    SELECT id FROM training_records
    WHERE employee_id = e.id AND course_id = tc.id
    ORDER BY completion_date DESC LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM notification_log nl
    WHERE nl.training_record_id = tr.id
      AND nl.recipient_email = e.email
      AND nl.notification_type = CASE WHEN tr.expiry_date < CURRENT_DATE THEN 'expired' ELSE 'expiry_warning' END
      AND nl.sent_at > NOW() - (tc.reminder_frequency_days || ' days')::INTERVAL
  )

UNION ALL

-- Admin notifications
SELECT
  tr.id AS training_record_id,
  e.id AS employee_id,
  e.first_name,
  e.last_name,
  u.email AS recipient_email,
  tc.id AS course_id,
  tc.name AS course_name,
  tc.category,
  tr.expiry_date,
  (tr.expiry_date - CURRENT_DATE) AS days_until_expiry,
  CASE
    WHEN tr.expiry_date < CURRENT_DATE THEN 'Expired'
    ELSE 'Expiring Soon'
  END AS status,
  'admin' AS recipient_type,
  CASE
    WHEN tr.expiry_date < CURRENT_DATE THEN 'expired'
    ELSE 'expiry_warning'
  END AS notification_type,
  tc.notification_days_before,
  tc.reminder_frequency_days
FROM training_records tr
JOIN employees e ON e.id = tr.employee_id
JOIN training_courses tc ON tc.id = tr.course_id
CROSS JOIN users u
WHERE e.active = true
  AND tc.notify_admin = true
  AND u.role = 'admin' AND u.active = true
  AND tr.expiry_date IS NOT NULL
  AND tr.expiry_date <= CURRENT_DATE + (tc.notification_days_before || ' days')::INTERVAL
  AND tr.id = (
    SELECT id FROM training_records
    WHERE employee_id = e.id AND course_id = tc.id
    ORDER BY completion_date DESC LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM notification_log nl
    WHERE nl.training_record_id = tr.id
      AND nl.recipient_email = u.email
      AND nl.notification_type = CASE WHEN tr.expiry_date < CURRENT_DATE THEN 'expired' ELSE 'expiry_warning' END
      AND nl.sent_at > NOW() - (tc.reminder_frequency_days || ' days')::INTERVAL
  )

ORDER BY expiry_date ASC NULLS LAST;
