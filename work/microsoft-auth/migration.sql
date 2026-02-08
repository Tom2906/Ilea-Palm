-- Microsoft Auth: auth_method column + Employee role
-- Safe to re-run: uses IF NOT EXISTS, ON CONFLICT, column existence checks

-- 1. Add auth_method column to users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'auth_method'
    ) THEN
        ALTER TABLE users ADD COLUMN auth_method TEXT NOT NULL DEFAULT 'password'
            CHECK (auth_method IN ('password', 'microsoft', 'both'));
    END IF;
END $$;

-- 2. Make password_hash nullable (required for microsoft-only users)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 3. Rename Staff role to Employee
UPDATE roles SET name = 'Employee', description = 'Self-service access only — no management permissions'
WHERE name = 'Staff';

-- 4. Clear all permissions from the Employee role (self-service is based on employeeId, not permissions)
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'Employee');
