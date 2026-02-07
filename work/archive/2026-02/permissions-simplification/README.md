# Permission Simplification

## Status: Complete (2026-02-07)

## Summary
Removed scope-based permissions (own/reports/all) in favour of simple on/off permissions. Added self-service access for users with linked employee records. Redesigned the Roles page with tabbed Access/Edit checkboxes.

## What Changed

### Permission Model
- Scopes removed — permissions are now on/off (scope always "all" in DB)
- 34 permission keys: .view/.add/.edit/.delete per feature + admin .manage keys
- JWT claims: `Perm:employees.view` = `"all"` (one claim per permission)
- Backend: `User.HasPermission("x")` only — no scope checks
- Frontend: `hasPermission("x")` only — `getPermissionScope`/`canManageEmployee` removed

### Self-Service
- Any user with an employeeId can view their own profile, training, rota, and leave
- Users can record their own training without training_records.record permission
- Backend GET endpoints: management permission required for full access, falls back to own employeeId

### Roles Page Redesign
- Scope dropdowns replaced with Access/Edit checkboxes
- 5 grouped tabs: Training, Reviews, Rotas, Leave, Administration
- Permission count badges on each tab
- Grant All / Revoke All buttons per tab
- Fixed-height dialog (64vh), scrollable tab row with chevron scroll indicators

### Removed
- `directReportIds` from frontend and backend
- `getPermissionScope`, `canManageEmployee` from auth context
- `IsInScope`, `IsManagerOfEmployee` from controllers
- `/my-reviews` page (deleted)

## Files Modified

### Frontend
- src/pages/roles.tsx — complete rewrite
- src/contexts/auth-context.tsx — removed scope helpers
- src/lib/types.ts — removed directReportIds
- src/components/app-sidebar.tsx — removed My Reviews, added dashboard.view
- src/App.tsx — removed /my-reviews route
- src/pages/leave.tsx, employee-leave-tab.tsx, leave-request-modal.tsx — simplified permission checks

### Backend
- All controllers — simplified to HasPermission + own employeeId fallback
- AuthController, AuthDtos — removed DirectReportIds
- RoleService — force scope to "all", added dashboard.view
- JwtAuthMiddleware — simplified claims
