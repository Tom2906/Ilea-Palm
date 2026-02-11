import { useState, useMemo, useCallback } from "react"
import { useViewManager, applyRowOrder } from "@/hooks/use-view-manager"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import type { RotaMonth, RotaEmployee, Shift, CompanySettings } from "@/lib/types"
import type { Column } from "@/components/data-grid/types"
import { DataGrid } from "@/components/data-grid/data-grid"
import { FilterBar } from "@/components/filter-bar"
import { ViewToolbar, ReorderRowsDialog } from "@/components/view-management"
import { ShiftEditorModal } from "@/components/rotas/shift-editor-modal"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import { shiftColorMap } from "@/lib/shift-colors"

interface DayCol {
  day: number
  date: string
  dayOfWeek: number
  label: string
}

const dayLabels = ["SU", "M", "T", "W", "TH", "F", "S"]

function getDayColumns(year: number, month: number, daysInMonth: number): Column<DayCol>[] {
  const cols: Column<DayCol>[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    const dow = date.getDay()
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    cols.push({
      key: dateStr,
      data: { day: d, date: dateStr, dayOfWeek: dow, label: dayLabels[dow] },
      header: (
        <div className="leading-tight">
          <div className="text-[10px] text-muted-foreground">{dayLabels[dow]}</div>
          <div>{d}</div>
        </div>
      ),
      headerClassName: dow === 0 || dow === 6 ? "bg-gray-100" : "",
    })
  }
  return cols
}

export default function RotasPage() {
  const { hasPermission } = useAuth()
  const [reorderOpen, setReorderOpen] = useState(false)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalEmployeeId, setModalEmployeeId] = useState("")
  const [modalEmployeeName, setModalEmployeeName] = useState("")
  const [modalDate, setModalDate] = useState("")
  const [modalShift, setModalShift] = useState<Shift | null>(null)

  const { data: settings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => api.get<CompanySettings>("/companysettings"),
  })

  // Rota uses its own default filter settings
  const defaultHiddenFilters = useMemo(() => {
    if (!settings) return undefined
    const defaults = new Set<string>()
    settings.defaultHiddenRotaRoles?.forEach((role) => defaults.add(`role:${role}`))
    settings.defaultHiddenRotaEmployeeStatuses?.forEach((status) => defaults.add(`empStatus:${status}`))
    return defaults.size > 0 ? defaults : undefined
  }, [settings])

  const vm = useViewManager({
    gridType: "rota",
    defaultHiddenFilters,
  })

  const { data: rota, isLoading } = useQuery({
    queryKey: ["rota", year, month],
    queryFn: () => api.get<RotaMonth>(`/rota?year=${year}&month=${month}`),
  })

  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const goToCurrentMonth = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
  }

  const monthName = new Date(year, month - 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  // Filters
  const roles = useMemo(() => {
    if (!rota?.staff) return []
    return [...new Set(rota.staff.map((s) => s.role).filter(Boolean))].sort()
  }, [rota])

  const roleItems = useMemo(
    () => roles.map((r) => ({ id: `role:${r}`, label: r })),
    [roles],
  )

  const filteredStaff = useMemo(() => {
    if (!rota?.staff) return []
    return rota.staff.filter((s) => {
      if (s.role && vm.hidden.has(`role:${s.role}`)) return false
      return true
    })
  }, [rota, vm.hidden])

  // Apply row order
  const orderedStaff = useMemo(
    () => applyRowOrder(filteredStaff, (s) => s.employeeId, vm.currentConfig.rowOrder),
    [filteredStaff, vm.currentConfig.rowOrder],
  )

  // Grid columns
  const dayColumns = useMemo(
    () => getDayColumns(year, month, rota?.daysInMonth ?? 0),
    [year, month, rota?.daysInMonth],
  )

  // Cell click handler
  const handleCellClick = useCallback(
    (row: RotaEmployee, col: Column<DayCol>) => {
      if (!hasPermission("rotas.edit")) return
      const shift = row.shifts[col.data.date] ?? null
      setModalEmployeeId(row.employeeId)
      setModalEmployeeName(`${row.firstName} ${row.lastName}`)
      setModalDate(col.data.date)
      setModalShift(shift)
      setModalOpen(true)
    },
    [hasPermission],
  )

  // Cell rendering
  const renderCell = useCallback(
    (row: RotaEmployee, col: Column<DayCol>) => {
      const shift = row.shifts[col.data.date]
      if (!shift) return null
      return <span>{shift.shiftTypeCode}</span>
    },
    [],
  )

  const getCellClassName = useCallback(
    (row: RotaEmployee, col: Column<DayCol>) => {
      const shift = row.shifts[col.data.date]
      const isWeekend = col.data.dayOfWeek === 0 || col.data.dayOfWeek === 6
      const isLeave = row.leaveDates?.includes(col.data.date)
      let cls = ""
      if (shift) {
        cls = shiftColorMap[shift.shiftTypeCode]?.cell ?? "bg-gray-100 border border-gray-200 text-gray-800"
      } else if (isWeekend) {
        cls = "bg-gray-50"
      }
      if (isLeave) cls += " leave-overlay"
      return cls
    },
    [],
  )

  // Summary columns
  const summaryColumns = useMemo(
    () => [
      {
        key: "hours",
        header: "Hours",
        width: 60,
        className: "border-l",
        render: (row: RotaEmployee) => (
          <span className="font-medium">{row.summary.totalHours.toFixed(1)}</span>
        ),
      },
      {
        key: "sleeps",
        header: "Sleeps",
        width: 55,
        render: (row: RotaEmployee) => (
          <span>{row.summary.totalSleeps > 0 ? row.summary.totalSleeps : ""}</span>
        ),
      },
      {
        key: "overunder",
        header: "+/-",
        width: 55,
        render: (row: RotaEmployee) => {
          if (row.summary.overUnder == null) return <span className="text-muted-foreground">&mdash;</span>
          const val = row.summary.overUnder
          const color = val > 0 ? "text-green-600" : val < 0 ? "text-red-600" : "text-muted-foreground"
          return (
            <span className={`font-medium ${color}`}>
              {val > 0 ? "+" : ""}
              {val.toFixed(1)}
            </span>
          )
        },
      },
      {
        key: "al",
        header: "AL",
        width: 45,
        render: (row: RotaEmployee) => (
          <span>{row.summary.annualLeaveDays > 0 ? row.summary.annualLeaveDays : ""}</span>
        ),
      },
    ],
    [],
  )

  // Legend
  const legend = useMemo(
    () => [
      ...(rota?.shiftTypes.map((st) => {
        const colors = shiftColorMap[st.code]
        return {
          color: colors?.legend ?? "bg-gray-100",
          borderColor: colors?.border ?? "border border-gray-200",
          label: `${st.code} - ${st.name} (${st.defaultHours}h)`,
        }
      }) ?? []),
      {
        color: "bg-green-50",
        borderColor: "border border-green-200 leave-overlay",
        label: "AL - Annual Leave",
      },
    ],
    [rota?.shiftTypes],
  )

  // Reorder items
  const reorderItems = useMemo(
    () => orderedStaff.map((s) => ({
      id: s.employeeId,
      label: `${s.firstName} ${s.lastName}`,
      sublabel: s.role,
    })),
    [orderedStaff],
  )

  const monthNav = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold min-w-[140px] text-center">
        {monthName}
      </span>
      <Button variant="outline" size="sm" onClick={goToNextMonth}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isCurrentMonth && (
        <Button variant="ghost" size="sm" className="text-xs" onClick={goToCurrentMonth}>
          Today
        </Button>
      )}
    </div>
  )

  return (
    <div className="h-full flex flex-col gap-4">
      <DataGrid<RotaEmployee, DayCol>
        rows={orderedStaff}
        columns={dayColumns}
        getRowKey={(row) => row.employeeId}
        loading={isLoading}
        legend={legend}
        navigation={monthNav}
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
              filters={[{ label: "Role", items: roleItems }]}
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
              disabled={orderedStaff.length === 0}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Reorder
            </Button>
          </ViewToolbar>
        }
        cellWidth={42}
        cellHeight={38}
        rowLabelWidth={160}
        emptyMessage="No staff found"
        rowLabelHeader="Employee"
        renderRowLabel={(row) => (
          <div className="truncate" title={`${row.firstName} ${row.lastName}`}>
            <div className="font-medium text-xs">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">{row.role}</div>
          </div>
        )}
        renderCell={renderCell}
        onCellClick={hasPermission("rotas.edit") ? handleCellClick : undefined}
        getCellClassName={getCellClassName}
        summaryColumns={summaryColumns}
      />

      {/* Shift editor modal */}
      {rota && (
        <ShiftEditorModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          employeeId={modalEmployeeId}
          employeeName={modalEmployeeName}
          date={modalDate}
          existingShift={modalShift}
          shiftTypes={rota.shiftTypes}
          year={year}
          month={month}
        />
      )}

      <ReorderRowsDialog
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        items={reorderItems}
        onApply={vm.setRowOrder}
      />
    </div>
  )
}
