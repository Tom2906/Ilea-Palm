-- Quick Seed Script - Ready to Run
-- Sets up reporting relationships and adds sample supervisions

-- Set up reporting structure (using names from your system)

-- Seniors report to managers:
UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Ellen' AND last_name = 'Middleton' LIMIT 1),
    supervision_frequency = 2
WHERE first_name = 'Charlotte' AND last_name = 'Watson';

UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Ellen' AND last_name = 'Middleton' LIMIT 1),
    supervision_frequency = 2
WHERE first_name = 'Michelle' AND last_name = 'McSporran';

UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Ellen' AND last_name = 'Middleton' LIMIT 1),
    supervision_frequency = 1
WHERE first_name = 'Philip' AND last_name = 'Thomas';

-- RSWs report to seniors:
UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas' LIMIT 1),
    supervision_frequency = 2
WHERE first_name = 'Sarah' AND last_name = 'Newson';

UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas' LIMIT 1),
    supervision_frequency = 2
WHERE first_name = 'Sam' AND last_name = 'Lawrence';

UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Michelle' AND last_name = 'McSporran' LIMIT 1),
    supervision_frequency = 2
WHERE first_name = 'James' AND last_name = 'Logan';

UPDATE employees
SET reports_to = (SELECT id FROM employees WHERE first_name = 'Charlotte' AND last_name = 'Watson' LIMIT 1),
    supervision_frequency = 2
WHERE first_name = 'Jack' AND last_name = 'McMahon';

-- Add sample supervision records

-- Sarah - recent and OK
INSERT INTO supervision_records (employee_id, conducted_by_id, supervision_date, period)
SELECT
  (SELECT id FROM employees WHERE first_name = 'Sarah' AND last_name = 'Newson' LIMIT 1),
  (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas' LIMIT 1),
  '2026-02-01',
  '2026-02'
WHERE EXISTS (SELECT 1 FROM employees WHERE first_name = 'Sarah' AND last_name = 'Newson')
  AND EXISTS (SELECT 1 FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas');

INSERT INTO supervision_records (employee_id, conducted_by_id, supervision_date, period)
SELECT
  (SELECT id FROM employees WHERE first_name = 'Sarah' AND last_name = 'Newson' LIMIT 1),
  (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas' LIMIT 1),
  '2025-12-10',
  '2025-12'
WHERE EXISTS (SELECT 1 FROM employees WHERE first_name = 'Sarah' AND last_name = 'Newson')
  AND EXISTS (SELECT 1 FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas');

-- Sam - recent
INSERT INTO supervision_records (employee_id, conducted_by_id, supervision_date, period, notes)
SELECT
  (SELECT id FROM employees WHERE first_name = 'Sam' AND last_name = 'Lawrence' LIMIT 1),
  (SELECT id FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas' LIMIT 1),
  '2026-02-09',
  '2026-02',
  '3 month review'
WHERE EXISTS (SELECT 1 FROM employees WHERE first_name = 'Sam' AND last_name = 'Lawrence')
  AND EXISTS (SELECT 1 FROM employees WHERE first_name = 'Philip' AND last_name = 'Thomas');

-- James - OLD (will show as overdue)
INSERT INTO supervision_records (employee_id, conducted_by_id, supervision_date, period)
SELECT
  (SELECT id FROM employees WHERE first_name = 'James' AND last_name = 'Logan' LIMIT 1),
  (SELECT id FROM employees WHERE first_name = 'Michelle' AND last_name = 'McSporran' LIMIT 1),
  '2025-06-15',
  '2025-06'
WHERE EXISTS (SELECT 1 FROM employees WHERE first_name = 'James')
  AND EXISTS (SELECT 1 FROM employees WHERE first_name = 'Michelle' AND last_name = 'McSporran');

-- Jack - due soon
INSERT INTO supervision_records (employee_id, conducted_by_id, supervision_date, period)
SELECT
  (SELECT id FROM employees WHERE first_name = 'Jack' AND last_name = 'McMahon' LIMIT 1),
  (SELECT id FROM employees WHERE first_name = 'Charlotte' AND last_name = 'Watson' LIMIT 1),
  '2025-11-15',
  '2025-11'
WHERE EXISTS (SELECT 1 FROM employees WHERE first_name = 'Jack' AND last_name = 'McMahon')
  AND EXISTS (SELECT 1 FROM employees WHERE first_name = 'Charlotte' AND last_name = 'Watson');

-- Ellen supervising Charlotte
INSERT INTO supervision_records (employee_id, conducted_by_id, supervision_date, period)
SELECT
  (SELECT id FROM employees WHERE first_name = 'Charlotte' AND last_name = 'Watson' LIMIT 1),
  (SELECT id FROM employees WHERE first_name = 'Ellen' AND last_name = 'Middleton' LIMIT 1),
  '2026-01-20',
  '2026-01'
WHERE EXISTS (SELECT 1 FROM employees WHERE first_name = 'Charlotte' AND last_name = 'Watson')
  AND EXISTS (SELECT 1 FROM employees WHERE first_name = 'Ellen' AND last_name = 'Middleton');

-- Check what we created:
SELECT
  e.first_name || ' ' || e.last_name as employee,
  e.role,
  s.first_name || ' ' || s.last_name as reports_to,
  e.supervision_frequency as freq,
  COUNT(sr.id) as supervisions,
  MAX(sr.supervision_date) as last_supervision
FROM employees e
LEFT JOIN employees s ON e.reports_to = s.id
LEFT JOIN supervision_records sr ON sr.employee_id = e.id
WHERE e.active = true
GROUP BY e.id, e.first_name, e.last_name, e.role, s.first_name, s.last_name, e.supervision_frequency
ORDER BY e.last_name;
