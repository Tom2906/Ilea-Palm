import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SupervisionStatus, Supervision, SupervisionException, SupervisionRequirement } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MonthDetailsModal } from "./month-details-modal"
import { CellContextMenu } from "./cell-context-menu"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

// Map exception type to display label (empty for not_required to match start-date cells)
const exceptionLabels: Record<SupervisionException['exceptionType'], string> = {
  not_required: '',
  annual_leave: 'AL',
  sick_leave: 'S',
}

const exceptionFullLabels: Record<SupervisionException['exceptionType'], string> = {
  not_required: 'Not Required',
  annual_leave: 'Annual Leave',
  sick_leave: 'Sick Leave',
}

// Color classes for exception types
const exceptionColors: Record<SupervisionException['exceptionType'], string> = {
  not_required: 'bg-slate-200 text-slate-500 border border-slate-300',
  annual_leave: 'bg-teal-50 text-teal-600 border border-teal-200',
  sick_leave: 'bg-violet-50 text-violet-600 border border-violet-200',
}

interface CalendarHeatmapViewProps {
  filteredStatuses: SupervisionStatus[]
  monthOffset: number
}

export function CalendarHeatmapView({ filteredStatuses, monthOffset }: CalendarHeatmapViewProps) {
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

  // Generate 12 months: 10 back + 2 forward from current, adjustable by offset
  const months = useMemo(() => {
    const result = []
    const today = new Date()
    // Start 10 months back, end 2 months forward (12 total), shifted by offset
    const startOffset = -10 + monthOffset
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + startOffset + i, 1)
      const monthName = date.toLocaleDateString("en-GB", { month: "short" })
      const year = date.getFullYear()
      result.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: `${monthName} ${year}`,
      })
    }
    return result
  }, [monthOffset])

  // Build supervision map: employeeId -> period -> supervisions array
  const supervisionMap = useMemo(() => {
    if (!supervisions) return new Map()

    const map = new Map<string, Map<string, Supervision[]>>()
    supervisions.forEach((sup) => {
      if (!map.has(sup.employeeId)) {
        map.set(sup.employeeId, new Map())
      }
      const employeeMap = map.get(sup.employeeId)!
      if (!employeeMap.has(sup.period)) {
        employeeMap.set(sup.period, [])
      }
      employeeMap.get(sup.period)!.push(sup)
    })
    return map
  }, [supervisions])

  // Build exception map: "employeeId-period" -> exception
  const exceptionMap = useMemo(() => {
    if (!exceptions) return new Map<string, SupervisionException>()

    const map = new Map<string, SupervisionException>()
    exceptions.forEach((exc) => {
      const key = `${exc.employeeId}-${exc.period}`
      map.set(key, exc)
    })
    return map
  }, [exceptions])

  // Build requirements map: employeeId -> sorted requirements array (newest first)
  const requirementsMap = useMemo(() => {
    if (!requirements) return new Map<string, SupervisionRequirement[]>()

    const map = new Map<string, SupervisionRequirement[]>()
    requirements.forEach((req) => {
      if (!map.has(req.employeeId)) {
        map.set(req.employeeId, [])
      }
      map.get(req.employeeId)!.push(req)
    })
    // Sort each array by effectiveFrom descending (newest first)
    map.forEach((reqs) => {
      reqs.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
    })
    return map
  }, [requirements])

  // Get effective requirement count for an employee and period
  const getRequiredCount = (employeeId: string, period: string): number => {
    const reqs = requirementsMap.get(employeeId)
    if (!reqs || reqs.length === 0) return 1 // Default to 1 if no requirements set

    // Period is YYYY-MM, effectiveFrom is YYYY-MM-DD
    // Find the most recent requirement where effectiveFrom <= first of month
    const periodStart = period + "-01"
    for (const req of reqs) {
      if (req.effectiveFrom <= periodStart) {
        return req.requiredCount
      }
    }
    return 1 // Default if no requirement found before this period
  }

  const getException = (employeeId: string, period: string): SupervisionException | null => {
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

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  }

  const getCellColor = (employee: SupervisionStatus, period: string) => {
    const [year, month] = period.split("-").map(Number)
    const periodStartDate = new Date(year, month - 1, 1)
    const periodEndDate = new Date(year, month, 0) // Last day of the month
    const now = new Date()
    const currentPeriod = new Date(now.getFullYear(), now.getMonth(), 1)

    // Check for exception first - use specific colors per type
    const exception = getException(employee.employeeId, period)
    if (exception) {
      return exceptionColors[exception.exceptionType]
    }

    // Parse employee start date (format: YYYY-MM-DD) if available
    // Use same darker grey as not_required for consistency
    if (employee.startDate) {
      const [startYear, startMonth, startDay] = employee.startDate.split("-").map(Number)
      const employeeStartDate = new Date(startYear, startMonth - 1, startDay)

      // Darker grey if entire month is before employment start date (matches not_required)
      if (periodEndDate < employeeStartDate) {
        return "bg-slate-200 text-slate-500 border border-slate-300"
      }
    }

    // Lighter grey if Bank employee (no supervision required) or future month
    if (employee.role === "Bank") {
      return "bg-slate-50 text-slate-400 border border-slate-200"
    }

    // Lighter grey if future month
    if (periodStartDate > currentPeriod) {
      return "bg-slate-50 text-slate-400 border border-slate-200"
    }

    const sups = supervisionMap.get(employee.employeeId)?.get(period) || []
    const completedSups = sups.filter((s: Supervision) => s.isCompleted)
    const plannedSups = sups.filter((s: Supervision) => !s.isCompleted)
    // Get requirement from requirements table
    const requiredCount = getRequiredCount(employee.employeeId, period)
    const isFutureMonth = periodStartDate > currentPeriod

    // Check if requirement is met with completed supervisions
    if (completedSups.length >= requiredCount) {
      return "bg-emerald-500 text-white border border-emerald-600 shadow-sm" // Requirement fully met
    }

    // Some completed but not enough
    if (completedSups.length > 0) {
      return "bg-amber-100 text-amber-700 border border-amber-300" // Partial completion
    }

    // Future month - just grey
    if (isFutureMonth) {
      return "bg-slate-100 text-slate-400"
    }

    // Past/current month with no completed supervisions = overdue/missing
    return "bg-rose-50 text-rose-400 border border-rose-200" // Missing/Overdue
  }

  const getCellContent = (employee: SupervisionStatus, period: string) => {
    // Check for exception first
    const exception = getException(employee.employeeId, period)
    if (exception) {
      return exceptionLabels[exception.exceptionType]
    }

    // Check if before start date - show nothing (consistent with not_required)
    if (employee.startDate) {
      const [year, month] = period.split("-").map(Number)
      const periodEndDate = new Date(year, month, 0)
      const [startYear, startMonth, startDay] = employee.startDate.split("-").map(Number)
      const employeeStartDate = new Date(startYear, startMonth - 1, startDay)
      if (periodEndDate < employeeStartDate) {
        return ""
      }
    }

    const sups = supervisionMap.get(employee.employeeId)?.get(period) || []
    const completedCount = sups.filter((s: Supervision) => s.isCompleted).length
    const plannedCount = sups.filter((s: Supervision) => !s.isCompleted).length
    const requiredCount = getRequiredCount(employee.employeeId, period)

    // Check if future month
    const [year, month] = period.split("-").map(Number)
    const periodStart = new Date(year, month - 1, 1)
    const now = new Date()
    const currentPeriod = new Date(now.getFullYear(), now.getMonth(), 1)
    const isFuture = periodStart > currentPeriod

    // Future months: show planned/required
    if (isFuture) {
      if (plannedCount > 0) {
        return `${plannedCount}/${requiredCount}`
      }
      return ""
    }

    // Past/current: show completed count
    if (completedCount > 0) {
      return completedCount.toString()
    }
    return ""
  }

  const handleCellClick = (employee: SupervisionStatus, period: string) => {
    setSelectedEmployee(employee)
    setSelectedPeriod(period)
    setModalOpen(true)
  }

  // Get supervisions for selected cell
  const selectedSupervisions = useMemo(() => {
    if (!selectedEmployee || !selectedPeriod || !supervisions) return []
    return supervisions.filter(
      s => s.employeeId === selectedEmployee.employeeId && s.period === selectedPeriod
    )
  }, [selectedEmployee, selectedPeriod, supervisions])

  // Get exception for selected cell
  const selectedException = useMemo(() => {
    if (!selectedEmployee || !selectedPeriod) return null
    return getException(selectedEmployee.employeeId, selectedPeriod)
  }, [selectedEmployee, selectedPeriod, exceptionMap])

  if (loadingSupervisions || loadingExceptions) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="sticky left-0 bg-gray-50 z-10 p-2 text-left font-semibold text-muted-foreground min-w-[200px]">
                Employee
              </th>
              {months.map((month) => (
                <th key={month.key} className="p-1 text-center font-semibold text-muted-foreground text-xs">
                  <div className="w-12 mx-auto">{month.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStatuses.map((employee) => (
              <tr key={employee.employeeId} className="border-b group hover:bg-gray-50">
                <td className="sticky left-0 bg-white group-hover:bg-gray-50 z-10 p-2 transition-colors">
                  <div
                    className="cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/employees/${employee.employeeId}?tab=supervision`)}
                  >
                    <div className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{employee.role}</div>
                  </div>
                </td>
                {months.map((month) => {
                  const sups = supervisionMap.get(employee.employeeId)?.get(month.key) || []
                  const exception = getException(employee.employeeId, month.key)
                  return (
                    <td key={month.key} className="p-1 text-center">
                      <CellContextMenu
                        employee={employee}
                        period={month.key}
                        exception={exception}
                        onRecordSupervision={() => handleCellClick(employee, month.key)}
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => handleCellClick(employee, month.key)}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`w-12 h-12 mx-auto rounded-md flex items-center justify-center font-semibold text-xs transition-all hover:scale-105 hover:shadow-md ${getCellColor(
                                  employee,
                                  month.key
                                )}`}
                              >
                                {getCellContent(employee, month.key)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <div className="space-y-1.5 text-xs">
                                <div>
                                  <p className="font-semibold text-sm">
                                    {employee.firstName} {employee.lastName}
                                  </p>
                                  <p className="opacity-70">{month.label}</p>
                                </div>
                                {isBeforeStartDate(employee, month.key) ? (
                                  <div className="border-t pt-1.5">
                                    <p className="font-medium">Not Required</p>
                                    <p className="opacity-60">Before employment start date</p>
                                  </div>
                                ) : exception ? (
                                  <div className="border-t pt-1.5">
                                    <p className="font-medium">{exceptionFullLabels[exception.exceptionType]}</p>
                                    {exception.notes && (
                                      <p className="opacity-60">{exception.notes}</p>
                                    )}
                                    {exception.createdByName && (
                                      <p className="opacity-60 text-[10px]">
                                        Set by {exception.createdByName}
                                      </p>
                                    )}
                                  </div>
                                ) : sups.length > 0 ? (
                                  <div className="border-t pt-1.5 space-y-1">
                                    {sups.map((sup: Supervision, idx: number) => (
                                      <div key={sup.id} className={idx > 0 ? "pt-1 border-t" : ""}>
                                        <p>
                                          <span className="opacity-60">{sup.isCompleted ? "Completed" : "Planned"}: </span>
                                          {formatShortDate(sup.supervisionDate)}
                                        </p>
                                        <p>
                                          <span className="opacity-60">By: </span>
                                          {sup.conductedByName}
                                        </p>
                                        {sup.notes && (
                                          <p>
                                            <span className="opacity-60">Notes: </span>
                                            {sup.notes}
                                          </p>
                                        )}
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
                        </div>
                      </CellContextMenu>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <MonthDetailsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        employee={selectedEmployee}
        period={selectedPeriod}
        supervisions={selectedSupervisions}
        exception={selectedException}
      />
    </div>
  )
}
