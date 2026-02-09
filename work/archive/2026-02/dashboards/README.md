# Dashboard Enhancement

## Status: Complete

## Scope
Enhance both company and personal dashboards to surface all existing data (training, supervision, appraisals, rota, leave), add rota'd-vs-contracted hours component, and build a unified activity feed.

Frontend-only — all backend endpoints already exist.

## Files
### New
- `src/lib/shift-colors.ts` — Shared shift type color map
- `src/lib/audit-messages.ts` — Audit log to human-readable activity items
- `src/components/activity-feed.tsx` — Reusable ActivityFeed component
- `src/components/upcoming-shifts.tsx` — Next 7 days shift list

### Modified
- `src/lib/format.ts` — Added `formatRelativeTime`
- `src/pages/dashboard.tsx` — Permission-gated queries for all features
- `src/components/dashboard-overview.tsx` — Expanded stat cards + tabbed detail area
- `src/pages/my-dashboard.tsx` — New stat cards, upcoming shifts, expanded alerts
- `src/pages/rotas.tsx` + `my-rota.tsx` — Import shift colors from shared lib
