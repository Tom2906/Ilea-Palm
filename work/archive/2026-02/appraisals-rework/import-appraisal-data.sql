-- Appraisal data import from spreadsheet
-- Source: Supervision Matrix Updated 08.12.25.xlsx (Apprasials tab)
-- Generated: 2026-02-07

-- Ensure all employees have appraisal_frequency_months = 3
UPDATE employees SET appraisal_frequency_months = 3 WHERE appraisal_frequency_months IS NULL;

-- Ellen Middleton: No review records to import
-- Charlotte Watson (started 27.11.2023)
INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 4, '2024-11-27', '2025-07-21'
FROM employees e
WHERE e.first_name = 'Charlotte' AND e.last_name = 'Watson'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #4 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 7, '2025-08-27', '2025-10-20'
FROM employees e
WHERE e.first_name = 'Charlotte' AND e.last_name = 'Watson'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #7 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 8, '2025-11-27', '2025-11-24'
FROM employees e
WHERE e.first_name = 'Charlotte' AND e.last_name = 'Watson'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #8 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 9, '2026-02-01', NULL
FROM employees e
WHERE e.first_name = 'Charlotte' AND e.last_name = 'Watson'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #9 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 10, '2026-05-01', NULL
FROM employees e
WHERE e.first_name = 'Charlotte' AND e.last_name = 'Watson'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #10 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 11, '2026-08-01', NULL
FROM employees e
WHERE e.first_name = 'Charlotte' AND e.last_name = 'Watson'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #11 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 12, '2026-11-01', NULL
FROM employees e
WHERE e.first_name = 'Charlotte' AND e.last_name = 'Watson'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #12 (pending)

-- Phil Thomas (started 27.11.2023)
INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 4, '2024-11-27', '2025-07-15'
FROM employees e
WHERE e.first_name = 'Phil' AND e.last_name = 'Thomas'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #4 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 8, '2025-11-27', '2025-11-17'
FROM employees e
WHERE e.first_name = 'Phil' AND e.last_name = 'Thomas'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #8 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 9, '2026-02-01', NULL
FROM employees e
WHERE e.first_name = 'Phil' AND e.last_name = 'Thomas'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #9 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 10, '2026-05-01', NULL
FROM employees e
WHERE e.first_name = 'Phil' AND e.last_name = 'Thomas'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #10 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 11, '2026-08-01', NULL
FROM employees e
WHERE e.first_name = 'Phil' AND e.last_name = 'Thomas'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #11 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 12, '2026-11-01', NULL
FROM employees e
WHERE e.first_name = 'Phil' AND e.last_name = 'Thomas'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #12 (pending)

-- Michelle McSporran (started 01.07.2024)
INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 4, '2025-07-01', '2025-08-21'
FROM employees e
WHERE e.first_name = 'Michelle' AND e.last_name = 'McSporran'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #4 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 5, '2025-10-01', '2025-10-10'
FROM employees e
WHERE e.first_name = 'Michelle' AND e.last_name = 'McSporran'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #5 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 6, '2026-01-01', NULL
FROM employees e
WHERE e.first_name = 'Michelle' AND e.last_name = 'McSporran'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #6 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 7, '2026-04-01', NULL
FROM employees e
WHERE e.first_name = 'Michelle' AND e.last_name = 'McSporran'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #7 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 8, '2026-07-01', NULL
FROM employees e
WHERE e.first_name = 'Michelle' AND e.last_name = 'McSporran'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #8 (pending)

-- James Logan (started 12.05.2025)
INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 1, '2025-08-12', '2025-09-12'
FROM employees e
WHERE e.first_name = 'James' AND e.last_name = 'Logan'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #1 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 2, '2025-11-12', '2025-11-28'
FROM employees e
WHERE e.first_name = 'James' AND e.last_name = 'Logan'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #2 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 3, '2026-02-01', NULL
FROM employees e
WHERE e.first_name = 'James' AND e.last_name = 'Logan'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #3 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 4, '2026-05-01', NULL
FROM employees e
WHERE e.first_name = 'James' AND e.last_name = 'Logan'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #4 (pending)

-- Sarah Newson (started 21.05.2025)
INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 1, '2025-08-21', '2025-09-18'
FROM employees e
WHERE e.first_name = 'Sarah' AND e.last_name = 'Newson'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #1 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 2, '2025-11-21', '2025-11-12'
FROM employees e
WHERE e.first_name = 'Sarah' AND e.last_name = 'Newson'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #2 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 3, '2026-02-01', NULL
FROM employees e
WHERE e.first_name = 'Sarah' AND e.last_name = 'Newson'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #3 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 4, '2026-05-01', NULL
FROM employees e
WHERE e.first_name = 'Sarah' AND e.last_name = 'Newson'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #4 (pending)

-- Jack McMahon (started 08.09.2025)
INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 1, '2025-12-08', '2025-12-09'
FROM employees e
WHERE e.first_name = 'Jack' AND e.last_name = 'McMahon'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #1 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 2, '2026-03-01', NULL
FROM employees e
WHERE e.first_name = 'Jack' AND e.last_name = 'McMahon'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #2 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 3, '2026-06-01', NULL
FROM employees e
WHERE e.first_name = 'Jack' AND e.last_name = 'McMahon'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #3 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 4, '2026-09-01', NULL
FROM employees e
WHERE e.first_name = 'Jack' AND e.last_name = 'McMahon'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #4 (pending)

-- Samuel Lawrence (started 22.09.2025)
INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 1, '2025-12-22', '2025-12-22'
FROM employees e
WHERE e.first_name = 'Samuel' AND e.last_name = 'Lawrence'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #1 (completed)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 2, '2026-03-01', NULL
FROM employees e
WHERE e.first_name = 'Samuel' AND e.last_name = 'Lawrence'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #2 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 3, '2026-06-01', NULL
FROM employees e
WHERE e.first_name = 'Samuel' AND e.last_name = 'Lawrence'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #3 (pending)

INSERT INTO appraisal_milestones (employee_id, review_number, due_date, completed_date)
SELECT e.id, 4, '2026-09-01', NULL
FROM employees e
WHERE e.first_name = 'Samuel' AND e.last_name = 'Lawrence'
ON CONFLICT (employee_id, review_number) DO UPDATE SET
  due_date = EXCLUDED.due_date,
  completed_date = EXCLUDED.completed_date,
  updated_at = NOW();
-- ^ Review #4 (pending)

-- Verify: SELECT e.first_name, e.last_name, am.review_number, am.due_date, am.completed_date
-- FROM appraisal_milestones am JOIN employees e ON e.id = am.employee_id ORDER BY e.last_name, am.review_number;
