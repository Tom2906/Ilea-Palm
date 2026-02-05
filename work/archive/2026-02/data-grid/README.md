# DataGrid Component

**Status:** COMPLETE - Supervision & Training migrated. Appraisals & Rota will use DataGrid when those features are built.

## Overview
Generic data grid component to replace duplicated matrix implementations across the app.

## Current Matrices (to be consolidated)
- `CalendarHeatmapView` - Supervision matrix (months × employees)
- `TrainingMatrixView` - Training matrix (courses × employees)
- `AppraisalsMatrix` - Appraisals matrix (milestones × employees)

## New Component Location
`employee-hub-ui/src/components/data-grid/`

## Test Page
`/supervision-matrix-test` - Toggle between v1 (original) and v2 (DataGrid)

## Files Created
- `components/data-grid/types.ts`
- `components/data-grid/use-filter-state.ts`
- `components/data-grid/data-grid-legend.tsx`
- `components/data-grid/data-grid-filters.tsx`
- `components/data-grid/data-grid.tsx`
- `components/data-grid/index.ts`
- `components/supervision/calendar-heatmap-v2.tsx`
- `pages/supervision-matrix-test.tsx`

## Depends On
Nothing - this is foundational

## Blocks
- Rota feature (`work/rotas/`) - will be built on DataGrid

## Plan
See `plan.md`
