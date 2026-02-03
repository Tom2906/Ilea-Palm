import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Employee, TrainingStatus } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, BookOpen, AlertTriangle, XCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Expired":
      return <Badge variant="destructive">Expired</Badge>
    case "Expiring Soon":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">Expiring Soon</Badge>
    case "Valid":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100">Valid</Badge>
    case "Completed":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100">Completed</Badge>
    default:
      return <Badge variant="secondary">Not Completed</Badge>
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  const { data: statuses, isLoading: loadingStatuses } = useQuery({
    queryKey: ["training-status"],
    queryFn: () => api.get<TrainingStatus[]>("/training-records/status"),
  })

  const activeEmployees = employees?.length ?? 0
  const expiringSoon = statuses?.filter((s) => s.status === "Expiring Soon") ?? []
  const expired = statuses?.filter((s) => s.status === "Expired") ?? []
  const alerts = [...expired, ...expiringSoon].sort((a, b) => {
    if (a.daysUntilExpiry === null) return 1
    if (b.daysUntilExpiry === null) return -1
    return a.daysUntilExpiry - b.daysUntilExpiry
  })

  const totalCourseAssignments = statuses?.length ?? 0
  const validCount = statuses?.filter((s) => s.status === "Valid" || s.status === "Completed").length ?? 0

  const isLoading = loadingEmployees || loadingStatuses

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{activeEmployees}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {totalCourseAssignments > 0
                  ? Math.round((validCount / totalCourseAssignments) * 100)
                  : 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {validCount} of {totalCourseAssignments} training assignments current
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-amber-600">{expiringSoon.length}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{expired.length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Training Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No training alerts. All training is current.</p>
          ) : (
            <div className="space-y-1">
              {alerts.slice(0, 20).map((alert) => (
                <div
                  key={`${alert.employeeId}-${alert.courseId}`}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/employees/${alert.employeeId}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {alert.firstName} {alert.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {alert.courseName} ({alert.category})
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    {alert.daysUntilExpiry !== null && (
                      <span className="text-xs text-muted-foreground">
                        {alert.daysUntilExpiry < 0
                          ? `${Math.abs(alert.daysUntilExpiry)}d overdue`
                          : `${alert.daysUntilExpiry}d remaining`}
                      </span>
                    )}
                    <StatusBadge status={alert.status} />
                  </div>
                </div>
              ))}
              {alerts.length > 20 && (
                <p className="text-xs text-muted-foreground pt-2 pl-3">
                  ...and {alerts.length - 20} more
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
