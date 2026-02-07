-- =============================================================================
-- Granular Permission System Migration
-- Expands 15 coarse permissions to 40 granular permissions with per-permission scopes
-- Safe to re-run: uses IF NOT EXISTS, ON CONFLICT DO NOTHING, column existence checks
-- =============================================================================

-- Step 1: Add scope column to role_permissions (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'role_permissions' AND column_name = 'scope'
    ) THEN
        ALTER TABLE role_permissions ADD COLUMN scope TEXT NOT NULL DEFAULT 'all'
            CHECK (scope IN ('all', 'reports', 'own'));
    END IF;
END $$;

-- Step 2: Set scope on existing permissions based on each role's current data_scope
-- (only matters if scope column was just added — existing rows get their role's data_scope)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'roles' AND column_name = 'data_scope'
    ) THEN
        UPDATE role_permissions rp
        SET scope = r.data_scope
        FROM roles r
        WHERE rp.role_id = r.id
          AND rp.scope = 'all'  -- only update rows still at default
          AND r.data_scope != 'all';  -- skip if already 'all'
    END IF;
END $$;

-- Step 3: Expand old coarse permission keys into granular ones
-- Each old permission maps to multiple new ones, keeping the same scope

-- employees.manage → employees.view + employees.add + employees.edit + employees.delete
INSERT INTO role_permissions (role_id, permission, scope)
SELECT rp.role_id, new_perm, rp.scope
FROM role_permissions rp
CROSS JOIN (VALUES ('employees.view'), ('employees.add'), ('employees.edit'), ('employees.delete')) AS t(new_perm)
WHERE rp.permission = 'employees.manage'
ON CONFLICT DO NOTHING;

-- training_courses.manage → training_courses.view + training_courses.add + training_courses.edit + training_courses.delete + training_matrix.view
INSERT INTO role_permissions (role_id, permission, scope)
SELECT rp.role_id, new_perm, rp.scope
FROM role_permissions rp
CROSS JOIN (VALUES ('training_courses.view'), ('training_courses.add'), ('training_courses.edit'), ('training_courses.delete'), ('training_matrix.view')) AS t(new_perm)
WHERE rp.permission = 'training_courses.manage'
ON CONFLICT DO NOTHING;

-- training_records.record stays as-is (already granular), but also grant training_matrix.view
INSERT INTO role_permissions (role_id, permission, scope)
SELECT rp.role_id, 'training_matrix.view', rp.scope
FROM role_permissions rp
WHERE rp.permission = 'training_records.record'
ON CONFLICT DO NOTHING;

-- supervisions.create → supervisions.add (rename)
INSERT INTO role_permissions (role_id, permission, scope)
SELECT rp.role_id, 'supervisions.add', rp.scope
FROM role_permissions rp
WHERE rp.permission = 'supervisions.create'
ON CONFLICT DO NOTHING;

-- supervisions.manage → supervisions.view + supervisions.add + supervisions.edit + supervisions.delete
INSERT INTO role_permissions (role_id, permission, scope)
SELECT rp.role_id, new_perm, rp.scope
FROM role_permissions rp
CROSS JOIN (VALUES ('supervisions.view'), ('supervisions.add'), ('supervisions.edit'), ('supervisions.delete')) AS t(new_perm)
WHERE rp.permission = 'supervisions.manage'
ON CONFLICT DO NOTHING;

-- Also grant supervisions.view for those who only had supervisions.create
INSERT INTO role_permissions (role_id, permission, scope)
SELECT rp.role_id, 'supervisions.view', rp.scope
FROM role_permissions rp
WHERE rp.permission = 'supervisions.create'
ON CONFLICT DO NOTHING;

-- onboarding.manage → onboarding.view + onboarding.add + onboarding.edit + onboarding.delete
INSERT INTO role_permissions (role_id, permission, scope)
SELECT rp.role_id, new_perm, rp.scope
FROM role_permissions rp
CROSS JOIN (VALUES ('onboarding.view'), ('onboarding.add'), ('onboarding.edit'), ('onboarding.delete')) AS t(new_perm)
WHERE rp.permission = 'onboarding.manage'
ON CONFLICT DO NOTHING;

-- appraisals.manage → appraisals.view + appraisals.add + appraisals.edit + appraisals.delete
INSERT INTO role_permissions (role_id, permission, scope)
SELECT rp.role_id, new_perm, rp.scope
FROM role_permissions rp
CROSS JOIN (VALUES ('appraisals.view'), ('appraisals.add'), ('appraisals.edit'), ('appraisals.delete')) AS t(new_perm)
WHERE rp.permission = 'appraisals.manage'
ON CONFLICT DO NOTHING;

-- rotas.edit → rotas.view + rotas.add + rotas.edit + rotas.delete
INSERT INTO role_permissions (role_id, permission, scope)
SELECT rp.role_id, new_perm, rp.scope
FROM role_permissions rp
CROSS JOIN (VALUES ('rotas.view'), ('rotas.add'), ('rotas.edit'), ('rotas.delete')) AS t(new_perm)
WHERE rp.permission = 'rotas.edit'
ON CONFLICT DO NOTHING;

-- leave.approve stays as-is (already granular), but also grant leave.view
INSERT INTO role_permissions (role_id, permission, scope)
SELECT rp.role_id, 'leave.view', rp.scope
FROM role_permissions rp
WHERE rp.permission = 'leave.approve'
ON CONFLICT DO NOTHING;

-- leave.manage_entitlements stays as-is, but also grant leave.view
INSERT INTO role_permissions (role_id, permission, scope)
SELECT rp.role_id, 'leave.view', rp.scope
FROM role_permissions rp
WHERE rp.permission = 'leave.manage_entitlements'
ON CONFLICT DO NOTHING;

-- Step 4: Remove old coarse permission keys (they've been expanded above)
DELETE FROM role_permissions WHERE permission IN (
    'employees.manage',
    'training_courses.manage',
    'supervisions.create',
    'supervisions.manage',
    'onboarding.manage',
    'appraisals.manage'
);
-- Note: rotas.edit, training_records.record, leave.approve, leave.manage_entitlements
-- are kept because the new system uses the same key names

-- Step 5: Seed system roles with correct granular permissions
-- First, ensure all 40 permissions exist for Administrator
DO $$
DECLARE
    admin_role_id UUID;
    perm TEXT;
    all_perms TEXT[] := ARRAY[
        'employees.view', 'employees.add', 'employees.edit', 'employees.delete',
        'training_courses.view', 'training_courses.add', 'training_courses.edit', 'training_courses.delete',
        'training_matrix.view', 'training_records.record',
        'supervisions.view', 'supervisions.add', 'supervisions.edit', 'supervisions.delete',
        'leave.view', 'leave.approve', 'leave.manage_entitlements',
        'rotas.view', 'rotas.add', 'rotas.edit', 'rotas.delete',
        'appraisals.view', 'appraisals.add', 'appraisals.edit', 'appraisals.delete',
        'onboarding.view', 'onboarding.add', 'onboarding.edit', 'onboarding.delete',
        'settings.manage', 'notifications.manage', 'audit_log.view', 'users.manage', 'employee_statuses.manage'
    ];
BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'Administrator' AND is_system = true;
    IF admin_role_id IS NOT NULL THEN
        -- Clear and re-seed admin permissions
        DELETE FROM role_permissions WHERE role_id = admin_role_id;
        FOREACH perm IN ARRAY all_perms
        LOOP
            INSERT INTO role_permissions (role_id, permission, scope)
            VALUES (admin_role_id, perm, 'all')
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- Manager: clear and re-seed
DO $$
DECLARE
    manager_role_id UUID;
BEGIN
    SELECT id INTO manager_role_id FROM roles WHERE name = 'Manager' AND is_system = true;
    IF manager_role_id IS NOT NULL THEN
        DELETE FROM role_permissions WHERE role_id = manager_role_id;
        INSERT INTO role_permissions (role_id, permission, scope) VALUES
            (manager_role_id, 'employees.view', 'reports'),
            (manager_role_id, 'training_matrix.view', 'reports'),
            (manager_role_id, 'training_courses.view', 'reports'),
            (manager_role_id, 'training_records.record', 'reports'),
            (manager_role_id, 'supervisions.view', 'reports'),
            (manager_role_id, 'supervisions.add', 'reports'),
            (manager_role_id, 'leave.view', 'reports'),
            (manager_role_id, 'leave.approve', 'reports'),
            (manager_role_id, 'rotas.view', 'reports'),
            (manager_role_id, 'appraisals.view', 'reports'),
            (manager_role_id, 'onboarding.view', 'reports')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Staff: clear and re-seed
DO $$
DECLARE
    staff_role_id UUID;
BEGIN
    SELECT id INTO staff_role_id FROM roles WHERE name = 'Staff' AND is_system = true;
    IF staff_role_id IS NOT NULL THEN
        DELETE FROM role_permissions WHERE role_id = staff_role_id;
        INSERT INTO role_permissions (role_id, permission, scope) VALUES
            (staff_role_id, 'employees.view', 'own'),
            (staff_role_id, 'rotas.view', 'own'),
            (staff_role_id, 'leave.view', 'own')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Step 6: Drop data_scope column from roles table (no longer needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'roles' AND column_name = 'data_scope'
    ) THEN
        ALTER TABLE roles DROP COLUMN data_scope;
    END IF;
END $$;
