# Supervision Matrix Enhancements - Design & Plan

**Date:** 2026-02-05
**Status:** COMPLETE
**Completed:** 2026-02-05

> Appraisals moved to separate work directory: `work/appraisals/`

## Overview

Enhancements to the supervision matrix feature with calendar heatmap, exceptions, and employee profile integration.

## Features

### 1. Calendar Heatmap - Click to Add Supervision

**Behaviour:**
- Left-click any cell opens Record Supervision modal
- Date defaults to 1st of that clicked month (e.g., click Jun 2025 → 01/06/2025)
- User can adjust date in the modal before saving

**Changes:**
- Update `calendar-heatmap-view.tsx` to pass clicked month to modal
- Update `record-supervision-modal.tsx` to accept and use pre-selected date

### 2. Calendar Heatmap - Right-Click Exceptions

**Behaviour:**
- Right-click cell shows context menu:
  - "Record Supervision" (same as left-click)
  - "Mark as Not Required"
  - "Mark as Annual Leave"
  - "Mark as Sick Leave"
- Exceptions exclude that month from status calculations
- Cell shows visual indicator (grey with "AL", "S", "NR")

**Database:**
```sql
CREATE TABLE supervision_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM' format
  exception_type TEXT NOT NULL CHECK (exception_type IN ('not_required', 'annual_leave', 'sick_leave')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, period)
);
```

**Backend:**
- New `SupervisionExceptionService` with CRUD operations
- New `SupervisionExceptionsController` with endpoints:
  - `GET /api/supervision-exceptions?employeeId=&period=`
  - `POST /api/supervision-exceptions`
  - `DELETE /api/supervision-exceptions/:id`

**Frontend:**
- Context menu component on cell right-click
- Update `getCellColor()` to check exceptions
- Update tooltip to show exception type

### 3. Page Layout (Simplified)

**Original plan:** Tabs with Employee Cards and Calendar View

**Final implementation:** Calendar heatmap only - the cards view was redundant.

**Layout:**
- Legend row on left, filter dropdowns on right
- Month navigation buttons (Earlier / Today / Later)
- Calendar heatmap showing all employees

**Removed:** Employee Cards tab and component (employee-cards-view.tsx deleted)

### 4. Employee Profile - Supervision Tab

**New tab** on employee profile page with single-row heatmap + filtered list.

**Layout:**
- Single-row heatmap (identical styling to main matrix)
- Click cell to select month and filter list below
- Month header shows "X of Y required"
- Record + Settings buttons

**List shows for selected month:**
- Supervisions with date, conducted by, status (Completed/Planned), notes
- Exceptions with type label

**Components:**
- `supervision-timeline.tsx` - the tab content
- `supervision-settings-modal.tsx` - manage requirements per employee

---

## Implementation Order

### Phase 1: Database & Backend
- [x] Create `supervision_exceptions` table + migration
- [x] Create `SupervisionExceptionService` + Controller
- [x] Create `supervision_requirements` table for effective-dated requirements
- [x] Create `SupervisionRequirementService` + Controller

### Phase 2: Calendar Heatmap Enhancements
- [x] Click cell to add supervision with correct date
- [x] Right-click context menu for exceptions (Not Required, Annual Leave, Sick Leave)
- [x] Update cell colors/tooltips for exceptions
- [x] Premium styling (emerald/amber/rose colors, hover effects, transitions)
- [x] Employee name clickable → navigates to supervision tab
- [x] Row hover highlighting with group-hover
- [x] Future months show planned/required count (e.g., "2/3")

### Phase 3: Page Layout → SIMPLIFIED
- [x] Refactor supervision-matrix.tsx layout (legend + filters, no tabs)
- [x] Removed Employee Cards tab - heatmap covers everything
- [x] Month navigation (Earlier/Later by 1 month)

### Phase 4: Employee Profile - Supervision Tab
- [x] Create Supervision tab with single-row heatmap + filtered list
- [x] Click cell to filter list to that month
- [x] Supervision settings modal for managing requirements per employee
- [x] Same styling as main matrix (identical cell colors/hover effects)

---

## Testing Checklist

### Backend
- [x] GET /api/supervision-exceptions returns array
- [x] POST /api/supervision-exceptions creates exception
- [x] DELETE /api/supervision-exceptions/:id removes exception
- [x] GET /api/supervision-requirements returns array
- [x] POST /api/supervision-requirements creates requirement

### Calendar Heatmap
- [x] Click cell opens modal with date = 1st of that month
- [x] Right-click cell shows context menu
- [x] "Mark as Annual Leave" creates exception, cell turns teal with "AL"
- [x] "Mark as Not Required" creates exception, cell turns grey
- [x] "Mark as Sick Leave" creates exception, cell turns violet with "S"
- [x] "Remove Exception" deletes and cell returns to normal color
- [x] Tooltip shows exception details (type, notes, who set it)
- [x] Employee name clickable → navigates to supervision tab

### Page Layout
- [x] Legend on left, filters on right
- [x] Month navigation works (Earlier/Today/Later)
- [x] Filters work (Status, Role, Employee Status)

### Employee Profile - Supervision Tab
- [x] Supervision tab appears on employee profile
- [x] Single-row heatmap matches main matrix styling
- [x] Click cell filters list to that month
- [x] Settings button opens requirements modal
- [x] Can record supervision from tab

---

## Future Integration Notes

- **Rotas feature:** When built, consider pulling leave data automatically from rotas instead of manual AL/Sick entry in supervision exceptions
- **Notifications:** Could add reminders for upcoming supervisions
