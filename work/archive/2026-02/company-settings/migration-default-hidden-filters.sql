-- Add default hidden filters for matrices
ALTER TABLE company_settings
ADD COLUMN default_hidden_roles TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN default_hidden_employee_statuses TEXT[] NOT NULL DEFAULT '{}';
