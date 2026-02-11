# View Management System

**Status:** Complete - pending migration run and manual testing

## Overview
Reusable view management for grid/matrix pages. Users can create named views that persist filters, row order, and column visibility.

## To Deploy
1. Run `migration.sql` against Supabase
2. Restart API (new endpoints + DI registration)

## Files Created
### Backend (6 files)
- `Models/UserGridView.cs` — model
- `DTOs/GridViewDtos.cs` — request/response DTOs
- `Services/IGridViewService.cs` — interface
- `Services/GridViewService.cs` — implementation (Npgsql, JSONB)
- `Controllers/GridViewsController.cs` — CRUD API (`/api/gridviews`)

### Frontend (7 files)
- `lib/types.ts` — ViewConfig, GridView types (added)
- `hooks/use-view-manager.ts` — hook + applyRowOrder utility
- `components/view-management/view-toolbar.tsx` — dropdown menu for views
- `components/view-management/save-view-dialog.tsx` — name input dialog
- `components/view-management/manage-views-dialog.tsx` — rename/delete/set-default
- `components/view-management/reorder-rows-dialog.tsx` — drag-and-drop row reorder
- `components/view-management/index.ts` — barrel export

### Modified files (4)
- `Program.cs` — DI registration
- `pages/supervision-matrix.tsx` — uses useViewManager
- `pages/training-matrix.tsx` — uses useViewManager + column visibility
- `pages/rotas.tsx` — uses useViewManager

### Package added
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

## API
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/gridviews?gridType=X` | List views for current user |
| POST | `/api/gridviews` | Create view |
| PUT | `/api/gridviews/{id}` | Update view (COALESCE partial) |
| DELETE | `/api/gridviews/{id}` | Delete view |

All endpoints require auth (no specific permission). User scoping via JWT.

## Testing Checklist
- [ ] Run migration
- [ ] Create a view on supervision matrix
- [ ] Save filters, reload, verify persistence
- [ ] Reorder rows, save, reload, verify order
- [ ] Set default view, reload, verify auto-load
- [ ] Training matrix: hide employee columns, save view
- [ ] Delete an employee, load view — missing IDs ignored gracefully
- [ ] Log in as different user — views are isolated
- [ ] No saved views — falls back to company settings defaults
