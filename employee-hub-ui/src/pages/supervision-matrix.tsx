import { useState, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SupervisionStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { FilterDropdown } from "@/components/filter-dropdown"
import { CalendarHeatmapView } from "@/components/supervision/calendar-heatmap-view"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

const allStatuses = ["OK", "Due Soon", "Overdue", "Never"] as const

export default function SupervisionMatrixPage() {
  const [monthOffset, setMonthOffset] = useState(0)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const { data: statuses } = useQuery({
    queryKey: ["supervision-status"],
    queryFn: () => api.get<SupervisionStatus[]>("/supervisions/status"),
  })

  // Get unique roles from statuses
  const roles = useMemo(() => {
    if (!statuses) return []
    const uniqueRoles = [...new Set(statuses.map((s) => s.role).filter(Boolean))]
    return uniqueRoles.sort()
  }, [statuses])

  // Get unique employee statuses
  const employeeStatuses = useMemo(() => {
    if (!statuses) return []
    const unique = [...new Set(statuses.map((s) => s.employeeStatus).filter(Boolean))] as string[]
    return unique.sort()
  }, [statuses])

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

  const statusItems = useMemo(
    () => allStatuses.map((s) => ({
      id: `status:${s}`,
      label: s,
    })),
    [],
  )

  const roleItems = useMemo(
    () => roles.map((r) => ({
      id: `role:${r}`,
      label: r,
    })),
    [roles],
  )

  const employeeStatusItems = useMemo(
    () => employeeStatuses.map((s) => ({
      id: `empStatus:${s}`,
      label: s,
    })),
    [employeeStatuses],
  )

  // Filter statuses based on hidden filters
  const filteredStatuses = useMemo(() => {
    if (!statuses) return []
    return statuses.filter((s) => {
      // Check status filter
      if (hidden.has(`status:${s.status}`)) return false
      // Check role filter
      if (s.role && hidden.has(`role:${s.role}`)) return false
      // Check employee status filter
      if (s.employeeStatus && hidden.has(`empStatus:${s.employeeStatus}`)) return false
      return true
    })
  }, [statuses, hidden])

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Legend row with filters on right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-200" />
            <span>Due Soon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" />
            <span>Overdue/Missing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300" />
            <span>Exception</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
            <span>Future/N/A</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <FilterDropdown
            label="Status"
            items={statusItems}
            hidden={hidden}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
          <FilterDropdown
            label="Role"
            items={roleItems}
            hidden={hidden}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
          <FilterDropdown
            label="Employee Status"
            items={employeeStatusItems}
            hidden={hidden}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
          {hidden.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={() => setHidden(new Set())}
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonthOffset((prev) => prev - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Earlier
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonthOffset(0)}
          disabled={monthOffset === 0}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMonthOffset((prev) => prev + 1)}
        >
          Later
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Heatmap */}
      <div className="flex-1 min-h-0">
        <CalendarHeatmapView
          filteredStatuses={filteredStatuses}
          monthOffset={monthOffset}
        />
      </div>
    </div>
  )
}
