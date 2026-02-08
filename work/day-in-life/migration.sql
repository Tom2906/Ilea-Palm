-- Day in the Life Generator: add permission key
-- Safe to re-run (ON CONFLICT DO NOTHING)

-- Grant day_in_life.use to the Administrator role
INSERT INTO role_permissions (role_id, permission, scope)
SELECT r.id, 'day_in_life.use', 'all'
FROM roles r
WHERE r.name = 'Administrator'
ON CONFLICT DO NOTHING;
