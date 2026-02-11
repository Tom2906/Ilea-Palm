import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SupervisionStatus, CompanySettings } from "@/lib/types"
import { useViewManager, applyRowOrder } from "@/hooks/use-view-manager"
import { FilterBar } from "@/components/filter-bar"
import { ViewToolbar, ReorderRowsDialog } from "@/components/view-management"
import { CalendarHeatmapV2 } from "@/components/supervision/calendar-heatmap-v2"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

const allStatuses = ["OK", "Due Soon", "Overdue", "Never"] as const

export default function SupervisionMatrixPage() {
  const [reorderOpen, setReorderOpen] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => api.get<CompanySettings>("/companysettings"),
  })

  // Build default hidden filters from company settings
  const defaultHiddenFilters = useMemo(() => {
    if (!settings) return undefined
    const defaults = new Set<string>()
    settings.defaultHiddenRoles?.forEach((role) => defaults.add(`role:${role}`))
    settings.defaultHiddenEmployeeStatuses?.forEach((status) => defaults.add(`empStatus:${status}`))
    return defaults.size > 0 ? defaults : undefined
  }, [settings])

  const vm = useViewManager({
    gridType: "supervision-matrix",
    defaultHiddenFilters,
  })

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
      if (vm.hidden.has(`status:${s.status}`)) return false
      if (s.role && vm.hidden.has(`role:${s.role}`)) return false
      if (s.employeeStatus && vm.hidden.has(`empStatus:${s.employeeStatus}`)) return false
      return true
    })
  }, [statuses, vm.hidden])

  // Apply row order from view config
  const orderedStatuses = useMemo(
    () => applyRowOrder(filteredStatuses, (s) => s.employeeId, vm.currentConfig.rowOrder),
    [filteredStatuses, vm.currentConfig.rowOrder],
  )

  const filterGroups = useMemo(() => [
    { label: "Status", items: statusItems },
    { label: "Role", items: roleItems },
    { label: "Employee Status", items: employeeStatusItems },
  ], [statusItems, roleItems, employeeStatusItems])

  // Build reorder items from current filtered statuses
  const reorderItems = useMemo(
    () => orderedStatuses.map((s) => ({
      id: s.employeeId,
      label: `${s.firstName} ${s.lastName}`,
      sublabel: s.role,
    })),
    [orderedStatuses],
  )

  return (
    <div className="h-full flex flex-col">
      <CalendarHeatmapV2
        filteredStatuses={orderedStatuses}
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
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs gap-1"
              onClick={() => setReorderOpen(true)}
              disabled={orderedStatuses.length === 0}
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
