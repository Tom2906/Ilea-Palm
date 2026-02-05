# DataGrid Component - Implementation Plan

**Status:** COMPLETE

## Goal
Create a generic, reusable data grid component that consolidates the duplicated matrix pattern used across supervision, training, appraisals, and (future) rota pages.

---

## Component API Design

```tsx
interface Column<TCol> {
  key: string
  header: React.ReactNode
  headerClassName?: string
}

interface DataGridProps<TRow, TCol> {
  // Data
  rows: TRow[]
  columns: Column<TCol>[]
  getRowKey: (row: TRow) => string
  getColKey: (col: TCol) => string

  // Row label (sticky left column)
  renderRowLabel: (row: TRow) => React.ReactNode

  // Cell rendering
  renderCell: (row: TRow, col: TCol) => React.ReactNode
  onCellClick?: (row: TRow, col: TCol) => void
  getCellClassName?: (row: TRow, col: TCol) => string

  // Filtering
  filters?: FilterConfig[]

  // Legend
  legend?: LegendItem[]

  // Layout
  rowLabelWidth?: number        // Default: 200
  cellWidth?: number            // Default: 48 (w-12)
  cellHeight?: number           // Default: 48 (h-12)

  // Loading state
  loading?: boolean
  emptyMessage?: string
}

interface FilterConfig {
  key: string
  label: string
  items: { id: string; label: string }[]
}

interface LegendItem {
  color: string
  label: string
}
```

---

## File Structure

```
components/data-grid/
  index.ts                  # Exports
  data-grid.tsx             # Main component
  data-grid-cell.tsx        # Cell wrapper with tooltip support
  data-grid-filters.tsx     # Filter bar component
  data-grid-legend.tsx      # Legend row component
  use-filter-state.ts       # Shared filter hook
  types.ts                  # TypeScript types
```

---

## Implementation Steps

### Step 1: Core Files
- [x] Create `types.ts` with interfaces
- [x] Create `use-filter-state.ts` hook (extract from existing)
- [x] Create `data-grid-legend.tsx`
- [x] Create `data-grid-filters.tsx`
- [x] Create `data-grid.tsx` main component

### Step 2: Test with Supervision
- [x] Create `supervision/calendar-heatmap-v2.tsx` using DataGrid
- [x] Add test route `/supervision-matrix-test` with v1/v2 toggle
- [x] Validated and deployed as primary supervision matrix view
- [x] Old `calendar-heatmap-view.tsx` removed

### Step 3: Migrate Other Matrices
- [x] Migrate training matrix → `training/training-matrix-v2.tsx` uses DataGrid
- [x] Old training matrix implementations removed (`training-heatmap.tsx`, `training-matrix-view.tsx`)
- [ ] Migrate appraisals matrix (feature not fully built yet — will use DataGrid when it is)

### Step 4: Build Rota (future)
- [ ] Build rota page using DataGrid (feature not started yet)

---

## Extracted Patterns

### Filter State Hook (from existing code)
```tsx
function useFilterState() {
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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

  const clear = useCallback(() => setHidden(new Set()), [])

  const isHidden = useCallback((id: string) => hidden.has(id), [hidden])

  return { hidden, toggle, toggleAll, clear, isHidden, hasFilters: hidden.size > 0 }
}
```

### Legend Component
```tsx
interface LegendItem {
  color: string      // Tailwind classes e.g. "bg-emerald-500"
  borderColor?: string
  label: string
}

function DataGridLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex items-center gap-4 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-sm ${item.color} ${item.borderColor || ''}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
```

---

## Usage Example (Rota)

```tsx
const days = getDaysInMonth(year, month)  // [{ key: '1', day: 1, dow: 'M' }, ...]

<DataGrid
  rows={staff}
  columns={days}
  getRowKey={(emp) => emp.id}
  getColKey={(day) => day.key}

  renderRowLabel={(emp) => (
    <div>
      <div className="font-medium">{emp.firstName} {emp.lastName}</div>
      <div className="text-xs text-muted-foreground">{emp.role}</div>
    </div>
  )}

  renderCell={(emp, day) => {
    const shift = getShift(emp.id, day.key)
    return <ShiftCell shift={shift} />
  }}

  onCellClick={(emp, day) => openShiftEditor(emp, day)}

  getCellClassName={(emp, day) => {
    const shift = getShift(emp.id, day.key)
    return shift ? shiftColors[shift.typeCode] : ''
  }}

  filters={[
    { key: 'role', label: 'Role', items: roleItems },
    { key: 'status', label: 'Status', items: statusItems },
  ]}

  legend={[
    { color: 'bg-blue-100 border border-blue-200', label: 'Awake (A)' },
    { color: 'bg-amber-100 border border-amber-200', label: 'Day (D)' },
    { color: 'bg-purple-100 border border-purple-200', label: 'Day + Sleep (DS)' },
  ]}
/>
```

---

## Estimated Complexity

| File | Lines | Notes |
|------|-------|-------|
| types.ts | ~40 | Interfaces |
| use-filter-state.ts | ~30 | Hook extraction |
| data-grid-legend.tsx | ~20 | Simple component |
| data-grid-filters.tsx | ~40 | Uses existing FilterDropdown |
| data-grid.tsx | ~150 | Main component |
| **Total** | **~280** | |

---

## Success Criteria
- [ ] Supervision v2 looks identical to v1
- [ ] Filtering works the same
- [ ] Click handling works the same
- [ ] Tooltips work the same
- [ ] No regressions when swapped in
- [ ] Rota can be built on it easily
