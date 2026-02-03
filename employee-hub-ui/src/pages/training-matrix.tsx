import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { TrainingStatus, TrainingCourse, Employee } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function statusColor(status: string): string {
  switch (status) {
    case "Valid":
    case "Completed":
      return "bg-emerald-100 text-emerald-800"
    case "Expiring Soon":
      return "bg-amber-100 text-amber-800"
    case "Expired":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-500"
  }
}

function formatShortDate(dateStr: string | null) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`
}

export default function TrainingMatrixPage() {
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ["training-courses"],
    queryFn: () => api.get<TrainingCourse[]>("/training-courses"),
  })

  const { data: statuses, isLoading: loadingStatuses } = useQuery({
    queryKey: ["training-status"],
    queryFn: () => api.get<TrainingStatus[]>("/training-records/status"),
  })

  const isLoading = loadingEmployees || loadingCourses || loadingStatuses

  // Group courses by category
  const courseGroups = useMemo(() => {
    if (!courses) return []
    const groups: { category: string; courses: TrainingCourse[] }[] = []
    const order = ["Online Mandatory", "F2F Mandatory", "Additional"]

    for (const cat of order) {
      const catCourses = courses.filter((c) => c.category === cat)
      if (catCourses.length > 0) {
        groups.push({ category: cat, courses: catCourses })
      }
    }
    return groups
  }, [courses])

  // Build lookup: employeeId-courseId -> TrainingStatus
  const statusMap = useMemo(() => {
    const map = new Map<string, TrainingStatus>()
    statuses?.forEach((s) => {
      map.set(`${s.employeeId}-${s.courseId}`, s)
    })
    return map
  }, [statuses])

  const allCourses = courseGroups.flatMap((g) => g.courses)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          <span>Valid / Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          <span>Expiring Soon</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          <span>Expired</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />
          <span>Not Completed</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-12rem)]">
            <table className="text-xs border-collapse" style={{ borderSpacing: 0 }}>
              <thead>
                {/* Category group header row */}
                <tr className="border-b">
                  <th
                    className="sticky left-0 z-30 bg-white border-r border-b px-3 py-2 text-left font-medium text-muted-foreground min-w-[180px]"
                    rowSpan={2}
                  >
                    Employee
                  </th>
                  {courseGroups.map((group) => (
                    <th
                      key={group.category}
                      colSpan={group.courses.length}
                      className="border-b border-r px-2 py-1 text-center font-semibold bg-muted/50"
                    >
                      {group.category}
                    </th>
                  ))}
                </tr>
                {/* Course name header row */}
                <tr className="border-b">
                  {allCourses.map((course) => (
                    <th
                      key={course.id}
                      className="border-r px-1 py-1 text-center font-medium bg-muted/30 min-w-[80px] max-w-[100px]"
                      title={course.name}
                    >
                      <div className="truncate leading-tight" style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)", maxHeight: "120px" }}>
                        {course.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees?.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-muted/20">
                    <td className="sticky left-0 z-20 bg-white border-r px-3 py-1.5 font-medium whitespace-nowrap shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                      {emp.firstName} {emp.lastName}
                    </td>
                    {allCourses.map((course) => {
                      const status = statusMap.get(`${emp.id}-${course.id}`)
                      const st = status?.status ?? "Not Completed"
                      return (
                        <td
                          key={course.id}
                          className={`border-r px-1 py-1 text-center ${statusColor(st)}`}
                          title={`${emp.firstName} ${emp.lastName} - ${course.name}: ${st}${status?.completionDate ? ` (${formatShortDate(status.completionDate)})` : ""}`}
                        >
                          {status?.completionDate ? (
                            <div className="leading-tight">
                              <div>{formatShortDate(status.completionDate)}</div>
                              {status.expiryDate && (
                                <div className="text-[10px] opacity-70">
                                  {formatShortDate(status.expiryDate)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="opacity-50">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
