import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { TrainingStatus, TrainingCourse, Employee, CompanySettings } from "@/lib/types"
import { useViewManager, applyRowOrder } from "@/hooks/use-view-manager"
import { FilterBar } from "@/components/filter-bar"
import { ViewToolbar, ReorderRowsDialog } from "@/components/view-management"
import { TrainingMatrixV2 } from "@/components/training/training-matrix-v2"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { ArrowUpDown, Columns3 } from "lucide-react"

const trainingStatuses = ["Valid", "Completed", "Expiring Soon", "Expired"] as const

export default function TrainingMatrixPage() {
  const [reorderOpen, setReorderOpen] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => api.get<CompanySettings>("/companysettings"),
  })

  const defaultHiddenFilters = useMemo(() => {
    if (!settings) return undefined
    const defaults = new Set<string>()
    settings.defaultHiddenRoles?.forEach((role) => defaults.add(`role:${role}`))
    settings.defaultHiddenEmployeeStatuses?.forEach((status) => defaults.add(`empStatus:${status}`))
    return defaults.size > 0 ? defaults : undefined
  }, [settings])

  const vm = useViewManager({
    gridType: "training-matrix",
    defaultHiddenFilters,
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

  // Get unique categories
  const categories = useMemo(() => {
    if (!courses) return []
    return [...new Set(courses.map((c) => c.category))].sort()
  }, [courses])

  // Hidden columns set for quick lookup
  const hiddenColumnsSet = useMemo(
    () => new Set(vm.currentConfig.hiddenColumns),
    [vm.currentConfig.hiddenColumns],
  )

  // Build status map, filtering out hidden statuses
  const statusMap = useMemo(() => {
    const map = new Map<string, TrainingStatus>()
    statuses?.forEach((s) => {
      if (!vm.hidden.has(`status:${s.status}`)) {
        map.set(`${s.employeeId}-${s.courseId}`, s)
      }
    })
    return map
  }, [statuses, vm.hidden])

  // Filter employees by role, employee status, and hidden columns
  const filteredEmployees = useMemo(() => {
    if (!employees) return []
    return employees.filter((e) => {
      if (hiddenColumnsSet.has(e.id)) return false
      if (e.role && vm.hidden.has(`role:${e.role}`)) return false
      if (e.statusName && vm.hidden.has(`empStatus:${e.statusName}`)) return false
      return true
    })
  }, [employees, vm.hidden, hiddenColumnsSet])

  // Filter courses
  const filteredCourses = useMemo(() => {
    if (!courses) return []
    return courses.filter((c) => !vm.hidden.has(`course:${c.id}`))
  }, [courses, vm.hidden])

  // Apply row order (courses are rows)
  const orderedCourses = useMemo(
    () => applyRowOrder(filteredCourses, (c) => c.id, vm.currentConfig.rowOrder),
    [filteredCourses, vm.currentConfig.rowOrder],
  )

  const loading = loadingEmployees || loadingCourses || loadingStatuses

  const filterGroups = useMemo(() => [
    { label: "Status", items: trainingStatuses.map((s) => ({ id: `status:${s}`, label: s })) },
    { label: "Role", items: roles.map((r) => ({ id: `role:${r}`, label: r })) },
    { label: "Employee Status", items: employeeStatuses.map((s) => ({ id: `empStatus:${s}`, label: s })) },
    { label: "Category", items: categories.map((c) => ({ id: `course:cat:${c}`, label: c })) },
  ], [roles, employeeStatuses, categories])

  // Reorder items (courses are rows)
  const reorderItems = useMemo(
    () => orderedCourses.map((c) => ({
      id: c.id,
      label: c.name,
      sublabel: c.category,
    })),
    [orderedCourses],
  )

  // Column visibility count
  const hiddenColumnCount = vm.currentConfig.hiddenColumns.length

  return (
    <div className="h-full flex flex-col">
      <TrainingMatrixV2
        employees={filteredEmployees}
        courses={orderedCourses}
        statusMap={statusMap}
        loading={loading}
        toolbar={
          <ViewToolbar
            views={vm.views}
            activeView={vm.activeView}
            hasUnsavedChanges={vm.hasUnsavedChanges}
            currentConfig={vm.currentConfig}
            onLoadView={vm.loadView}
            onClearActiveView={vm.clearActiveView}
            onSave={vm.saveView}
            onSaveAs={vm.saveAsNewView}
            onDelete={vm.deleteView}
            onRename={vm.renameView}
            onSetDefault={vm.setDefaultView}
            onClearDefault={vm.clearDefault}
            canManagePersonalViews={vm.canManagePersonalViews}
            canManageCompanyDefaults={vm.canManageCompanyDefaults}
          >
            <FilterBar
              filters={filterGroups}
              hidden={vm.hidden}
              onToggle={vm.toggleFilter}
              onToggleAll={vm.toggleAllFilters}
              onClear={vm.clearFilters}
            />
            {/* Column visibility toggle */}
            {employees && employees.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1">
                    <Columns3 className="h-3.5 w-3.5" />
                    Columns
                    {hiddenColumnCount > 0 && (
                      <span className="text-muted-foreground">({hiddenColumnCount})</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-2 max-h-72 overflow-y-auto">
                  <div className="space-y-0.5">
                    {employees.map((emp) => (
                      <label
                        key={emp.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={!hiddenColumnsSet.has(emp.id)}
                          onCheckedChange={() => vm.toggleColumn(emp.id)}
                        />
                        <span className="text-sm truncate">
                          {emp.firstName} {emp.lastName}
                        </span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs gap-1"
              onClick={() => setReorderOpen(true)}
              disabled={orderedCourses.length === 0}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Reorder
            </Button>
          </ViewToolbar>
        }
      />

      <ReorderRowsDialog
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        items={reorderItems}
        onApply={vm.setRowOrder}
      />
    </div>
  )
}
