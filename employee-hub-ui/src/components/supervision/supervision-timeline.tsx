import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Supervision, SupervisionException, SupervisionStatus, SupervisionRequirement } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ListRow } from "@/components/list-row"
import { RecordSupervisionModal } from "./record-supervision-modal"
import { SupervisionSettingsModal } from "./supervision-settings-modal"
import { Plus, Calendar, AlertCircle, Settings, ChevronLeft, ChevronRight } from "lucide-react"

interface SupervisionTimelineProps {
  employeeId: string
  employeeName: string
  reportsTo: string | null
  startDate?: string
}

const EXCEPTION_LABELS: Record<string, string> = {
  annual_leave: "Annual Leave",
  sick_leave: "Sick Leave",
  not_required: "Not Required",
}

// Same colors as calendar-heatmap-view.tsx
const exceptionColors: Record<string, string> = {
  not_required: "bg-slate-200 text-slate-500 border border-slate-300",
  annual_leave: "bg-teal-50 text-teal-600 border border-teal-200",
  sick_leave: "bg-violet-50 text-violet-600 border border-violet-200",
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatPeriod(period: string): string {
  const [year, month] = period.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
}

function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function SupervisionTimeline({
  employeeId,
  employeeName,
  reportsTo,
  startDate,
}: SupervisionTimelineProps) {
  const [recordOpen, setRecordOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod())

  const { data: supervisions, isLoading: loadingSupervisions } = useQuery({
    queryKey: ["supervisions", "employee", employeeId],
    queryFn: () => api.get<Supervision[]>(`/supervisions/employee/${employeeId}`),
    enabled: !!employeeId,
  })

  const { data: exceptions, isLoading: loadingExceptions } = useQuery({
    queryKey: ["supervision-exceptions", "employee", employeeId],
    queryFn: () => api.get<SupervisionException[]>(`/supervision-exceptions/employee/${employeeId}`),
    enabled: !!employeeId,
  })

  const { data: requirements } = useQuery({
    queryKey: ["supervision-requirements", "employee", employeeId],
    queryFn: () => api.get<SupervisionRequirement[]>(`/supervision-requirements/employee/${employeeId}`),
    enabled: !!employeeId,
  })

  const isLoading = loadingSupervisions || loadingExceptions

  // Generate 12 months - same logic as calendar-heatmap-view.tsx
  const months = useMemo(() => {
    const result = []
    const today = new Date()
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

  // Build supervision map: period -> supervisions[]
  const supervisionMap = useMemo(() => {
    const map = new Map<string, Supervision[]>()
    supervisions?.forEach((s) => {
      if (!map.has(s.period)) map.set(s.period, [])
      map.get(s.period)!.push(s)
    })
    return map
  }, [supervisions])

  // Build exception map: period -> exception
  const exceptionMap = useMemo(() => {
    const map = new Map<string, SupervisionException>()
    exceptions?.forEach((e) => map.set(e.period, e))
    return map
  }, [exceptions])

  // Get effective requirement for a period
  const getRequiredCount = (period: string): number => {
    if (!requirements || requirements.length === 0) return 1
    const periodStart = period + "-01"
    for (const req of requirements) {
      if (req.effectiveFrom <= periodStart) {
        return req.requiredCount
      }
    }
    return 1
  }

  // Get cell color - SAME logic as calendar-heatmap-view.tsx
  const getCellColor = (period: string): string => {
    const [year, month] = period.split("-").map(Number)
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0)
    const now = new Date()
    const currentPeriod = new Date(now.getFullYear(), now.getMonth(), 1)

    // Exception
    const exception = exceptionMap.get(period)
    if (exception) {
      return exceptionColors[exception.exceptionType]
    }

    // Before start date
    if (startDate) {
      const empStart = new Date(startDate)
      if (periodEnd < empStart) return "bg-slate-200 text-slate-500 border border-slate-300"
    }

    const sups = supervisionMap.get(period) || []
    const completed = sups.filter((s) => s.isCompleted).length
    const required = getRequiredCount(period)

    // Future month - just grey
    if (periodStart > currentPeriod) {
      return "bg-slate-100 text-slate-400"
    }

    if (completed >= required) return "bg-emerald-500 text-white border border-emerald-600 shadow-sm"
    if (completed > 0) return "bg-amber-100 text-amber-700 border border-amber-300"
    return "bg-rose-50 text-rose-400 border border-rose-200"
  }

  // Get cell content - SAME logic as calendar-heatmap-view.tsx
  const getCellContent = (period: string): string => {
    const [year, month] = period.split("-").map(Number)
    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0)
    const now = new Date()
    const currentPeriod = new Date(now.getFullYear(), now.getMonth(), 1)
    const isFuture = periodStart > currentPeriod

    const exception = exceptionMap.get(period)
    if (exception) {
      if (exception.exceptionType === "annual_leave") return "AL"
      if (exception.exceptionType === "sick_leave") return "S"
      return ""
    }

    if (startDate && periodEnd < new Date(startDate)) {
      return ""
    }

    const sups = supervisionMap.get(period) || []
    const completed = sups.filter((s) => s.isCompleted).length
    const planned = sups.filter((s) => !s.isCompleted).length
    const required = getRequiredCount(period)

    // Future months: show planned/required
    if (isFuture) {
      if (planned > 0) {
        return `${planned}/${required}`
      }
      return ""
    }

    // Past/current: show completed count
    if (completed > 0) return completed.toString()
    return ""
  }

  // Supervisions and exceptions for selected period
  const selectedSupervisions = supervisions?.filter((s) => s.period === selectedPeriod) || []
  const selectedException = exceptionMap.get(selectedPeriod)
  const selectedRequired = getRequiredCount(selectedPeriod)

  const modalEmployee: SupervisionStatus = {
    employeeId,
    firstName: employeeName.split(" ")[0] || "",
    lastName: employeeName.split(" ").slice(1).join(" ") || "",
    email: "",
    role: "",
    department: null,
    reportsTo,
    supervisionFrequency: 1,
    supervisorName: null,
    lastSupervisionDate: null,
    daysSinceLastSupervision: null,
    status: "OK",
    startDate: startDate || "",
    employeeStatus: null,
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Navigation + Table - same structure as matrix */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setMonthOffset((p) => p - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <table className="flex-1 text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              {months.map((month) => (
                <th key={month.key} className="p-1 text-center font-semibold text-muted-foreground text-xs">
                  <div className="w-12 mx-auto">{month.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {months.map((month) => (
                <td key={month.key} className="p-1 text-center">
                  <div
                    className="cursor-pointer"
                    onClick={() => setSelectedPeriod(month.key)}
                  >
                    <div
                      className={`w-12 h-12 mx-auto rounded-md flex items-center justify-center font-semibold text-xs transition-all hover:scale-105 hover:shadow-md ${getCellColor(month.key)} ${
                        selectedPeriod === month.key ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-md" : ""
                      }`}
                    >
                      {getCellContent(month.key)}
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <Button variant="outline" size="sm" onClick={() => setMonthOffset((p) => p + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Header for selected month */}
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          <h3 className="font-medium">{formatPeriod(selectedPeriod)}</h3>
          <p className="text-sm text-muted-foreground">
            {selectedSupervisions.filter((s) => s.isCompleted).length} of {selectedRequired} required
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setRecordOpen(true)}>
            <Plus className="h-4 w-4" />
            Record
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* List for selected month */}
      <div className="space-y-2">
        {selectedException && (
          <ListRow>
            <AlertCircle className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium">{EXCEPTION_LABELS[selectedException.exceptionType]}</span>
              {selectedException.notes && (
                <p className="text-sm text-muted-foreground">{selectedException.notes}</p>
              )}
            </div>
          </ListRow>
        )}
        {selectedSupervisions.length === 0 && !selectedException ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No supervisions recorded for this month.
          </p>
        ) : (
          selectedSupervisions.map((s) => (
            <ListRow key={s.id}>
              <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatDate(s.supervisionDate)}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    s.isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {s.isCompleted ? "Completed" : "Planned"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Conducted by: {s.conductedByName}
                </p>
                {s.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{s.notes}</p>
                )}
              </div>
            </ListRow>
          ))
        )}
      </div>

      <RecordSupervisionModal
        open={recordOpen}
        onOpenChange={setRecordOpen}
        employee={modalEmployee}
        period={selectedPeriod}
      />

      <SupervisionSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        employeeId={employeeId}
        employeeName={employeeName}
      />
    </div>
  )
}
