import { useState, useMemo, useCallback, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SupervisionStatus, CompanySettings } from "@/lib/types"
import { FilterBar } from "@/components/filter-bar"
import { CalendarHeatmapV2 } from "@/components/supervision/calendar-heatmap-v2"

const allStatuses = ["OK", "Due Soon", "Overdue", "Never"] as const

export default function SupervisionMatrixPage() {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [defaultsApplied, setDefaultsApplied] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => api.get<CompanySettings>("/companysettings"),
  })

  // Apply default hidden filters from company settings
  useEffect(() => {
    if (settings && !defaultsApplied) {
      const defaults = new Set<string>()
      settings.defaultHiddenRoles?.forEach((role) => defaults.add(`role:${role}`))
      settings.defaultHiddenEmployeeStatuses?.forEach((status) => defaults.add(`empStatus:${status}`))
      if (defaults.size > 0) {
        setHidden(defaults)
      }
      setDefaultsApplied(true)
    }
  }, [settings, defaultsApplied])

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
      if (hidden.has(`status:${s.status}`)) return false
      if (s.role && hidden.has(`role:${s.role}`)) return false
      if (s.employeeStatus && hidden.has(`empStatus:${s.employeeStatus}`)) return false
      return true
    })
  }, [statuses, hidden])

  const filterGroups = useMemo(() => [
    { label: "Status", items: statusItems },
    { label: "Role", items: roleItems },
    { label: "Employee Status", items: employeeStatusItems },
  ], [statusItems, roleItems, employeeStatusItems])

  return (
    <div className="h-full flex flex-col">
      <CalendarHeatmapV2
        filteredStatuses={filteredStatuses}
        toolbar={
          <FilterBar
            filters={filterGroups}
            hidden={hidden}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onClear={() => setHidden(new Set())}
          />
        }
      />
    </div>
  )
}
