# Role-Based Permission System

**Status:** COMPLETE

## What Was Built

### Architecture
- 34 granular permission keys across 8 feature groups + 5 admin permissions
- Per-permission scope: each permission carries its own scope (own/reports/all)
- JWT format: `Perm:employees.view` = `"all"` (one claim per permission, value = scope)
- No global DataScope — scope is per-permission

### System Roles
- **Administrator**: All 34 permissions at scope "all"
- **Manager**: 11 permissions at scope "reports"
- **Staff**: 3 permissions at scope "own" (employees.view, rotas.view, leave.view)

### Backend
- `HasPermission(key)` / `GetPermissionScope(key)` — ClaimsPrincipal extensions
- Controllers use granular keys: `.view`/`.add`/`.edit`/`.delete`
- `RoleService` + `RolesController` — CRUD for custom roles with permission assignment
- `UserManagementService` + `UsersController` — user management with role assignment

### Frontend
- `hasPermission(key)` / `getPermissionScope(key)` / `canManageEmployee(id, permission)`
- `/roles` page — role management with per-permission scope dropdowns
- `/users` page — user management with role assignment
- Sidebar gated by permissions — items only show if user has the relevant key

### Database
- `roles` table with `is_system` flag
- `role_permissions` table — (role_id, permission, scope)
- Migrations: `migration.sql` + `migration-granular.sql`
- Seed: `seed.sql`
