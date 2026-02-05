-- Migration: Add is_completed and required_count fields to supervision_records
-- is_completed: distinguishes between planned and completed supervisions
-- required_count: captures how many supervisions were required for that month at time of entry

ALTER TABLE supervision_records
ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE supervision_records
ADD COLUMN required_count INTEGER NOT NULL DEFAULT 1;

-- Existing records are assumed to be completed
-- New records will default to true but can be set to false for planned supervisions
-- required_count defaults to 1, but should be set from employee.supervision_frequency at creation time

COMMENT ON COLUMN supervision_records.is_completed IS 'Whether the supervision has been completed (true) or is planned/scheduled (false)';
COMMENT ON COLUMN supervision_records.required_count IS 'How many supervisions were required for this employee in this month (captured at entry time)';
