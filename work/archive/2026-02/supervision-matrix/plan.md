# Supervision Matrix Implementation Plan

**Status:** PLANNING
**Date:** 2026-02-04

## Overview
Employee supervision tracking system with reporting structure and calendar-based compliance monitoring.

## Database Schema

### 1. Add to `employees` table
```sql
ALTER TABLE employees ADD COLUMN reports_to UUID REFERENCES employees(id);
ALTER TABLE employees ADD COLUMN supervision_frequency INTEGER DEFAULT 2; -- 1 or 2 per period
```

### 2. Create `supervision_records` table
```sql
CREATE TABLE supervision_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  conducted_by_id UUID NOT NULL REFERENCES employees(id),
  supervision_date DATE NOT NULL,
  period TEXT NOT NULL, -- 'YYYY-MM' format
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supervision_records_employee ON supervision_records(employee_id);
CREATE INDEX idx_supervision_records_conductor ON supervision_records(conducted_by_id);
CREATE INDEX idx_supervision_records_period ON supervision_records(period);
```

## API Endpoints

### Employees (extend existing)
- `PUT /api/employees/{id}` - add `reports_to` and `supervision_frequency` to update DTO

### Supervisions (new controller)
- `GET /api/supervisions` - list all supervisions (filterable by employee, supervisor, period)
- `GET /api/supervisions/employee/{employeeId}` - get all supervisions for an employee
- `GET /api/supervisions/supervisor/{supervisorId}` - get all supervisions conducted by supervisor
- `GET /api/supervisions/summary` - get supervision status summary for all employees
- `POST /api/supervisions` - record a new supervision
- `PUT /api/supervisions/{id}` - update supervision
- `DELETE /api/supervisions/{id}` - delete supervision

## Frontend Components

### Page: `/supervision-matrix`
Tabbed interface (similar to training matrix):

**Tab 1: Employee Cards**
- Card-based view per employee
- Shows reporting structure, last supervision, status
- Quick "Record Supervision" action
- Filter by status, supervisor, role

**Tab 2: Calendar Heatmap**
- Monthly grid view (employees × months)
- Heatmap showing: completed (green), scheduled (yellow), due (white), overdue (red)
- Click cell to view/add supervision
- Toggle grouping: by employee / by supervisor / by role

### Components to Create
- `SupervisionMatrixPage.tsx` - main page with tabs
- `EmployeeCardsView.tsx` - card view implementation
- `CalendarHeatmapView.tsx` - calendar grid implementation
- `RecordSupervisionModal.tsx` - modal for recording/editing supervisions
- `SupervisionCard.tsx` - individual employee card
- `SupervisionCell.tsx` - calendar cell component

## Data Flow

### Recording a Supervision
1. User clicks "Record Supervision" on employee card or calendar cell
2. Modal opens with:
   - Employee (pre-filled or selected)
   - Conducted by (defaults to employee.reports_to, can change)
   - Date
   - Notes
3. POST to `/api/supervisions`
4. Invalidate queries, refresh views

### Status Calculation
- For each employee:
  - Get last supervision date
  - Calculate days since
  - Expected frequency (from employee.supervision_frequency)
  - Status: OK / Due Soon / Overdue based on frequency

## Implementation Steps

1. **Database Migration**
   - Create migration SQL file
   - Run in Supabase

2. **Backend API**
   - Create SupervisionService
   - Create SupervisionsController
   - Add DTOs
   - Update EmployeeService to handle reports_to

3. **Frontend Types**
   - Add Supervision types to types.ts
   - Update Employee type with reports_to, supervision_frequency

4. **Frontend Components**
   - Build RecordSupervisionModal
   - Build EmployeeCardsView
   - Build CalendarHeatmapView
   - Build main SupervisionMatrixPage with tabs

5. **Testing**
   - Test recording supervisions
   - Test status calculations
   - Test both views
   - Test filters

## Open Questions
- Period definition: monthly? quarterly? configurable?
- Notification/reminder system for overdue supervisions?
- Export to Excel functionality?
- Historical reporting/analytics?

