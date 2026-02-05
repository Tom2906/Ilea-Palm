# Appraisals Feature

**Status:** Not Started - Needs Review
**Created:** 2026-02-05
**Source:** Extracted from supervision-matrix/plan-v2.md

## Overview

Appraisals tracking for employee milestones (probation reviews, annual appraisals, etc.)

## What Exists (needs review)

- `appraisal_milestones` table may exist (check database)
- `AppraisalService` + `AppraisalsController` may exist (check backend)
- `appraisals.tsx` page may exist (check frontend)
- `employee-appraisals-tab.tsx` component may exist

## Requirements

### Appraisals Page

**Layout (matching training matrix):**
- Header: Legend on left, filters on right
- Matrix grid:
  - Rows: Employees
  - Columns: Milestone stages (3mo, 6mo Probation, 9mo, 12mo, Year 2 stages, Year 3 stages)
  - Cells: Due/completion date, color-coded

**Cell statuses:**
- Completed - Green, shows completion date
- Due Soon - Amber, shows due date
- Overdue - Red, shows due date
- Not Yet Due - Grey, shows future date
- N/A - Empty (not applicable for this employee)

**Click cell:** Opens modal to mark complete or edit

### Employee Profile - Appraisals Tab

**Display:**
- Checklist/timeline of milestones
- Which are complete (with date), which are upcoming
- "Mark Complete" action for upcoming items

### Database Schema (reference)

```sql
CREATE TABLE appraisal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN (
    '3_month', '6_month_probation', '9_month', '12_month',
    'year2_3month', 'year2_6month', 'year2_9month', 'year2_annual',
    'year3_3month', 'year3_6month', 'year3_9month', 'year3_appraisal'
  )),
  due_date DATE NOT NULL,
  completed_date DATE,
  conducted_by_id UUID REFERENCES employees(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, milestone_type)
);
```

## Tasks

- [ ] Verify database table exists and schema is correct
- [ ] Review AppraisalService + Controller endpoints
- [ ] Review appraisals.tsx page - does it work?
- [ ] Review employee-appraisals-tab.tsx - does it work?
- [ ] Test full flow: view matrix, click cell, mark complete
- [ ] Apply premium styling to match supervision matrix
