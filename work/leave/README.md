# Annual Leave & Manager Permissions

## Status: Code Complete — Awaiting Migration & Testing

## What Was Built

### 1. 3-Tier Permission System
Expanded roles from `admin`/`user` to `admin`/`manager`/`user`.

| Capability | User | Manager | Admin |
|---|---|---|---|
| View own profile/training/rota | Yes | Yes | Yes |
| View other people's records | No | Direct reports | All |
| Request leave | Own | Own | Anyone |
| Approve/reject leave | No | Direct reports | Anyone |
| Record supervision | No | Direct reports | Anyone |
| Edit rotas / system settings | No | No | Yes |

A "manager" is any user whose linked employee has direct reports via `reports_to`.

### 2. Annual Leave
- **Request workflow:** Employee submits → Manager/Admin approves or rejects
- **Balance tracking:** Entitlement + carried over - approved = remaining
- **Rota overlay:** Approved leave days shown as green diagonal stripes on the rota grid
- **Employee profile:** New "Leave" tab with balance card and request history

### 3. Leave Page (`/leave`)
- Filter tabs: Pending / Approved / All
- Approve/Reject buttons for managers and admins
- Cancel button for employees on their own approved requests
- "Request Leave" modal with auto-calculated working days

---

## To Run: Database Migration

Run `work/leave/migration.sql` against the Supabase database. Safe to re-run.

**What it does:**
1. Expands the `users.role` constraint to allow `'manager'`
2. Creates `leave_entitlements` table (per employee per year)
3. Creates `leave_requests` table with indexes
4. Adds `default_leave_entitlement_days` column to `company_settings`

---

## To Test

### Backend
1. **Migration:** After running SQL, verify `users` constraint allows 'manager' and leave tables exist
2. **Manager role:** Set a test user to `role='manager'` in DB, ensure their `employee_id` points to an employee who has direct reports (`reports_to`)
3. **JWT:** Log in as that manager → decode the JWT → verify `EmployeeId` claim is present
4. **Auth /me:** `GET /api/auth/me` as manager → `directReportIds` should be populated
5. **Entitlements:** `POST /api/leave/entitlements` as admin → entitlement row created
6. **Leave request:** `POST /api/leave/requests` as any user → pending request created
7. **Approve:** `PUT /api/leave/requests/{id}/status` as manager for a report → status changes to approved
8. **Balance:** `GET /api/leave/balance/{empId}/2026` → correct calculation
9. **Rota overlay:** `GET /api/rota?year=2026&month=4` → `leaveDates` populated on relevant employees
10. **Supervision:** `POST /api/supervisions` as manager for a direct report → should succeed (previously admin-only)

### Frontend
11. **Login page:** Unchanged — still works with email/password
12. **Sidebar:** "Leave" nav item visible to all users
13. **Leave page (`/leave`):** Shows requests, filter tabs work, approve/reject buttons appear for managers/admins only
14. **Leave request modal:** Auto-calculates weekdays between dates, allows admin to select any employee
15. **Rota grid:** Green diagonal stripes on approved leave days, "AL" summary column, "AL - Annual Leave" in legend
16. **Employee detail:** New "Leave" tab shows balance card + request list + "Request Leave" button
17. **Permission enforcement:** Regular users cannot see approve buttons, cannot access settings

---

## New Files (12)

| File | Purpose |
|---|---|
| `work/leave/migration.sql` | Database migration |
| `EmployeeHub.Api/Models/LeaveEntitlement.cs` | Entitlement model |
| `EmployeeHub.Api/Models/LeaveRequest.cs` | Leave request model |
| `EmployeeHub.Api/DTOs/LeaveDtos.cs` | All leave DTOs |
| `EmployeeHub.Api/Services/ILeaveService.cs` | Service interface |
| `EmployeeHub.Api/Services/LeaveService.cs` | Service implementation |
| `EmployeeHub.Api/Controllers/LeaveController.cs` | API controller |
| `employee-hub-ui/src/pages/leave.tsx` | Leave management page |
| `employee-hub-ui/src/components/leave/leave-request-modal.tsx` | Request dialog |
| `employee-hub-ui/src/components/leave/leave-balance-card.tsx` | Balance display |
| `employee-hub-ui/src/components/leave/leave-status-badge.tsx` | Status badge |
| `employee-hub-ui/src/components/leave/employee-leave-tab.tsx` | Employee detail tab |

## Modified Files (14)

| File | Change |
|---|---|
| `EmployeeHub.Api/Middleware/JwtAuthMiddleware.cs` | Added `IsManager()`, `IsAdminOrManager()`, `GetEmployeeId()` |
| `EmployeeHub.Api/Services/AuthService.cs` | Added `EmployeeId` JWT claim |
| `EmployeeHub.Api/DTOs/AuthDtos.cs` | Added `DirectReportIds` to `UserInfo` |
| `EmployeeHub.Api/Controllers/AuthController.cs` | `/me` returns `directReportIds` for managers |
| `EmployeeHub.Api/Controllers/SupervisionsController.cs` | Managers can create supervisions for reports |
| `EmployeeHub.Api/DTOs/RotaDtos.cs` | Added `LeaveDates`, `AnnualLeaveDays` |
| `EmployeeHub.Api/Services/RotaService.cs` | Queries approved leave in `GetMonthAsync()` |
| `EmployeeHub.Api/Program.cs` | Registered `ILeaveService` |
| `employee-hub-ui/src/lib/types.ts` | Leave types, expanded `UserInfo.role`, `RotaEmployee.leaveDates` |
| `employee-hub-ui/src/contexts/auth-context.tsx` | `isManager`, `isAdminOrManager`, `canManageEmployee()` |
| `employee-hub-ui/src/pages/rotas.tsx` | Leave overlay, AL legend, AL summary column |
| `employee-hub-ui/src/pages/employee-detail.tsx` | Added Leave tab |
| `employee-hub-ui/src/App.tsx` | Added `/leave` route |
| `employee-hub-ui/src/components/app-sidebar.tsx` | Added Leave nav item |
| `employee-hub-ui/src/index.css` | `.leave-overlay` CSS |

## Build Status
- Backend: `dotnet build` — 0 errors, 0 warnings
- Frontend: `tsc --noEmit` — 0 errors
