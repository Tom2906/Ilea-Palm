# Rotas (Staff Scheduling)

**Status:** COMPLETE

## What Was Built

### Backend
- `RotaService` + `RotaController` — CRUD for shifts, monthly grid endpoint
- Monthly rota query returns all employees with their shifts for a given year/month
- Approved leave dates overlaid on rota response
- 7 shift types: A (Admin 7.5h), D (Day 15h), DS (Day+Sleep 15h), S (Sleep 9h), E (Early 9.5h), L (Late 5.5h), RDO (Requested Day Off 0h)

### Frontend
- `/rotas` management page — monthly grid, employees as rows, days as columns
- Click-to-edit shift cells (permission-gated: `rotas.edit`)
- Month navigation (prev/next/today)
- Contracted hours tracking, over/under calculation
- Colour-coded shift types with legend
- Leave overlay on approved leave days (green diagonal stripes)
- `/my-rota` personal page — monthly calendar grid (Mon-Sun), shift codes with colours, summary stats

### Data Import
- Source: `Rota 2026.xlsx` — April 2026 to March 2027
- Extraction script: `extract-rota-data.py` (Python)
- Import SQL: `import-shifts.sql` — 1,215 shifts for 9 employees
- Database migration: `migration.sql` + `migration-update.sql`
