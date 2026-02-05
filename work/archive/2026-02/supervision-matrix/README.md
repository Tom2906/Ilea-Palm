# Supervision Matrix

**Status:** IN PROGRESS

## Source Data
- `Supervision Matrix Updated 08.12.25.xlsx` - Copied to this directory
- `supervision-data.json` - Extracted supervision records and reporting relationships

## What Was Built

### Database (Supabase)
- Extended `employees` table with:
  - `reports_to` (UUID) - Reference to supervisor
  - `supervision_frequency` (1 or 2) - Required supervisions per period
- New `supervision_records` table:
  - `employee_id`, `conducted_by_id`, `supervision_date`, `period`, `notes`
  - RLS policies for service role access
- `supervision_status` view - Calculates status per employee (Never, OK, Due Soon, Overdue)

### Backend API (C# .NET)
- `SupervisionService` - Full CRUD + status queries
- `SupervisionsController` - REST endpoints:
  - `GET /api/supervisions` - List all (with filters)
  - `GET /api/supervisions/status` - Status summary per employee
  - `GET /api/supervisions/summary` - Aggregate counts
  - `POST /api/supervisions` - Record new supervision
  - `PUT /api/supervisions/:id` - Update
  - `DELETE /api/supervisions/:id` - Delete
- DTOs: `SupervisionResponse`, `SupervisionStatusResponse`, `SupervisionSummary`

### Frontend (React + TypeScript)
- `/supervision-matrix` route with sidebar navigation
- Two views via tabs:
  1. **Employee Cards View** - Status cards with filters, summary stats, record button
  2. **Calendar Heatmap View** - 12-month grid showing supervision history

### Calendar Heatmap Features
- Color coding:
  - **Green** - Supervision requirement met for period
  - **Amber** - Partial completion
  - **Red** - Missing/overdue
  - **Grey** - Before employment, Bank staff, or future months
- Tooltips showing supervision details (date, conducted by, notes)
- Navigation buttons (Earlier/Today/Later) to scroll through months
- Shows 10 months back + 2 months forward by default
- Respects employee start dates (grey before they started)
- Bank staff automatically greyed out (no supervision required)

### Record Supervision Modal
- Select employee and date
- Auto-selects supervisor based on reports_to relationship
- Add optional notes

## Files Modified/Created

**Backend:**
- `EmployeeHub.Api/DTOs/SupervisionDtos.cs` - Created
- `EmployeeHub.Api/Models/Supervision.cs` - Created
- `EmployeeHub.Api/Services/ISupervisionService.cs` - Created
- `EmployeeHub.Api/Services/SupervisionService.cs` - Created
- `EmployeeHub.Api/Controllers/SupervisionsController.cs` - Created
- `EmployeeHub.Api/Program.cs` - Registered service
- `EmployeeHub.Api/DTOs/EmployeeDtos.cs` - Added supervision fields
- `EmployeeHub.Api/Models/Employee.cs` - Added supervision fields
- `EmployeeHub.Api/Services/EmployeeService.cs` - Updated queries

**Frontend:**
- `employee-hub-ui/src/pages/supervision-matrix.tsx` - Created
- `employee-hub-ui/src/components/supervision/employee-cards-view.tsx` - Created
- `employee-hub-ui/src/components/supervision/calendar-heatmap-view.tsx` - Created
- `employee-hub-ui/src/components/supervision/record-supervision-modal.tsx` - Created
- `employee-hub-ui/src/lib/types.ts` - Added Supervision types
- `employee-hub-ui/src/App.tsx` - Added route
- `employee-hub-ui/src/components/app-sidebar.tsx` - Added nav item

**Database:**
- `migration.sql` - Schema changes and view
- `seed-quick.sql` - Sample data (reporting relationships + test supervisions)

## Original Requirements

### Current System (Excel)
- Two sheets: "Supervisions" and "Appraisals"
- Tracks supervision sessions between staff levels:
  - Managers supervise Seniors
  - Seniors supervise RSWs (Residential Support Workers)
- Monthly tracking grid showing supervision dates
- Notation: "X2" means 2 supervisions required per period

### Supervision Structure
**Seniors supervising RSWs:**
- Phil → Sarah (x2), Sam (x2), James (x2)
- Charlotte (DM) → William (x2), Jack (x2), Sarah (x1), Michelle (x1)
- Michelle → James (x2), Jack (x2)

**Managers supervising Seniors:**
- Leila → Phil (x1), Charlotte (x1)
- Ellen → Leila (x2), Charlotte (x2), Michelle (x2), Phil (x1)

## Future Enhancements (Not Implemented)
- Appraisals tracking (second sheet from Excel)
- Cover required notifications
- Email reminders for upcoming supervisions
- Export to PDF/Excel
