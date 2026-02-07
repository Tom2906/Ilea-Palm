-- =============================================================================
-- Seed Roles & Users
-- Run AFTER migration.sql and migration-granular.sql
-- Safe to re-run: uses ON CONFLICT DO NOTHING
-- =============================================================================

-- Ensure pgcrypto is available (Supabase has this by default)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Seed admin user (admin@ileapalm.co.uk / Admin123!)
INSERT INTO users (email, password_hash, display_name, role_id)
SELECT
    'admin@ileapalm.co.uk',
    crypt('Admin123!', gen_salt('bf')),
    'Admin',
    r.id
FROM roles r
WHERE r.name = 'Administrator'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@ileapalm.co.uk')
;

-- 2. Seed manager user (manager@ileapalm.co.uk / Admin123!)
INSERT INTO users (email, password_hash, display_name, role_id)
SELECT
    'manager@ileapalm.co.uk',
    crypt('Admin123!', gen_salt('bf')),
    'Manager',
    r.id
FROM roles r
WHERE r.name = 'Manager'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager@ileapalm.co.uk')
;

-- 3. Seed staff user (staff@ileapalm.co.uk / Admin123!)
INSERT INTO users (email, password_hash, display_name, role_id)
SELECT
    'staff@ileapalm.co.uk',
    crypt('Admin123!', gen_salt('bf')),
    'Staff',
    r.id
FROM roles r
WHERE r.name = 'Staff'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'staff@ileapalm.co.uk')
;
