import { useState, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import type { AppraisalMatrixRow, AppraisalMilestone } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { FilterDropdown } from "@/components/filter-dropdown"
import { MarkCompleteModal } from "./mark-complete-modal"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { X } from "lucide-react"
import { formatDate } from "@/lib/format"

// Milestone types in display order
const MILESTONE_TYPES = [
  { type: "3_month", label: "3 Month" },
  { type: "6_month_probation", label: "6 Month Probation" },
  { type: "9_month", label: "9 Month" },
  { type: "12_month", label: "12 Month" },
  { type: "year2_3month", label: "Year 2 - 3 Month" },
  { type: "year2_6month", label: "Year 2 - 6 Month" },
  { type: "year2_9month", label: "Year 2 - 9 Month" },
  { type: "year2_annual", label: "Year 2 - Annual" },
  { type: "year3_3month", label: "Year 3 - 3 Month" },
  { type: "year3_6month", label: "Year 3 - 6 Month" },
  { type: "year3_9month", label: "Year 3 - 9 Month" },
  { type: "year3_appraisal", label: "Year 3 - Appraisal" },
] as const

const allStatuses = ["completed", "due_soon", "overdue", "not_yet_due"] as const

const statusLabels: Record<string, string> = {
  completed: "Completed",
  due_soon: "Due Soon",
  overdue: "Overdue",
  not_yet_due: "Not Yet Due",
}

const cellColors: Record<string, string> = {
  completed: "bg-emerald-100",
  due_soon: "bg-amber-100",
  overdue: "bg-red-100",
  not_yet_due: "bg-gray-50",
}

interface AppraisalsMatrixProps {
  rows: AppraisalMatrixRow[]
  loading: boolean
}

function formatShortDate(dateStr: string | null) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`
}

export function AppraisalsMatrix({ rows, loading }: AppraisalsMatrixProps) {
  const navigate = useNavigate()
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [selectedMilestone, setSelectedMilestone] = useState<AppraisalMilestone | null>(null)
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("")
  const [modalOpen, setModalOpen] = useState(false)

  const hasStatusFilter = allStatuses.some((s) => hidden.has(`status:${s}`))

  // Build a map for quick milestone lookup
  const milestoneMap = useMemo(() => {
    const map = new Map<string, AppraisalMilestone>()
    rows.forEach((row) => {
      row.milestones.forEach((m) => {
        if (!hidden.has(`status:${m.status}`)) {
          map.set(`${row.employeeId}-${m.milestoneType}`, m)
        }
      })
    })
    return map
  }, [rows, hidden])

  // Filter employees
  const filteredRows = useMemo(() => {
    const byId = rows.filter((r) => !hidden.has(`emp:${r.employeeId}`))
    if (!hasStatusFilter) return byId
    return byId.filter((r) =>
      MILESTONE_TYPES.some((mt) => !hidden.has(`milestone:${mt.type}`) && milestoneMap.has(`${r.employeeId}-${mt.type}`))
    )
  }, [rows, hidden, hasStatusFilter, milestoneMap])

  // Filter milestone types
  const filteredMilestoneTypes = useMemo(() => {
    const byId = MILESTONE_TYPES.filter((mt) => !hidden.has(`milestone:${mt.type}`))
    if (!hasStatusFilter) return byId
    return byId.filter((mt) =>
      filteredRows.some((r) => milestoneMap.has(`${r.employeeId}-${mt.type}`))
    )
  }, [hidden, hasStatusFilter, filteredRows, milestoneMap])

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

  const employeeItems = useMemo(
    () => rows.map((r) => ({
      id: `emp:${r.employeeId}`,
      label: `${r.firstName} ${r.lastName}`,
    })),
    [rows]
  )

  const milestoneItems = useMemo(
    () => MILESTONE_TYPES.map((mt) => ({
      id: `milestone:${mt.type}`,
      label: mt.label,
    })),
    []
  )

  const statusItems = useMemo(
    () => allStatuses.map((s) => ({
      id: `status:${s}`,
      label: statusLabels[s],
    })),
    []
  )

  const handleCellClick = (row: AppraisalMatrixRow, milestone: AppraisalMilestone) => {
    setSelectedMilestone(milestone)
    setSelectedEmployeeName(`${row.firstName} ${row.lastName}`)
    setModalOpen(true)
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4">
        <div className="flex gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-200" />
          <span>Due Soon (within 30 days)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" />
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-50 border border-gray-200" />
          <span>Not Yet Due</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5">
        <FilterDropdown
          label="Employees"
          items={employeeItems}
          hidden={hidden}
          onToggle={toggle}
          onToggleAll={toggleAll}
        />
        <FilterDropdown
          label="Milestones"
          items={milestoneItems}
          hidden={hidden}
          onToggle={toggle}
          onToggleAll={toggleAll}
        />
        <FilterDropdown
          label="Status"
          items={statusItems}
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

      {/* Matrix Table */}
      {filteredRows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No employees found. Appraisal milestones are generated when employees are created.
        </p>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="rounded-lg border overflow-hidden flex flex-col min-h-0">
            <div
              className="flex-1 min-h-0"
              style={{ overflow: "auto", scrollbarWidth: "thin", scrollbarGutter: "stable" }}
            >
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-30 border-b">
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 z-40 bg-gray-50 text-left text-sm font-semibold text-muted-foreground px-4 py-3 max-w-[200px] w-[200px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                      Employee
                    </th>
                    {filteredMilestoneTypes.map((mt) => (
                      <th key={mt.type} className="text-center px-2 py-3 min-w-[100px]">
                        <span className="text-xs font-semibold text-muted-foreground leading-tight">
                          {mt.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.employeeId} className="border-b hover:bg-muted/20 transition-colors">
                      <td
                        className="sticky left-0 z-10 bg-white px-4 py-2.5 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] max-w-[200px] w-[200px]"
                      >
                        <button
                          className="text-left hover:underline cursor-pointer"
                          onClick={() => navigate(`/employees/${row.employeeId}`)}
                        >
                          <div className="text-sm font-medium truncate">
                            {row.firstName} {row.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {row.role}
                          </div>
                        </button>
                      </td>
                      {filteredMilestoneTypes.map((mt) => {
                        const milestone = milestoneMap.get(`${row.employeeId}-${mt.type}`)

                        if (!milestone) {
                          return (
                            <td key={mt.type} className="text-center text-xs px-1 py-2.5 bg-gray-50/50">
                              <span className="text-muted-foreground/40">-</span>
                            </td>
                          )
                        }

                        return (
                          <td
                            key={mt.type}
                            className={`text-center text-xs px-1 py-2.5 ${cellColors[milestone.status]} cursor-pointer hover:opacity-80`}
                            onClick={() => handleCellClick(row, milestone)}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="leading-tight">
                                  {milestone.completedDate ? (
                                    <div>{formatShortDate(milestone.completedDate)}</div>
                                  ) : (
                                    <div>{formatShortDate(milestone.dueDate)}</div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <div className="space-y-1.5 text-xs">
                                  <div>
                                    <p className="font-semibold text-sm">
                                      {row.firstName} {row.lastName}
                                    </p>
                                    <p className="opacity-70">{milestone.milestoneLabel}</p>
                                  </div>
                                  <div className="border-t pt-1.5 space-y-0.5">
                                    <p>
                                      <span className="opacity-60">Status: </span>
                                      {statusLabels[milestone.status]}
                                    </p>
                                    <p>
                                      <span className="opacity-60">Due: </span>
                                      {formatDate(milestone.dueDate)}
                                    </p>
                                    {milestone.completedDate && (
                                      <p>
                                        <span className="opacity-60">Completed: </span>
                                        {formatDate(milestone.completedDate)}
                                      </p>
                                    )}
                                    {milestone.conductedByName && (
                                      <p>
                                        <span className="opacity-60">Conducted by: </span>
                                        {milestone.conductedByName}
                                      </p>
                                    )}
                                    {milestone.notes && (
                                      <p>
                                        <span className="opacity-60">Notes: </span>
                                        {milestone.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <MarkCompleteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        milestone={selectedMilestone}
        employeeName={selectedEmployeeName}
      />
    </div>
  )
}
