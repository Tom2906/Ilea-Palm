# UI Layout Components

**Status:** Complete
**Created:** 2026-02-07

## Overview

Standard page layout components that enforce a consistent toolbar and content pattern across all pages.

## Standard Toolbar Convention

All data pages share the same toolbar layout:

```
[Left: search / navigation]              [Right: legend? + FilterBar + action button]
[Content area: grid / list / table / loading / empty]
```

- **Left side:** Primary navigation or search input
- **Right side:** Actions grouped together — legend icon (DataGrid only), FilterBar, then add/action button (always far right)

## FilterBar (`components/filter-bar.tsx`)

**The standard filter component for all pages.** Same button, same popover behaviour, same hidden-set pattern everywhere.

- Renders a "Filters (n)" outline button that opens a popover with collapsible checkbox groups
- State: `Set<string>` of hidden item IDs (prefixed by type, e.g. `cat:Online Mandatory`, `role:Manager`)
- Props: `filters` (groups), `hidden`, `onToggle`, `onToggleAll`, `onClear`
- Shows "Clear all filters" at the bottom when any items are hidden
- Group headers have select-all/deselect-all checkboxes with indeterminate state

**Standard state pattern** (copy this for any new page):
```tsx
const [hidden, setHidden] = useState<Set<string>>(new Set())

const toggle = useCallback((id: string) => {
  setHidden((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
}, [])

const toggleAll = useCallback((ids: string[], hide: boolean) => {
  setHidden((prev) => {
    const next = new Set(prev)
    ids.forEach((id) => (hide ? next.add(id) : next.delete(id)))
    return next
  })
}, [])
```

## Components

### DataGrid (`components/data-grid/`)

For matrix/grid pages (training matrix, supervision matrix, rotas, appraisals).

**Toolbar props:**
- `navigation?: ReactNode` — left side (month nav arrows, page title, etc.)
- `toolbar?: ReactNode` — right side (FilterBar, action buttons)
- `legend?: LegendItem[]` — colour key rendered as popover icon, appears left of toolbar

**Other props:** `loading`, `emptyMessage`, `rows`, `columns`, `renderCell`, etc.

**Used by:**
- Training Matrix — toolbar: FilterBar (Status, Role, Employee Status, Category groups)
- Supervision Matrix — toolbar: FilterBar
- Rotas — navigation: month arrows; toolbar: FilterBar
- Appraisals — toolbar: FilterBar

### ListPage (`components/list-page.tsx`)

For list-based pages (vertical item lists with optional collapsible groups).

**Toolbar props:**
- `searchPlaceholder?: string` — built-in search input on the left (icon + input)
- `searchValue?: string` — controlled search value
- `onSearchChange?: (value: string) => void` — search change handler
- `toolbar?: ReactNode` — right side (FilterBar + action buttons)

**Other props:** `loading`, `emptyMessage`, `itemCount`, `groups?: ListPageGroup[]`, `children`

**Used by:**
- Training Courses — search + FilterBar (Category) + Add Course button
- Employees — search + FilterBar (Status) + Add Employee button
- Users — search + FilterBar (Role, Status)
- Leave — search + FilterBar (Status) + Request Leave button
- My Training — search + FilterBar (Status, Category) + Record Training button; groups by category
- Onboarding Items — Add Item button (no search, small list)
- Employee Statuses — Add Status button (no search, small list)

### DataTable (`components/data-table.tsx`)

For tabular record pages with flat or expandable rows.

**Toolbar props:**
- `searchPlaceholder?: string` — built-in search input on the left
- `searchValue?: string` — controlled search value
- `onSearchChange?: (value: string) => void` — search change handler
- `toolbar?: ReactNode` — right side (FilterBar + action buttons)

**Column definition:**
```tsx
interface DataTableColumn<TRow> {
  key: string
  header: string
  render: (row: TRow) => ReactNode
  className?: string
}
```

**Other props:** `columns`, `rows`, `getRowKey`, `renderDetail?` (expandable rows), `loading`, `emptyMessage`

**Used by:**
- Audit Log — expandable DataTable with FilterBar (Table, Action) + search
- Notification Log — flat DataTable with FilterBar (Type, Recipient) + search

## Layout Rules

1. Search input is always on the left (built into ListPage/DataTable, or custom in DataGrid's `navigation`)
2. FilterBar is the only way to filter — no standalone Select dropdowns or badge chip toggles
3. The primary action button (Add, Create, etc.) is always the far-right element
4. FilterBar sits between legend/search and the action button
5. Loading state: DataGrid shows skeleton bar + area; ListPage shows 8 skeleton rows; DataTable shows skeleton table
6. Empty state: centred muted text message
7. Scroll: `h-full flex flex-col gap-4` outer → `shrink-0` toolbar → `flex-1 min-h-0 overflow-y-auto` content

## When to Use Which

| Component | Use for | Examples |
|-----------|---------|----------|
| DataGrid  | Row x Column matrix data | Training matrix, rotas, supervision, appraisals |
| ListPage  | Vertical list of items | Employees, training courses, users, leave, onboarding items |
| DataTable | Tabular records (flat or expandable) | Audit log, notification log |
