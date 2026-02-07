import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { formatDate } from "@/lib/format"
import type { Employee, TrainingStatus, LeaveBalance } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/stat-card"
import { ListPanel } from "@/components/list-panel"
import { StatusDot } from "@/components/status-dot"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  chartGradientDefs,
  pieStyles,
  buildPieConfig,
} from "@/lib/chart-styles"
import { Label, Pie, PieChart } from "recharts"
import { BookOpen, CalendarDays, Bell } from "lucide-react"

export default function MyDashboardPage() {
  const { user } = useAuth()
  const employeeId = user?.employeeId
  const currentYear = new Date().getFullYear()

  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => api.get<Employee>(`/employees/${employeeId}`),
    enabled: !!employeeId,
  })

  const { data: trainingStatuses, isLoading: loadingTraining } = useQuery({
    queryKey: ["training-status"],
    queryFn: () => api.get<TrainingStatus[]>("/training-records/status"),
    enabled: !!employeeId,
  })

  const { data: leaveBalance } = useQuery({
    queryKey: ["leave-balance", employeeId, currentYear],
    queryFn: () => api.get<LeaveBalance>(`/leave/balance/${employeeId}/${currentYear}`),
    enabled: !!employeeId,
  })

  if (!employeeId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Your account is not linked to an employee record. Contact an administrator to link your account.
        </p>
      </div>
    )
  }

  if (loadingEmployee) {
    return <Skeleton className="h-48 w-full" />
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Employee record not found.</p>
      </div>
    )
  }

  const myTraining = trainingStatuses?.filter((s) => s.employeeId === employeeId) ?? []
  const validTraining = myTraining.filter((s) => s.status === "Valid" || s.status === "Completed")
  const expiredTraining = myTraining.filter((s) => s.status === "Expired")
  const expiringTraining = myTraining.filter((s) => s.status === "Expiring Soon")
  const notCompleted = myTraining.filter((s) => s.status === "Not Completed")

  const trainingPct = myTraining.length > 0
    ? Math.round((validTraining.length / myTraining.length) * 100)
    : 0

  const statusCounts: Record<string, number> = {
    Valid: myTraining.filter((s) => s.status === "Valid").length,
    "Expiring Soon": expiringTraining.length,
    Expired: expiredTraining.length,
    "Not Completed": notCompleted.length,
    Completed: myTraining.filter((s) => s.status === "Completed").length,
  }

  const trainingPieData = [
    { status: "Valid", count: statusCounts.Valid, fill: pieStyles.valid.fill, legendColor: pieStyles.valid.legend },
    { status: "Expiring", count: statusCounts["Expiring Soon"], fill: pieStyles.expiring.fill, legendColor: pieStyles.expiring.legend },
    { status: "Expired", count: statusCounts.Expired, fill: pieStyles.expired.fill, legendColor: pieStyles.expired.legend },
    { status: "Not Done", count: statusCounts["Not Completed"], fill: pieStyles.notDone.fill, legendColor: pieStyles.notDone.legend },
    { status: "Completed", count: statusCounts.Completed, fill: pieStyles.completed.fill, legendColor: pieStyles.completed.legend },
  ].filter((d) => d.count > 0)

  const trainingPieConfig = buildPieConfig(trainingPieData)

  const notificationCount = expiredTraining.length + expiringTraining.length
  const hasAlerts = notificationCount > 0

  const activityFeed = myTraining
    .filter((s): s is TrainingStatus & { completionDate: string } => s.completionDate !== null)
    .map((s) => ({
      key: `train-${s.courseId}`,
      label: s.courseName,
      sub: "Training completed",
      date: formatDate(s.completionDate),
      sortDate: s.completionDate,
    }))
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
    .slice(0, 8)

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Info card */}
      <div className="rounded-xl border bg-gradient-to-r from-muted/50 to-white p-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold leading-tight">
            {employee.firstName} {employee.lastName}
          </h2>
          {employee.statusName && (
            <Badge
              variant="outline"
              className={`text-xs ${
                employee.statusName === "Active"
                  ? "border-emerald-300 text-emerald-700"
                  : employee.statusName === "Suspended"
                    ? "border-red-300 text-red-700"
                    : ""
              }`}
            >
              {employee.statusName}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-tight">{employee.role}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{employee.email}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Started {formatDate(employee.startDate)}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={BookOpen}
          label="Training"
          value={`${trainingPct}%`}
          subtitle={`${validTraining.length} of ${myTraining.length} compliant`}
        />
        <StatCard
          icon={CalendarDays}
          label="Leave"
          value={leaveBalance ? `${leaveBalance.remaining}d` : "—"}
          subtitle={leaveBalance ? `${leaveBalance.approvedDaysTaken} days taken of ${leaveBalance.entitlement}` : "No entitlement set"}
        />
        <StatCard
          icon={Bell}
          label="Alerts"
          value={`${notificationCount}`}
          subtitle={notificationCount === 0 ? "All clear" : `${expiredTraining.length} expired, ${expiringTraining.length} expiring`}
        />
      </div>

      {/* Charts + Panels Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Training Breakdown Pie */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-sm font-semibold">Training Breakdown</h3>
            <p className="text-xs text-muted-foreground">Compliance overview</p>
          </div>
          <div className="px-5 pb-5">
            {loadingTraining ? (
              <Skeleton className="h-[200px] w-full" />
            ) : myTraining.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No training data</p>
            ) : (
              <ChartContainer config={trainingPieConfig} className="mx-auto aspect-square max-h-[220px]">
                <PieChart>
                  {chartGradientDefs()}
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={trainingPieData}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={60}
                    outerRadius={90}
                    strokeWidth={3}
                    stroke="hsl(var(--background))"
                    style={{ filter: "url(#pieShadow)" }}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 6} className="fill-foreground text-3xl font-bold">
                                {trainingPct}%
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-muted-foreground text-[11px] font-medium">
                                compliant
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            {myTraining.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {trainingPieData.map((d) => (
                  <div key={d.status} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: d.legendColor }} />
                    <span className="text-xs text-muted-foreground">{d.status} ({d.count})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <ListPanel title="Notifications" count={notificationCount}>
          {!hasAlerts ? (
            <p className="text-sm text-muted-foreground text-center py-6">All clear — no action needed</p>
          ) : (
            <>
              {expiredTraining.map((s) => (
                <div key={`exp-${s.courseId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <StatusDot color="red" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{s.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      Expired {s.daysUntilExpiry !== null ? `${Math.abs(s.daysUntilExpiry)}d ago` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">Expired</Badge>
                </div>
              ))}
              {expiringTraining.map((s) => (
                <div key={`soon-${s.courseId}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <StatusDot color="amber" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{s.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires in {s.daysUntilExpiry}d
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">Expiring</Badge>
                </div>
              ))}
            </>
          )}
        </ListPanel>
      </div>

      {/* Activity Feed */}
      <ListPanel title="Recent Activity">
        {activityFeed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          activityFeed.map((item) => (
            <div key={item.key} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
              <StatusDot color="teal" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{item.date}</span>
            </div>
          ))
        )}
      </ListPanel>
    </div>
  )
}
