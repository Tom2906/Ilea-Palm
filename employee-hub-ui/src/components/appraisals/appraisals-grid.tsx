import { useState, useMemo, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import type { AppraisalMatrixRow, AppraisalCellData, CompanySettings } from "@/lib/types"
import { DataGrid } from "@/components/data-grid"
import type { Column, HeaderGroup, LegendItem, SummaryColumn } from "@/components/data-grid"
import { FilterBar } from "@/components/filter-bar"
import { AppraisalModal } from "./appraisal-modal"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

interface ReviewColumn {
  position: number
  label: string
  section: "past" | "upcoming"
}

const allStatuses = ["Completed", "Due Soon", "Overdue", "Not Yet Due"] as const

const statusLabels: Record<string, string> = {
  completed: "Completed",
  due_soon: "Due Soon",
  overdue: "Overdue",
  not_yet_due: "Not Yet Due",
}

const statusToFilter: Record<string, string> = {
  completed: "Completed",
  due_soon: "Due Soon",
  overdue: "Overdue",
  not_yet_due: "Not Yet Due",
}

const legend: LegendItem[] = [
  { color: "bg-emerald-100", borderColor: "border border-emerald-200", label: "Completed" },
  { color: "bg-amber-100", borderColor: "border border-amber-200", label: "Due Soon" },
  { color: "bg-red-100", borderColor: "border border-red-200", label: "Overdue" },
  { color: "bg-gray-100", borderColor: "border border-gray-200", label: "Not Yet Due" },
]

interface AppraisalsGridProps {
  rows: AppraisalMatrixRow[]
  reviewsBack: number
  loading: boolean
  settings?: CompanySettings
}

export function AppraisalsGrid({ rows, reviewsBack, loading, settings }: AppraisalsGridProps) {
  const navigate = useNavigate()
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [defaultsApplied, setDefaultsApplied] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"edit" | "schedule" | "new">("edit")
  const [selectedRow, setSelectedRow] = useState<AppraisalMatrixRow | null>(null)
  const [selectedCell, setSelectedCell] = useState<AppraisalCellData | null>(null)

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

  const totalReviews = rows[0]?.reviews.length ?? 0
  const reviewsForward = totalReviews - reviewsBack

  const headerGroups = useMemo<HeaderGroup[]>(() => {
    if (totalReviews === 0) return []
    return [
      ...(reviewsBack > 0 ? [{ label: "Previous", span: reviewsBack, className: "!text-sm text-muted-foreground border-r-2 border-r-primary/30" }] : []),
      ...(reviewsForward > 0 ? [{ label: "Upcoming", span: reviewsForward, className: "!text-sm text-foreground" }] : []),
    ]
  }, [totalReviews, reviewsBack, reviewsForward])

  const columns = useMemo<Column<ReviewColumn>[]>(() => {
    if (totalReviews === 0) return []

    return Array.from({ length: totalReviews }, (_, i) => {
      const isPast = i < reviewsBack
      const sectionIndex = isPast ? i + 1 : i - reviewsBack + 1
      const label = isPast ? `Past ${sectionIndex}` : `Upcoming ${sectionIndex}`

      return {
        key: `review-${i}`,
        data: { position: i, label, section: isPast ? "past" as const : "upcoming" as const },
        header: null,
      }
    })
  }, [totalReviews, reviewsBack])

  // Determine which statuses each row has (for status filtering)
  const getRowStatuses = useCallback((row: AppraisalMatrixRow): Set<string> => {
    const statuses = new Set<string>()
    for (const r of row.reviews) {
      if (r) statuses.add(statusToFilter[r.status])
    }
    return statuses
  }, [])

  const filteredRows = useMemo(() => {
    const hiddenStatuses = new Set<string>()
    for (const h of hidden) {
      if (h.startsWith("status:")) hiddenStatuses.add(h.replace("status:", ""))
    }

    return rows.filter((r) => {
      if (hidden.has(`emp:${r.employeeId}`)) return false
      if (r.role && hidden.has(`role:${r.role}`)) return false
      if (r.employeeStatus && hidden.has(`empStatus:${r.employeeStatus}`)) return false

      if (hiddenStatuses.size > 0) {
        const rowStatuses = getRowStatuses(r)
        const allHidden = [...rowStatuses].every((s) => hiddenStatuses.has(s))
        if (rowStatuses.size > 0 && allHidden) return false
      }

      return true
    })
  }, [rows, hidden, getRowStatuses])

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

  const roles = useMemo(() => {
    const unique = [...new Set(rows.map((r) => r.role).filter(Boolean))]
    return unique.sort()
  }, [rows])

  const roleItems = useMemo(
    () => roles.map((r) => ({
      id: `role:${r}`,
      label: r,
    })),
    [roles],
  )

  const employeeStatuses = useMemo(() => {
    const unique = [...new Set(rows.map((r) => r.employeeStatus).filter(Boolean))] as string[]
    return unique.sort()
  }, [rows])

  const employeeStatusItems = useMemo(
    () => employeeStatuses.map((s) => ({
      id: `empStatus:${s}`,
      label: s,
    })),
    [employeeStatuses],
  )

  const employeeItems = useMemo(
    () => rows.map((r) => ({
      id: `emp:${r.employeeId}`,
      label: `${r.firstName} ${r.lastName}`,
    })),
    [rows]
  )

  const getReviewForPosition = (row: AppraisalMatrixRow, position: number): AppraisalCellData | null => {
    return row.reviews[position] ?? null
  }

  const getCellColor = (_row: AppraisalMatrixRow, col: Column<ReviewColumn>): string => {
    const review = getReviewForPosition(_row, col.data.position)
    if (!review) return "bg-slate-50 text-slate-400 border border-slate-200"

    const divider = col.data.position === reviewsBack ? "border-l-2 border-l-primary/30 " : ""

    switch (review.status) {
      case "completed":
        return divider + "bg-emerald-100 border border-emerald-200"
      case "due_soon":
        return divider + "bg-amber-100 text-amber-700 border border-amber-300"
      case "overdue":
        return divider + "bg-rose-50 text-rose-600 border border-rose-200"
      default:
        return divider + "bg-gray-100 text-gray-500 border border-gray-200"
    }
  }

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`
  }

  const handleCellClick = (row: AppraisalMatrixRow, col: Column<ReviewColumn>) => {
    const review = getReviewForPosition(row, col.data.position)

    if (review) {
      // Edit existing review
      setSelectedRow(row)
      setSelectedCell(review)
      setModalMode("edit")
      setModalOpen(true)
    } else if (col.data.section === "upcoming") {
      // Schedule into empty upcoming slot
      setSelectedRow(row)
      setSelectedCell(null)
      setModalMode("schedule")
      setModalOpen(true)
    }
  }

  const handleAddClick = (row: AppraisalMatrixRow) => {
    setSelectedRow(row)
    setSelectedCell(null)
    setModalMode("new")
    setModalOpen(true)
  }

  const summaryColumns = useMemo<SummaryColumn<AppraisalMatrixRow>[]>(
    () => [
      {
        key: "add",
        header: null,
        width: 44,
        render: (row) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            onClick={() => handleAddClick(row)}
            title="Add appraisal"
          >
            <Plus className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [],
  )

  const filterGroups = useMemo(() => [
    { label: "Status", items: statusItems },
    { label: "Role", items: roleItems },
    { label: "Employee Status", items: employeeStatusItems },
    { label: "Employees", items: employeeItems },
  ], [statusItems, roleItems, employeeStatusItems, employeeItems])

  return (
    <div className="h-full flex flex-col gap-4">
      <DataGrid
        rows={filteredRows}
        columns={columns}
        headerGroups={headerGroups}
        getRowKey={(row) => row.employeeId}
        loading={loading}
        legend={legend}
        toolbar={
          <FilterBar
            filters={filterGroups}
            hidden={hidden}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onClear={() => setHidden(new Set())}
          />
        }
        cellWidth={140}
        cellHeight={56}
        rowLabelWidth={180}
        emptyMessage="No employees found."
        rowLabelHeader="Employee"
        summaryColumns={summaryColumns}
        renderRowLabel={(row) => (
          <div
            className="cursor-pointer hover:text-primary truncate"
            onClick={() => navigate(`/employees/${row.employeeId}`)}
            title={`${row.firstName} ${row.lastName}`}
          >
            <div className="font-medium truncate">{row.firstName} {row.lastName}</div>
            <div className="text-xs text-muted-foreground truncate">{row.role}</div>
          </div>
        )}
        renderCell={(row, col) => {
          const review = getReviewForPosition(row, col.data.position)
          if (!review) return null

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full h-full flex flex-col items-center justify-center leading-tight">
                  <div className="text-[11px] font-semibold">#{review.reviewNumber}</div>
                  <div className="text-[10px]">{formatShortDate(review.completedDate ?? review.dueDate)}</div>
                  <div className="text-[9px] mt-0.5 opacity-70">{statusLabels[review.status]}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="space-y-1.5 text-xs">
                  <div>
                    <p className="font-semibold text-sm">{row.firstName} {row.lastName}</p>
                    <p className="opacity-70">Review #{review.reviewNumber}</p>
                  </div>
                  <div className="border-t pt-1.5 space-y-0.5">
                    <p>
                      <span className="opacity-60">Status: </span>
                      {statusLabels[review.status]}
                    </p>
                    <p>
                      <span className="opacity-60">Due: </span>
                      {formatDate(review.dueDate)}
                    </p>
                    {review.completedDate && (
                      <p>
                        <span className="opacity-60">Completed: </span>
                        {formatDate(review.completedDate)}
                      </p>
                    )}
                    {review.conductedByName && (
                      <p>
                        <span className="opacity-60">Conducted by: </span>
                        {review.conductedByName}
                      </p>
                    )}
                    {review.notes && (
                      <p>
                        <span className="opacity-60">Notes: </span>
                        {review.notes}
                      </p>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        }}
        onCellClick={handleCellClick}
        getCellClassName={getCellColor}
      />

      <AppraisalModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        row={selectedRow}
        cell={selectedCell}
      />
    </div>
  )
}
