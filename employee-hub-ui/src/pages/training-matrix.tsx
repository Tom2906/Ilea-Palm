import { useState, useMemo, useCallback, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { TrainingStatus, TrainingCourse, Employee, CompanySettings } from "@/lib/types"
import { FilterBar } from "@/components/filter-bar"
import { TrainingMatrixV2 } from "@/components/training/training-matrix-v2"

const trainingStatuses = ["Valid", "Completed", "Expiring Soon", "Expired"] as const

export default function TrainingMatrixPage() {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [defaultsApplied, setDefaultsApplied] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => api.get<CompanySettings>("/companysettings"),
  })

  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ["training-courses"],
    queryFn: () => api.get<TrainingCourse[]>("/training-courses"),
  })

  const { data: statuses, isLoading: loadingStatuses } = useQuery({
    queryKey: ["training-status"],
    queryFn: () => api.get<TrainingStatus[]>("/training-records/status"),
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

  // Get unique roles from employees
  const roles = useMemo(() => {
    if (!employees) return []
    return [...new Set(employees.map((e) => e.role).filter(Boolean))].sort()
  }, [employees])

  // Get unique employee statuses
  const employeeStatuses = useMemo(() => {
    if (!employees) return []
    return [...new Set(employees.map((e) => e.statusName).filter(Boolean))] as string[]
  }, [employees])

  // Build status map, filtering out hidden statuses
  const statusMap = useMemo(() => {
    const map = new Map<string, TrainingStatus>()
    statuses?.forEach((s) => {
      if (!hidden.has(`status:${s.status}`)) {
        map.set(`${s.employeeId}-${s.courseId}`, s)
      }
    })
    return map
  }, [statuses, hidden])

  // Filter employees by role and employee status
  const filteredEmployees = useMemo(() => {
    if (!employees) return []
    return employees.filter((e) => {
      if (hidden.has(`emp:${e.id}`)) return false
      if (e.role && hidden.has(`role:${e.role}`)) return false
      if (e.statusName && hidden.has(`empStatus:${e.statusName}`)) return false
      return true
    })
  }, [employees, hidden])

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!courses) return []
    return courses.filter((c) => !hidden.has(`course:${c.id}`))
  }, [courses, hidden])

  // Get unique categories
  const categories = useMemo(() => {
    if (!courses) return []
    return [...new Set(courses.map((c) => c.category))].sort()
  }, [courses])

  const loading = loadingEmployees || loadingCourses || loadingStatuses

  const filterGroups = useMemo(() => [
    { label: "Status", items: trainingStatuses.map((s) => ({ id: `status:${s}`, label: s })) },
    { label: "Role", items: roles.map((r) => ({ id: `role:${r}`, label: r })) },
    { label: "Employee Status", items: employeeStatuses.map((s) => ({ id: `empStatus:${s}`, label: s })) },
    { label: "Category", items: categories.map((c) => ({ id: `course:cat:${c}`, label: c })) },
  ], [roles, employeeStatuses, categories])

  return (
    <div className="h-full flex flex-col">
      <TrainingMatrixV2
        employees={filteredEmployees}
        courses={filteredCourses}
        statusMap={statusMap}
        loading={loading}
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
