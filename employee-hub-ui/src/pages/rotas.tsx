import { useState, useMemo, useCallback, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import type { RotaMonth, RotaEmployee, Shift, CompanySettings } from "@/lib/types"
import type { Column } from "@/components/data-grid/types"
import { DataGrid } from "@/components/data-grid/data-grid"
import { FilterBar } from "@/components/filter-bar"
import { ShiftEditorModal } from "@/components/rotas/shift-editor-modal"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DayCol {
  day: number
  date: string
  dayOfWeek: number // 0=Sun, 6=Sat
  label: string
}

const dayLabels = ["SU", "M", "T", "W", "TH", "F", "S"]

const shiftColorMap: Record<string, { cell: string; legend: string; border: string }> = {
  A:   { cell: "bg-blue-100 border border-blue-200 text-blue-800",     legend: "bg-blue-100",   border: "border border-blue-200" },
  D:   { cell: "bg-amber-100 border border-amber-200 text-amber-800",  legend: "bg-amber-100",  border: "border border-amber-200" },
  DS:  { cell: "bg-purple-100 border border-purple-200 text-purple-800", legend: "bg-purple-100", border: "border border-purple-200" },
  S:   { cell: "bg-indigo-100 border border-indigo-200 text-indigo-800", legend: "bg-indigo-100", border: "border border-indigo-200" },
  E:   { cell: "bg-green-100 border border-green-200 text-green-800",  legend: "bg-green-100",  border: "border border-green-200" },
  L:   { cell: "bg-red-100 border border-red-200 text-red-800",        legend: "bg-red-100",    border: "border border-red-200" },
  RDO: { cell: "bg-gray-200 border border-gray-300 text-gray-600",     legend: "bg-gray-200",   border: "border border-gray-300" },
}

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

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [defaultsApplied, setDefaultsApplied] = useState(false)

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

  useEffect(() => {
    if (settings && !defaultsApplied) {
      const defaults = new Set<string>()
      settings.defaultHiddenRotaRoles?.forEach((role) => defaults.add(`role:${role}`))
      settings.defaultHiddenRotaEmployeeStatuses?.forEach((status) => defaults.add(`empStatus:${status}`))
      if (defaults.size > 0) setHidden(defaults)
      setDefaultsApplied(true)
    }
  }, [settings, defaultsApplied])

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

  const roleItems = useMemo(
    () => roles.map((r) => ({ id: `role:${r}`, label: r })),
    [roles],
  )

  const filteredStaff = useMemo(() => {
    if (!rota?.staff) return []
    return rota.staff.filter((s) => {
      if (s.role && hidden.has(`role:${s.role}`)) return false
      return true
    })
  }, [rota, hidden])

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
        rows={filteredStaff}
        columns={dayColumns}
        getRowKey={(row) => row.employeeId}
        loading={isLoading}
        legend={legend}
        navigation={monthNav}
        toolbar={
            <FilterBar
              filters={[{ label: "Role", items: roleItems }]}
              hidden={hidden}
              onToggle={toggle}
              onToggleAll={toggleAll}
              onClear={() => setHidden(new Set())}
            />
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
    </div>
  )
}
