# Appraisal System Rework

## Status: Complete

## Summary
Replaced fixed 12-milestone grid with frequency-based review model and DataGrid matrix view.

## What Changed

### Database
- `appraisal_frequency_months` added to employees (default 3)
- `review_number` (integer) replaces `milestone_type` (enum string)
- `appraisal_reviews_back` / `appraisal_reviews_forward` added to company_settings (default 2 each)

### Backend
- Employee model/DTOs/service updated with `AppraisalFrequencyMonths`
- AppraisalService reworked: builds matrix of last N completed + next N pending reviews per employee
- Reviews back/forward configurable via company settings
- Controller reads settings and passes to service

### Frontend
- DataGrid matrix view (consistent with supervision matrix) replaces old 12-column grid
- Dynamic columns based on data (reviews back/forward from settings)
- Colour-coded cells: emerald=completed, amber=due soon, rose=overdue, gray=not yet due
- Click cell to mark complete via modal
- Company settings page has Appraisal Grid section with Reviews Back/Forward inputs
- Employee profile appraisals tab stubbed (future: combined timeline with supervisions)

## Files Modified

### Backend
1. `EmployeeHub.Api/Models/Employee.cs`
2. `EmployeeHub.Api/Models/CompanySettings.cs`
3. `EmployeeHub.Api/DTOs/EmployeeDtos.cs`
4. `EmployeeHub.Api/DTOs/AppraisalDtos.cs`
5. `EmployeeHub.Api/Services/EmployeeService.cs`
6. `EmployeeHub.Api/Services/IAppraisalService.cs`
7. `EmployeeHub.Api/Services/AppraisalService.cs`
8. `EmployeeHub.Api/Services/CompanySettingsService.cs`
9. `EmployeeHub.Api/Controllers/AppraisalsController.cs`

### Frontend
10. `employee-hub-ui/src/lib/types.ts`
11. `employee-hub-ui/src/pages/appraisals.tsx`
12. `employee-hub-ui/src/pages/settings.tsx`
13. `employee-hub-ui/src/components/appraisals/appraisals-grid.tsx` (new)
14. `employee-hub-ui/src/components/appraisals/mark-complete-modal.tsx`
15. `employee-hub-ui/src/components/appraisals/employee-appraisals-tab.tsx`

### Deleted
- `appraisals-matrix.tsx` (old 12-column grid)
- `appraisals-status-table.tsx` (intermediate status table)

## Migration
Run `migration.sql` in Supabase SQL Editor. Safe to re-run (uses IF NOT EXISTS / IF NULL checks).
