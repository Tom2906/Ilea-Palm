import { useNavigate } from "react-router-dom"
import { formatDate } from "@/lib/format"
import type { Employee, TrainingCourse, TrainingStatus } from "@/lib/types"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

const cellColors: Record<string, string> = {
  Valid: "bg-emerald-100",
  Completed: "bg-emerald-100",
  "Expiring Soon": "bg-amber-100",
  Expired: "bg-red-100",
  "Not Completed": "",
}

interface TrainingHeatmapProps {
  employees: Employee[]
  courses: TrainingCourse[]
  statusMap: Map<string, TrainingStatus>
}

function formatShortDate(dateStr: string | null) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`
}

export function TrainingHeatmap({
  employees,
  courses,
  statusMap,
}: TrainingHeatmapProps) {
  const navigate = useNavigate()

  if (courses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No courses in this category
      </p>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="rounded-lg border overflow-hidden flex flex-col min-h-0">
        <div
          className="flex-1 min-h-0"
          style={{ overflow: "auto", scrollbarWidth: "thin", scrollbarGutter: "stable" }}
        >
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-30 border-b">
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-40 bg-gray-50 text-left text-sm font-semibold text-muted-foreground px-4 py-3 max-w-[250px] w-[250px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                  Course
                </th>
                {employees.map((emp) => (
                  <th key={emp.id} className="text-center px-2 py-3 min-w-[90px]">
                    <button
                      className="text-sm font-semibold text-muted-foreground hover:underline cursor-pointer leading-tight"
                      onClick={() => navigate(`/employees/${emp.id}`)}
                    >
                      <div>{emp.firstName}</div>
                      <div>{emp.lastName}</div>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td
                    className="sticky left-0 z-10 bg-white px-4 py-2.5 text-sm font-medium shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] max-w-[250px] w-[250px] truncate"
                    title={course.name}
                  >
                    {course.name}
                  </td>
                  {employees.map((emp) => {
                    const status = statusMap.get(`${emp.id}-${course.id}`)
                    const st = status?.status ?? "Not Completed"

                    return (
                      <td
                        key={emp.id}
                        className={`text-center text-xs px-1 py-2.5 ${cellColors[st]}`}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-default leading-tight">
                              {status?.expiryDate ? (
                                <>
                                  <div>{formatShortDate(status.expiryDate)}</div>
                                  {status.completionDate && (
                                    <div className="text-[10px] opacity-60">
                                      {formatShortDate(status.completionDate)}
                                    </div>
                                  )}
                                </>
                              ) : status?.completionDate ? (
                                <div>{formatShortDate(status.completionDate)}</div>
                              ) : (
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
  )
}
