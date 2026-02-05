import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { formatDate } from "@/lib/format"
import type { Employee, TrainingCourse, TrainingStatus } from "@/lib/types"
import { DataGrid } from "@/components/data-grid"
import type { Column, LegendItem } from "@/components/data-grid"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

const cellColors: Record<string, string> = {
  Valid: "bg-emerald-100 border border-emerald-200",
  Completed: "bg-emerald-100 border border-emerald-200",
  "Expiring Soon": "bg-amber-100 border border-amber-200",
  Expired: "bg-red-100 border border-red-200",
  "Not Completed": "bg-gray-50 border border-gray-200",
}

function formatShortDate(dateStr: string | null) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`
}

interface TrainingMatrixV2Props {
  employees: Employee[]
  courses: TrainingCourse[]
  statusMap: Map<string, TrainingStatus>
  loading?: boolean
}

export function TrainingMatrixV2({
  employees,
  courses,
  statusMap,
  loading = false,
}: TrainingMatrixV2Props) {
  const navigate = useNavigate()

  // Columns are employees
  const employeeColumns = useMemo<Column<Employee>[]>(() => {
    return employees.map((emp) => ({
      key: emp.id,
      data: emp,
      header: (
        <button
          className="w-full text-center hover:underline cursor-pointer leading-tight overflow-hidden"
          onClick={() => navigate(`/employees/${emp.id}`)}
          title={`${emp.firstName} ${emp.lastName}`}
        >
          <div className="truncate">{emp.firstName}</div>
          <div className="truncate">{emp.lastName}</div>
        </button>
      ),
    }))
  }, [employees, navigate])

  const legend: LegendItem[] = [
    { color: "bg-emerald-100", borderColor: "border border-emerald-200", label: "Valid / Completed" },
    { color: "bg-amber-100", borderColor: "border border-amber-200", label: "Expiring Soon" },
    { color: "bg-red-100", borderColor: "border border-red-200", label: "Expired" },
    { color: "bg-gray-50", borderColor: "border border-gray-200", label: "Not Completed" },
  ]

  return (
    <DataGrid
      rows={courses}
      columns={employeeColumns}
      getRowKey={(course) => course.id}
      loading={loading}
      legend={legend}
      cellWidth={120}
      cellHeight={56}
      rowLabelWidth={180}
      emptyMessage="No courses in this category"
      rowLabelHeader="Course"
      renderRowLabel={(course) => (
        <div className="truncate" title={course.name}>
          <div className="font-medium">{course.name}</div>
        </div>
      )}
      renderCell={(course, col) => {
        const emp = col.data
        const status = statusMap.get(`${emp.id}-${course.id}`)
        const st = status?.status ?? "Not Completed"

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full h-full flex flex-col items-center justify-center cursor-default text-xs leading-tight">
                {status?.completionDate && (
                  <div>{formatShortDate(status.completionDate)}</div>
                )}
                {status?.expiryDate && (
                  <div className="opacity-60">{formatShortDate(status.expiryDate)}</div>
                )}
                {!status?.completionDate && !status?.expiryDate && (
                  <span className="text-muted-foreground/40">—</span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="space-y-1.5 text-xs">
                <div>
                  <p className="font-semibold text-sm">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="opacity-70">{course.name}</p>
                </div>
                <div className="border-t pt-1.5 space-y-0.5">
                  <p>
                    <span className="opacity-60">Status: </span>
                    {st}
                  </p>
                  {status?.completionDate && (
                    <p>
                      <span className="opacity-60">Completed: </span>
                      {formatDate(status.completionDate)}
                    </p>
                  )}
                  {status?.expiryDate && (
                    <p>
                      <span className="opacity-60">Expires: </span>
                      {formatDate(status.expiryDate)}
                    </p>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )
      }}
      getCellClassName={(course, col) => {
        const emp = col.data
        const status = statusMap.get(`${emp.id}-${course.id}`)
        const st = status?.status ?? "Not Completed"
        return cellColors[st] || ""
      }}
    />
  )
}
