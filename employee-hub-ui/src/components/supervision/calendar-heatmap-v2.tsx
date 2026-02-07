import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SupervisionStatus, Supervision, SupervisionException, SupervisionRequirement, CompanySettings } from "@/lib/types"
import { DataGrid } from "@/components/data-grid"
import type { Column, LegendItem } from "@/components/data-grid"
import { MonthDetailsModal } from "./month-details-modal"
import { CellContextMenu } from "./cell-context-menu"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

const exceptionLabels: Record<SupervisionException["exceptionType"], string> = {
  not_required: "",
  annual_leave: "AL",
  sick_leave: "S",
}

const exceptionFullLabels: Record<SupervisionException["exceptionType"], string> = {
  not_required: "Not Required",
  annual_leave: "Annual Leave",
  sick_leave: "Sick Leave",
}

interface MonthColumn {
  key: string
  label: string
  year: number
  month: number
}

interface CalendarHeatmapV2Props {
  filteredStatuses: SupervisionStatus[]
  toolbar?: React.ReactNode
  navigation?: React.ReactNode
}

export function CalendarHeatmapV2({ filteredStatuses, toolbar, navigation }: CalendarHeatmapV2Props) {
  const navigate = useNavigate()
  const [selectedEmployee, setSelectedEmployee] = useState<SupervisionStatus | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data: supervisions, isLoading: loadingSupervisions } = useQuery({
    queryKey: ["supervisions"],
    queryFn: () => api.get<Supervision[]>("/supervisions"),
  })

  const { data: exceptions, isLoading: loadingExceptions } = useQuery({
    queryKey: ["supervision-exceptions"],
    queryFn: () => api.get<SupervisionException[]>("/supervision-exceptions"),
  })

  const { data: requirements } = useQuery({
    queryKey: ["supervision-requirements"],
    queryFn: () => api.get<SupervisionRequirement[]>("/supervision-requirements"),
  })

  const { data: settings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => api.get<CompanySettings>("/companysettings"),
  })

  // Generate months based on company settings
  const monthsBack = settings?.supervisionMonthsBack ?? 9
  const monthsForward = settings?.supervisionMonthsForward ?? 3
  const totalMonths = monthsBack + monthsForward + 1

  const months = useMemo<Column<MonthColumn>[]>(() => {
    const result: Column<MonthColumn>[] = []
    const today = new Date()
    const startOffset = -monthsBack
    for (let i = 0; i < totalMonths; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + startOffset + i, 1)
      const monthName = date.toLocaleDateString("en-GB", { month: "short" })
      const year = date.getFullYear()
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      result.push({
        key,
        data: { key, label: `${monthName} ${year}`, year: date.getFullYear(), month: date.getMonth() + 1 },
        header: <div className="w-12 mx-auto text-center">{monthName}<br />{year}</div>,
      })
    }
    return result
  }, [monthsBack, totalMonths])

  // Build supervision map
  const supervisionMap = useMemo(() => {
    if (!supervisions) return new Map<string, Map<string, Supervision[]>>()
    const map = new Map<string, Map<string, Supervision[]>>()
    supervisions.forEach((sup) => {
      if (!map.has(sup.employeeId)) map.set(sup.employeeId, new Map())
      const employeeMap = map.get(sup.employeeId)!
      if (!employeeMap.has(sup.period)) employeeMap.set(sup.period, [])
      employeeMap.get(sup.period)!.push(sup)
    })
    return map
  }, [supervisions])

  // Build exception map
  const exceptionMap = useMemo(() => {
    if (!exceptions) return new Map<string, SupervisionException>()
    const map = new Map<string, SupervisionException>()
    exceptions.forEach((exc) => map.set(`${exc.employeeId}-${exc.period}`, exc))
    return map
  }, [exceptions])

  // Build requirements map
  const requirementsMap = useMemo(() => {
    if (!requirements) return new Map<string, SupervisionRequirement[]>()
    const map = new Map<string, SupervisionRequirement[]>()
    requirements.forEach((req) => {
      if (!map.has(req.employeeId)) map.set(req.employeeId, [])
      map.get(req.employeeId)!.push(req)
    })
    map.forEach((reqs) => reqs.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)))
    return map
  }, [requirements])

  const getRequiredCount = (employeeId: string, period: string): number => {
    const reqs = requirementsMap.get(employeeId)
    if (!reqs || reqs.length === 0) return 1
    const periodStart = period + "-01"
    for (const req of reqs) {
      if (req.effectiveFrom <= periodStart) return req.requiredCount
    }
    return 1
  }

  const getException = (employeeId: string, period: string) => {
    return exceptionMap.get(`${employeeId}-${period}`) || null
  }

  const isBeforeStartDate = (employee: SupervisionStatus, period: string): boolean => {
    if (!employee.startDate) return false
    const [year, month] = period.split("-").map(Number)
    const periodEndDate = new Date(year, month, 0)
    const [startYear, startMonth, startDay] = employee.startDate.split("-").map(Number)
    const employeeStartDate = new Date(startYear, startMonth - 1, startDay)
    return periodEndDate < employeeStartDate
  }

  const getCellColor = (employee: SupervisionStatus, period: string) => {
    const [year, month] = period.split("-").map(Number)
    const periodStartDate = new Date(year, month - 1, 1)
    const periodEndDate = new Date(year, month, 0)
    const now = new Date()
    const currentPeriod = new Date(now.getFullYear(), now.getMonth(), 1)

    const exception = getException(employee.employeeId, period)
    if (exception) {
      const colors: Record<string, string> = {
        not_required: "bg-slate-200 text-slate-500 border border-slate-300",
        annual_leave: "bg-teal-50 text-teal-600 border border-teal-200",
        sick_leave: "bg-violet-50 text-violet-600 border border-violet-200",
      }
      return colors[exception.exceptionType]
    }

    if (employee.startDate) {
      const [startYear, startMonth, startDay] = employee.startDate.split("-").map(Number)
      const employeeStartDate = new Date(startYear, startMonth - 1, startDay)
      if (periodEndDate < employeeStartDate) {
        return "bg-slate-200 text-slate-500 border border-slate-300"
      }
    }

    if (employee.role === "Bank") return "bg-slate-50 text-slate-400 border border-slate-200"
    if (periodStartDate > currentPeriod) return "bg-slate-50 text-slate-400 border border-slate-200"

    const sups = supervisionMap.get(employee.employeeId)?.get(period) || []
    const completedSups = sups.filter((s) => s.isCompleted)
    const requiredCount = getRequiredCount(employee.employeeId, period)

    if (completedSups.length >= requiredCount) {
      return "bg-emerald-100 border border-emerald-200"
    }
    if (completedSups.length > 0) return "bg-amber-100 text-amber-700 border border-amber-300"
    if (periodStartDate > currentPeriod) return "bg-slate-100 text-slate-400"
    return "bg-rose-50 text-rose-400 border border-rose-200"
  }

  const getCellContent = (employee: SupervisionStatus, period: string) => {
    const exception = getException(employee.employeeId, period)
    if (exception) return exceptionLabels[exception.exceptionType]
    if (isBeforeStartDate(employee, period)) return ""

    const sups = supervisionMap.get(employee.employeeId)?.get(period) || []
    const completedCount = sups.filter((s) => s.isCompleted).length
    const plannedCount = sups.filter((s) => !s.isCompleted).length
    const requiredCount = getRequiredCount(employee.employeeId, period)

    const [year, month] = period.split("-").map(Number)
    const periodStart = new Date(year, month - 1, 1)
    const now = new Date()
    const currentPeriod = new Date(now.getFullYear(), now.getMonth(), 1)
    const isFuture = periodStart > currentPeriod

    if (isFuture) return plannedCount > 0 ? `${plannedCount}/${requiredCount}` : ""
    return completedCount > 0 ? completedCount.toString() : ""
  }

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  }

  const handleCellClick = (employee: SupervisionStatus, period: string) => {
    setSelectedEmployee(employee)
    setSelectedPeriod(period)
    setModalOpen(true)
  }

  const selectedSupervisions = useMemo(() => {
    if (!selectedEmployee || !selectedPeriod || !supervisions) return []
    return supervisions.filter(
      (s) => s.employeeId === selectedEmployee.employeeId && s.period === selectedPeriod
    )
  }, [selectedEmployee, selectedPeriod, supervisions])

  const selectedException = useMemo(() => {
    if (!selectedEmployee || !selectedPeriod) return null
    return getException(selectedEmployee.employeeId, selectedPeriod)
  }, [selectedEmployee, selectedPeriod, exceptionMap])

  const legend: LegendItem[] = [
    { color: "bg-emerald-100", borderColor: "border border-emerald-200", label: "Completed" },
    { color: "bg-amber-100", borderColor: "border border-amber-200", label: "Due Soon" },
    { color: "bg-red-100", borderColor: "border border-red-200", label: "Overdue/Missing" },
    { color: "bg-gray-200", borderColor: "border border-gray-300", label: "Exception" },
    { color: "bg-gray-100", borderColor: "border border-gray-200", label: "Future/N/A" },
  ]

  return (
    <>
      <DataGrid
        rows={filteredStatuses}
        columns={months}
        getRowKey={(emp) => emp.employeeId}
        loading={loadingSupervisions || loadingExceptions}
        legend={legend}
        toolbar={toolbar}
        navigation={navigation}
        cellWidth={120}
        cellHeight={56}
        rowLabelWidth={180}
        emptyMessage="No employees found."
        rowLabelHeader="Employee"
        renderRowLabel={(employee) => (
          <div
            className="cursor-pointer hover:text-primary truncate"
            onClick={() => navigate(`/employees/${employee.employeeId}?tab=supervision`)}
            title={`${employee.firstName} ${employee.lastName}`}
          >
            <div className="font-medium truncate">{employee.firstName} {employee.lastName}</div>
            <div className="text-xs text-muted-foreground truncate">{employee.role}</div>
          </div>
        )}
        renderCell={(employee, col) => {
          const period = col.key
          const sups = supervisionMap.get(employee.employeeId)?.get(period) || []
          const exception = getException(employee.employeeId, period)

          return (
            <CellContextMenu
              employee={employee}
              period={period}
              exception={exception}
              onRecordSupervision={() => handleCellClick(employee, period)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full h-full flex items-center justify-center">
                    {getCellContent(employee, period)}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <p className="font-semibold text-sm">{employee.firstName} {employee.lastName}</p>
                      <p className="opacity-70">{col.data.label}</p>
                    </div>
                    {isBeforeStartDate(employee, period) ? (
                      <div className="border-t pt-1.5">
                        <p className="font-medium">Not Required</p>
                        <p className="opacity-60">Before employment start date</p>
                      </div>
                    ) : exception ? (
                      <div className="border-t pt-1.5">
                        <p className="font-medium">{exceptionFullLabels[exception.exceptionType]}</p>
                        {exception.notes && <p className="opacity-60">{exception.notes}</p>}
                      </div>
                    ) : sups.length > 0 ? (
                      <div className="border-t pt-1.5 space-y-1">
                        {sups.map((sup, idx) => (
                          <div key={sup.id} className={idx > 0 ? "pt-1 border-t" : ""}>
                            <p>
                              <span className="opacity-60">{sup.isCompleted ? "Completed" : "Planned"}: </span>
                              {formatShortDate(sup.supervisionDate)}
                            </p>
                            <p><span className="opacity-60">By: </span>{sup.conductedByName}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-t pt-1.5">
                        <p className="opacity-60">No supervision recorded</p>
                        <p className="opacity-60 text-[10px]">Right-click for options</p>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </CellContextMenu>
          )
        }}
        onCellClick={(employee, col) => handleCellClick(employee, col.key)}
        getCellClassName={(employee, col) => getCellColor(employee, col.key)}
      />

      <MonthDetailsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        employee={selectedEmployee}
        period={selectedPeriod}
        supervisions={selectedSupervisions}
        exception={selectedException}
      />
    </>
  )
}
