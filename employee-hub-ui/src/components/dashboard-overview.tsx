import { useNavigate } from "react-router-dom"
import { formatDate } from "@/lib/format"
import type { Employee, TrainingStatus } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/stat-card"
import { ListPanel } from "@/components/list-panel"
import { StatusDot } from "@/components/status-dot"
import { StatusBadge } from "@/components/status-badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  chartGradientDefs,
  pieStyles,
  barStyles,
  complianceChartConfig,
  buildPieConfig,
} from "@/lib/chart-styles"
import { Label, Pie, PieChart, Bar, BarChart, XAxis, YAxis } from "recharts"
import { Users, BookOpen, Clock, AlertTriangle } from "lucide-react"

interface DashboardOverviewProps {
  employees: Employee[]
  statuses: TrainingStatus[]
  loading: boolean
}

export function DashboardOverview({
  employees,
  statuses,
  loading,
}: DashboardOverviewProps) {
  const navigate = useNavigate()

  // --- Derived data ---

  const activeCount = employees.filter((e) => e.active).length

  const validCount = statuses.filter(
    (s) => s.status === "Valid" || s.status === "Completed",
  ).length
  const compliancePct =
    statuses.length > 0 ? Math.round((validCount / statuses.length) * 100) : 0

  const expiringSoon = statuses.filter((s) => s.status === "Expiring Soon")
  const expired = statuses.filter((s) => s.status === "Expired")

  // Status counts for pie chart
  const statusCounts: Record<string, number> = {
    Valid: statuses.filter((s) => s.status === "Valid").length,
    "Expiring Soon": expiringSoon.length,
    Expired: expired.length,
    "Not Completed": statuses.filter((s) => s.status === "Not Completed")
      .length,
    Completed: statuses.filter((s) => s.status === "Completed").length,
  }

  // Pie chart data
  const trainingPieData = [
    {
      status: "Valid",
      count: statusCounts.Valid,
      fill: pieStyles.valid.fill,
      legendColor: pieStyles.valid.legend,
    },
    {
      status: "Expiring",
      count: statusCounts["Expiring Soon"],
      fill: pieStyles.expiring.fill,
      legendColor: pieStyles.expiring.legend,
    },
    {
      status: "Expired",
      count: statusCounts.Expired,
      fill: pieStyles.expired.fill,
      legendColor: pieStyles.expired.legend,
    },
    {
      status: "Not Done",
      count: statusCounts["Not Completed"],
      fill: pieStyles.notDone.fill,
      legendColor: pieStyles.notDone.legend,
    },
    {
      status: "Completed",
      count: statusCounts.Completed,
      fill: pieStyles.completed.fill,
      legendColor: pieStyles.completed.legend,
    },
  ].filter((d) => d.count > 0)

  const trainingPieConfig = buildPieConfig(trainingPieData)

  // Bar chart data — compliance by category
  const categories = ["Online Mandatory", "F2F Mandatory", "Additional"] as const
  const complianceBarData = categories.map((cat) => {
    const inCat = statuses.filter((s) => s.category === cat)
    const compliant = inCat.filter(
      (s) => s.status === "Valid" || s.status === "Completed",
    ).length
    return { category: cat, compliant, total: inCat.length }
  })

  // Training alerts — expired first, then expiring, sorted by urgency
  const alerts = [...expired, ...expiringSoon]
    .sort((a, b) => {
      if (a.daysUntilExpiry === null) return 1
      if (b.daysUntilExpiry === null) return -1
      return a.daysUntilExpiry - b.daysUntilExpiry
    })
    .slice(0, 15)

  // Recent activity — latest completions
  const recentActivity = statuses
    .filter((s) => s.completionDate)
    .sort(
      (a, b) =>
        new Date(b.completionDate!).getTime() -
        new Date(a.completionDate!).getTime(),
    )
    .slice(0, 10)

  // --- Render ---

  if (loading) {
    return (
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Employees"
          value={String(activeCount)}
          subtitle={`${activeCount} active employee${activeCount !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={BookOpen}
          label="Compliance"
          value={`${compliancePct}%`}
          subtitle={`${validCount} of ${statuses.length} assignments compliant`}
        />
        <StatCard
          icon={Clock}
          label="Expiring Soon"
          value={String(expiringSoon.length)}
          subtitle="within 30 days"
        />
        <StatCard
          icon={AlertTriangle}
          label="Expired"
          value={String(expired.length)}
          subtitle="requires attention"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Training Breakdown Pie */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-sm font-semibold">Training Breakdown</h3>
            <p className="text-xs text-muted-foreground">
              Company-wide compliance overview
            </p>
          </div>
          <div className="px-5 pb-5">
            {statuses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No training data
              </p>
            ) : (
              <ChartContainer
                config={trainingPieConfig}
                className="mx-auto aspect-square max-h-[220px]"
              >
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
                        if (
                          viewBox &&
                          "cx" in viewBox &&
                          "cy" in viewBox
                        ) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) - 6}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {compliancePct}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 16}
                                className="fill-muted-foreground text-[11px] font-medium"
                              >
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
            {statuses.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {trainingPieData.map((d) => (
                  <div key={d.status} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: d.legendColor }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {d.status} ({d.count})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Compliance by Category Bar */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-sm font-semibold">Compliance by Category</h3>
            <p className="text-xs text-muted-foreground">
              Compliant vs total assignments per category
            </p>
          </div>
          <div className="px-5 pb-5">
            {statuses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No training data
              </p>
            ) : (
              <ChartContainer
                config={complianceChartConfig}
                className="h-[220px] w-full"
              >
                <BarChart
                  data={complianceBarData}
                  margin={{ top: 8, right: 0, left: -20, bottom: 0 }}
                >
                  {chartGradientDefs()}
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="compliant"
                    fill={barStyles.primary}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="total"
                    fill={barStyles.secondary}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row — Alerts & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        <ListPanel title="Training Alerts" count={alerts.length}>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No training alerts
            </p>
          ) : (
            alerts.map((s) => (
              <div
                key={`${s.employeeId}-${s.courseId}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/employees/${s.employeeId}`)}
              >
                <StatusDot color={s.status === "Expired" ? "red" : "amber"} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.courseName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.daysUntilExpiry !== null && (
                    <span className="text-xs text-muted-foreground">
                      {s.daysUntilExpiry < 0
                        ? `${Math.abs(s.daysUntilExpiry)}d overdue`
                        : `${s.daysUntilExpiry}d`}
                    </span>
                  )}
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))
          )}
        </ListPanel>

        <ListPanel title="Recent Activity">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No recent activity
            </p>
          ) : (
            recentActivity.map((s) => (
              <div
                key={`${s.employeeId}-${s.courseId}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <StatusDot color="teal" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.courseName}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(s.completionDate)}
                </span>
              </div>
            ))
          )}
        </ListPanel>
      </div>
    </div>
  )
}
