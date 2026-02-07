# Appraisals

**Status:** COMPLETE

## What Was Built

### Backend
- `AppraisalService` + `AppraisalsController` — CRUD for appraisal milestones
- Permission-gated: `appraisals.view`, `appraisals.add`, `appraisals.edit`, `appraisals.delete`
- Auto-generates milestone due dates based on employee start date

### Frontend
- `/appraisals` management page — matrix grid with employees as rows, milestone stages as columns
- Cells colour-coded: green (completed), amber (due soon), red (overdue), grey (not yet due)
- Click cell to mark complete or edit
- `EmployeeAppraisalsTab` — checklist/timeline on employee profile
- `/my-reviews` personal page — two tabs (Supervisions + Appraisals) for self-service viewing

### Milestone Types
- 3 Month, 6 Month Probation, 9 Month, 12 Month
- Year 2: 3 Month, 6 Month, 9 Month, Annual
- Year 3: 3 Month, 6 Month, 9 Month, Appraisal

### Database
- `appraisal_milestones` table with unique constraint on (employee_id, milestone_type)
