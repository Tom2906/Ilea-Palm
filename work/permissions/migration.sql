-- Role-Based Permission System Migration
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    data_scope TEXT NOT NULL DEFAULT 'own' CHECK (data_scope IN ('all', 'reports', 'own')),
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    PRIMARY KEY (role_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission);

-- 3. Seed default system roles
INSERT INTO roles (name, description, data_scope, is_system)
VALUES
    ('Administrator', 'Full access to all features and data', 'all', true),
    ('Manager', 'Can manage direct reports - supervisions, training, leave', 'reports', true),
    ('Staff', 'Basic access to own data only', 'own', true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    data_scope = EXCLUDED.data_scope,
    is_system = true;

-- 4. Seed Administrator permissions (all 15)
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, p.permission
FROM roles r
CROSS JOIN (VALUES
    ('employees.manage'),
    ('training_courses.manage'),
    ('training_records.record'),
    ('supervisions.create'),
    ('supervisions.manage'),
    ('onboarding.manage'),
    ('appraisals.manage'),
    ('leave.approve'),
    ('leave.manage_entitlements'),
    ('rotas.edit'),
    ('settings.manage'),
    ('notifications.manage'),
    ('audit_log.view'),
    ('users.manage'),
    ('employee_statuses.manage')
) AS p(permission)
WHERE r.name = 'Administrator'
ON CONFLICT DO NOTHING;

-- 5. Seed Manager permissions
INSERT INTO role_permissions (role_id, permission)
SELECT r.id, p.permission
FROM roles r
CROSS JOIN (VALUES
    ('training_records.record'),
    ('supervisions.create'),
    ('leave.approve')
) AS p(permission)
WHERE r.name = 'Manager'
ON CONFLICT DO NOTHING;

-- Staff gets no permissions (authenticated access only)

-- 6. Add role_id column to users (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role_id'
    ) THEN
        ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);
    END IF;
END $$;

-- 7. Populate role_id from existing role text column
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Administrator')
WHERE role = 'admin' AND role_id IS NULL;

UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Manager')
WHERE role = 'manager' AND role_id IS NULL;

UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Staff')
WHERE role = 'user' AND role_id IS NULL;

-- Catch any remaining users
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Staff')
WHERE role_id IS NULL;

-- 8. Make role_id NOT NULL
ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

-- 9. Drop old role column (safe — only if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        ALTER TABLE users DROP COLUMN role;
    END IF;
END $$;
