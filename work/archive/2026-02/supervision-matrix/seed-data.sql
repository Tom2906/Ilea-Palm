-- ============================================================
-- Supervision Matrix Seed Data
-- Run this in Supabase SQL Editor
-- ============================================================
-- NOTE: Update the UUIDs below to match your actual employee IDs

-- First, let's see what employees you have:
-- SELECT id, first_name, last_name, role FROM employees ORDER BY last_name;

-- EXAMPLE: Set up reporting relationships (update these UUIDs with your actual employee IDs)
-- Replace 'EMPLOYEE_UUID' with actual UUIDs from your employees table

/*
-- Example structure based on the Excel data:
-- Ellen (RM) supervises: Charlotte, Michelle, Phil, Leila
-- Leila supervises: Phil, Charlotte
-- Charlotte (DM) supervises: William, Jack, Sarah, Michelle
-- Phil supervises: Sarah, Sam, James
-- Michelle supervises: James, Jack

-- Set reports_to for seniors (they report to managers):
UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Ellen' AND last_name = 'Middleton'),
    supervision_frequency = 2
WHERE first_name = 'Charlotte' AND last_name = 'Watson';

UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Ellen' AND last_name = 'Middleton'),
    supervision_frequency = 2
WHERE first_name = 'Michelle' AND last_name = 'McSporran';

UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Ellen' AND last_name = 'Middleton'),
    supervision_frequency = 1
WHERE first_name = 'Philip' AND last_name = 'Thomas';

-- Set reports_to for RSWs (they report to seniors):
UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas'),
    supervision_frequency = 2
WHERE first_name = 'Sarah' AND last_name = 'Newson';

UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas'),
    supervision_frequency = 2
WHERE first_name = 'Sam' AND last_name = 'Lawrence';

UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Michelle' AND last_name = 'McSporran'),
    supervision_frequency = 2
WHERE first_name = 'James' AND last_name = 'Logan';

UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Michelle' AND last_name = 'McSporran'),
    supervision_frequency = 2
WHERE first_name = 'Jack' AND last_name = 'McMahon';
*/

-- Add some example supervision records (update with your employee IDs):
/*
-- Sarah supervised by Phil - recent supervisions
INSERT INTO supervision_records (employee_id, conducted_by_id, supervision_date, period, notes)
VALUES
(
  (SELECT id FROM employees WHERE first_name = 'Sarah' AND last_name = 'Newson'),
  (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas'),
  '2025-12-15',
  '2025-12',
  NULL
),
(
  (SELECT id FROM employees WHERE first_name = 'Sarah' AND last_name = 'Newson'),
  (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas'),
  '2025-10-20',
  '2025-10',
  NULL
),
(
  (SELECT id FROM employees WHERE first_name = 'Sarah' AND last_name = 'Newson'),
  (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas'),
  '2025-08-12',
  '2025-08',
  'EM'
);

-- Sam supervised by Phil - recent
INSERT INTO supervision_records (employee_id, conducted_by_id, supervision_date, period, notes)
VALUES
(
  (SELECT id FROM employees WHERE first_name = 'Sam' AND last_name = 'Lawrence'),
  (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas'),
  '2026-02-09',
  '2026-02',
  NULL
),
(
  (SELECT id FROM employees WHERE first_name = 'Sam' AND last_name = 'Lawrence'),
  (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas'),
  '2025-12-05',
  '2025-12',
  NULL
);

-- James - NO recent supervisions (will show as overdue)
INSERT INTO supervision_records (employee_id, conducted_by_id, supervision_date, period, notes)
VALUES
(
  (SELECT id FROM employees WHERE first_name = 'James' AND last_name = 'Logan'),
  (SELECT id FROM employees WHERE first_name = 'Michelle' AND last_name = 'McSporran'),
  '2025-06-15',
  '2025-06',
  NULL
);

-- Jack - moderate (due soon)
INSERT INTO supervision_records (employee_id, conducted_by_id, supervision_date, period, notes)
VALUES
(
  (SELECT id FROM employees WHERE first_name = 'Jack' AND last_name = 'McMahon'),
  (SELECT id FROM employees WHERE first_name = 'Charlotte' AND last_name = 'Watson'),
  '2025-11-10',
  '2025-11',
  NULL
);
*/

-- Quick check query:
SELECT
  e.first_name || ' ' || e.last_name as employee,
  s.first_name || ' ' || s.last_name as supervisor,
  e.supervision_frequency,
  COUNT(sr.id) as supervision_count
FROM employees e
LEFT JOIN employees s ON e.reports_to = s.id
LEFT JOIN supervision_records sr ON sr.employee_id = e.id
WHERE e.active = true
GROUP BY e.id, e.first_name, e.last_name, s.first_name, s.last_name, e.supervision_frequency
ORDER BY e.last_name;
