-- Migration: Add employee status to supervision_status view

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
  e.start_date,
  es.name as employee_status
FROM employees e
LEFT JOIN employees supervisor ON supervisor.id = e.reports_to
LEFT JOIN employee_statuses es ON es.id = e.status_id
WHERE e.active = true
ORDER BY e.last_name, e.first_name;
