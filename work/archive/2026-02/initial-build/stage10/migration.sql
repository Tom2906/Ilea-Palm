-- ============================================================
-- Migration: Notification Reminder Frequency + Pending Notifications View
-- Run this in Supabase SQL Editor
-- ============================================================

-- ==================== ADD REMINDER FREQUENCY TO TRAINING COURSES ====================

ALTER TABLE training_courses
  ADD COLUMN reminder_frequency_days INTEGER NOT NULL DEFAULT 7;

COMMENT ON COLUMN training_courses.reminder_frequency_days IS
  'Days between repeat notification emails once a course enters Expiring Soon or Expired status';

-- ==================== PENDING NOTIFICATIONS VIEW ====================

-- Returns one row per notification that needs sending right now.
-- Covers both employee and admin recipients.
-- Filters out notifications already sent within the reminder_frequency_days window.

CREATE VIEW pending_notifications AS

-- Employee notifications
SELECT
  ts.training_record_id,
  ts.employee_id,
  ts.first_name,
  ts.last_name,
  ts.email AS recipient_email,
  ts.course_id,
  ts.course_name,
  ts.category,
  ts.expiry_date,
  ts.days_until_expiry,
  ts.status,
  'employee' AS recipient_type,
  CASE WHEN ts.status = 'Expired' THEN 'expired' ELSE 'expiry_warning' END AS notification_type,
  ts.notification_days_before,
  tc.reminder_frequency_days
FROM training_status ts
JOIN training_courses tc ON tc.id = ts.course_id
WHERE ts.status IN ('Expiring Soon', 'Expired')
  AND ts.training_record_id IS NOT NULL
  AND ts.notify_employee = true
  AND NOT EXISTS (
    SELECT 1 FROM notification_log nl
    WHERE nl.training_record_id = ts.training_record_id
      AND nl.recipient_email = ts.email
      AND nl.notification_type = CASE WHEN ts.status = 'Expired' THEN 'expired' ELSE 'expiry_warning' END
      AND nl.sent_at > NOW() - (tc.reminder_frequency_days || ' days')::INTERVAL
  )

UNION ALL

-- Admin notifications
SELECT
  ts.training_record_id,
  ts.employee_id,
  ts.first_name,
  ts.last_name,
  u.email AS recipient_email,
  ts.course_id,
  ts.course_name,
  ts.category,
  ts.expiry_date,
  ts.days_until_expiry,
  ts.status,
  'admin' AS recipient_type,
  CASE WHEN ts.status = 'Expired' THEN 'expired' ELSE 'expiry_warning' END AS notification_type,
  ts.notification_days_before,
  tc.reminder_frequency_days
FROM training_status ts
JOIN training_courses tc ON tc.id = ts.course_id
CROSS JOIN users u
WHERE ts.status IN ('Expiring Soon', 'Expired')
  AND ts.training_record_id IS NOT NULL
  AND ts.notify_admin = true
  AND u.role = 'admin' AND u.active = true
  AND NOT EXISTS (
    SELECT 1 FROM notification_log nl
    WHERE nl.training_record_id = ts.training_record_id
      AND nl.recipient_email = u.email
      AND nl.notification_type = CASE WHEN ts.status = 'Expired' THEN 'expired' ELSE 'expiry_warning' END
      AND nl.sent_at > NOW() - (tc.reminder_frequency_days || ' days')::INTERVAL
  )

ORDER BY expiry_date ASC NULLS LAST;
