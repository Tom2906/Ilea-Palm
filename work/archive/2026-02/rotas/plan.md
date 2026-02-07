# Rota System - Implementation Plan

**Status:** NOT STARTED - Ready to build

**Depends On:** `work/data-grid/` - Generic grid component (complete)

## Goal
Recreate the Excel rota functionality as a DB-backed feature in EmployeeHub, then layer improvements on top.

---

## Phase 1: Data Model

### New Tables

```sql
-- Shift types (configurable - A, D, DS, etc.)
CREATE TABLE ShiftTypes (
    Id INT PRIMARY KEY IDENTITY,
    Code NVARCHAR(10) NOT NULL,       -- 'A', 'D', 'DS', etc.
    Name NVARCHAR(50) NOT NULL,       -- 'Awake', 'Day', 'Day + Sleep'
    DefaultHours DECIMAL(4,1),        -- 7.5, 15, etc.
    IncludesSleep BIT DEFAULT 0,      -- Does this shift type include a paid sleep-in?
    DisplayColor NVARCHAR(7),         -- Optional hex color for UI
    SortOrder INT DEFAULT 0,          -- For dropdown ordering
    IsActive BIT DEFAULT 1            -- Soft delete
);

-- Individual shift assignments
CREATE TABLE Shifts (
    Id INT PRIMARY KEY IDENTITY,
    EmployeeId INT NOT NULL REFERENCES Employees(Id),
    Date DATE NOT NULL,
    ShiftTypeId INT REFERENCES ShiftTypes(Id),
    Hours DECIMAL(4,1),               -- Actual hours (can override default)
    Notes NVARCHAR(255),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2,

    UNIQUE(EmployeeId, Date)          -- One shift per person per day
);

-- Contract hours per employee (for over/under calculation)
-- Add to existing Employee table:
ALTER TABLE Employees ADD
    ContractedHoursPerWeek DECIMAL(4,1),
    RotaEligible BIT DEFAULT 1;
```

### Seed Data - Shift Types
| Code | Name | Default Hours | Includes Sleep |
|------|------|---------------|----------------|
| A | Awake | 7.5 | No |
| D | Day | 15 | No |
| DS | Day + Sleep | 15 | Yes |

### Calculations
- **Total Hours**: Sum of `Hours` for employee in month
- **Total Sleeps**: Count of shifts where `ShiftType.IncludesSleep = 1`
- **Over/Under**: `TotalHours - (ContractedHoursPerWeek × WeeksInMonth)`
- Sleeps tracked for pay purposes but no target comparison

---

## Phase 2: API Endpoints

```
GET    /api/rota?month=4&year=2026     -- Get month grid data
POST   /api/rota/shifts                 -- Create/update shift
DELETE /api/rota/shifts/{id}            -- Remove shift

GET    /api/rota/summary?month=4&year=2026  -- Hours totals, over/under
```

### Response Shape for Grid
```json
{
  "month": 4,
  "year": 2026,
  "daysInMonth": 30,
  "staff": [
    {
      "employeeId": 1,
      "name": "Ellen Middleton",
      "role": "RM",
      "contractedHoursPerWeek": 37.5,
      "shifts": {
        "2026-04-01": { "id": 1, "typeCode": "A", "hours": 7.5, "includesSleep": false },
        "2026-04-02": { "id": 2, "typeCode": "A", "hours": 7.5, "includesSleep": false },
        ...
      },
      "summary": {
        "totalHours": 165,
        "totalSleeps": 0,
        "targetHours": 160,
        "overUnder": 5
      }
    }
  ],
  "shiftTypes": [
    { "id": 1, "code": "A", "name": "Awake", "defaultHours": 7.5, "includesSleep": false },
    { "id": 2, "code": "D", "name": "Day", "defaultHours": 15, "includesSleep": false },
    { "id": 3, "code": "DS", "name": "Day + Sleep", "defaultHours": 15, "includesSleep": true }
  ]
}
```

---

## Phase 3: UI Components

### Reuse Existing Pattern
Base on `CalendarHeatmapView` component (supervision matrix) - same architecture:
- Sticky left column (employee names)
- Scrollable grid of cells
- Tooltips on hover
- Click to open modal
- Color coding per cell state

### Grid Layout
```
| Staff        | M  | T  | W  | T  | F  | S  | S  | ... | Hours | Sleeps | +/- |
|--------------|----|----|----|----|----|----|----| ... |-------|--------|-----|
| Ellen M.     | A  | A  | A  | A  | A  | -  | -  |     | 165   | 0      | +5  |
| (RM)         |7.5 |7.5 |7.5 |7.5 |7.5 |    |    |     |       |        |     |
```

### Components to Build
1. **RotaPage** - Month/year selector + filters + grid
2. **RotaGrid** - Adapted from CalendarHeatmapView
   - Columns = days of month (1-31) with day-of-week headers (M/T/W...)
   - Cells = shift code with color per shift type
   - Summary columns: Total Hours, Total Sleeps, Over/Under
3. **RotaCell** - Shows shift code, colored by type, tooltip with hours
4. **ShiftEditorModal** - Dropdown to pick shift type, optional hours override
5. **FilterDropdown** - Reuse existing component for role/status filters

### Cell Display (single row per staff)
- Show shift code (A, D, DS) in cell
- Tooltip on hover shows: shift name, hours, sleep indicator
- Color per shift type (configurable via ShiftTypes.DisplayColor)
- Empty cell = no shift
- Weekend columns slightly shaded

### Cell Click Flow
1. Click cell → ShiftEditorModal opens
2. Dropdown: None / A / D / DS / (other configured types)
3. Hours field (pre-filled with default, editable)
4. Save → optimistic update, API call
5. Cell updates with new shift code + color

---

## Phase 4: Nice-to-haves (post-v1)
- [ ] Copy previous week/month
- [ ] Highlight weekends / bank holidays
- [ ] Day-of-week headers (M, T, W...)
- [ ] Colour coding by shift type (uses ShiftTypes.DisplayColor)
- [ ] Print view
- [ ] Export to Excel
- [ ] Annual Leave tracking
- [ ] Quarterly hours rollup
- [ ] ShiftTypes admin page (add/edit shift types)
- [ ] Multi-home selector (if needed later)

---

## Questions Before Starting

1. ~~**ASI meaning**~~ - ANSWERED: Tracks hours + sleeps for pay, no target for sleeps
2. ~~**UI layout**~~ - ANSWERED: Single row, shift code shown, hours on hover/tooltip
3. ~~**Staff filtering**~~ - ANSWERED: Use filter flags (reuse FilterDropdown component)
4. ~~**Home**~~ - ANSWERED: Single home for v1
5. ~~**Reuse matrix**~~ - ANSWERED: Adapt CalendarHeatmapView pattern

**All questions answered - ready to build.**

---

## Estimated Complexity

| Component | Lines of Code | Difficulty | Notes |
|-----------|---------------|------------|-------|
| DB migrations | ~50 | Simple | ShiftTypes + Shifts tables |
| API endpoints | ~150-200 | Simple | CRUD + monthly summary |
| RotaGrid component | ~250-350 | Simple | Adapt CalendarHeatmapView pattern |
| ShiftEditorModal | ~80-100 | Simple | Dropdown + hours input |
| Filters + page | ~100 | Simple | Reuse FilterDropdown |
| **Total** | **~550-750** | **Manageable** | Faster due to pattern reuse |

Junior-friendly: Yes - follows existing patterns, no new concepts.

---

## Next Steps
1. ~~Answer questions~~ - Done
2. **Approve plan** ← You are here
3. DB schema + seed shift types + Employee columns
4. API endpoints (RotaController, ShiftService)
5. UI: RotaPage + RotaGrid (adapt heatmap pattern) + ShiftEditorModal
