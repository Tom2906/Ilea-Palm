# Annual Leave

**Status:** COMPLETE

## What Was Built

### Backend
- `LeaveService` + `LeaveController` — request/approve/reject workflow, balance tracking, entitlement management
- Self-service: users can view own leave balance and submit requests without `leave.view` permission
- Leave approval gated by `leave.approve` permission
- Entitlement management gated by `leave.manage_entitlements` permission
- Rota integration: approved leave dates returned in rota API response

### Frontend
- `/leave` management page — filter tabs (Pending/Approved/All), approve/reject buttons
- `/my-leave` personal page — wraps EmployeeLeaveTab for own employeeId
- `EmployeeLeaveTab` — balance card + request history + request button
- `LeaveRequestModal` — date picker with auto-calculated working days
- `LeaveBalanceCard` — entitlement, used, remaining display
- `LeaveStatusBadge` — colour-coded status badges
- Employee detail Leave tab — managers can view employee leave from profile

### Database
- `leave_entitlements` table — per employee per year
- `leave_requests` table — with status workflow (pending/approved/rejected/cancelled)
- `default_leave_entitlement_days` in company_settings
- Migration: `migration.sql`
