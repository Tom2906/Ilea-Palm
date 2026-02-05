-- Supervision Requirements Table
-- Stores effective-dated supervision requirements per employee
-- To find requirement for a month: SELECT WHERE effective_from <= month ORDER BY effective_from DESC LIMIT 1

CREATE TABLE IF NOT EXISTS supervision_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    effective_from DATE NOT NULL,
    required_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, effective_from)
);

-- Index for efficient lookups
CREATE INDEX idx_supervision_requirements_employee_effective
ON supervision_requirements(employee_id, effective_from DESC);

-- Insert default requirement (1/month) for all existing employees from their start date
INSERT INTO supervision_requirements (employee_id, effective_from, required_count)
SELECT id, start_date, 1
FROM employees
WHERE NOT EXISTS (
    SELECT 1 FROM supervision_requirements sr WHERE sr.employee_id = employees.id
);
