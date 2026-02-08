import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { formatDate } from "@/lib/format"
import type {
  Employee,
  TrainingStatus,
  LeaveBalance,
  RotaMonth,
  SupervisionStatus,
  AppraisalMatrixRow,
} from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/stat-card"
import { ListPanel } from "@/components/list-panel"
import { StatusDot } from "@/components/status-dot"
import { UpcomingShifts } from "@/components/upcoming-shifts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  chartGradientDefs,
  pieStyles,
  barStyles,
  buildPieConfig,
  hoursChartConfig,
} from "@/lib/chart-styles"
import { Label, Pie, PieChart, Bar, BarChart, XAxis, YAxis } from "recharts"
import { BookOpen, CalendarDays, Bell, ClipboardCheck } from "lucide-react"

interface AppraisalMatrixResponse {
  reviewsBack: number
  rows: AppraisalMatrixRow[]
}

const pieStatusMap: Record<string, string> = {
  Valid: "Valid",
  Expiring: "Expiring Soon",
  Expired: "Expired",
  "Not Done": "Not Completed",
  Completed: "Completed",
}

function getNextSupervisionDate(sup: SupervisionStatus): string | null {
  const base = sup.lastSupervisionDate ?? sup.startDate
  if (!base || !sup.supervisionFrequency) return null
  const d = new Date(base)
  d.setMonth(d.getMonth() + sup.supervisionFrequency)
  return d.toISOString().split("T")[0]
}

export default function MyDashboardPage() {
  const { user, hasPermission } = useAuth()
  const navigate = useNavigate()
  const employeeId = user?.employeeId
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // --- All hooks must be before any early returns ---

  const [chartYear, setChartYear] = useState(currentYear)
  const [chartMonth, setChartMonth] = useState(currentMonth)
  const [pieCategory, setPieCategory] = useState("All")

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
    queryFn: () =>
      api.get<LeaveBalance>(`/leave/balance/${employeeId}/${currentYear}`),
    enabled: !!employeeId,
  })

  // Current month rota — used for upcoming shifts
  const { data: rota } = useQuery({
    queryKey: ["rota", currentYear, currentMonth],
    queryFn: () =>
      api.get<RotaMonth>(`/rota?year=${currentYear}&month=${currentMonth}`),
    enabled: !!employeeId,
  })

  // Chart month rota — used for hours bar chart (deduplicates when same as current)
  const { data: chartRota } = useQuery({
    queryKey: ["rota", chartYear, chartMonth],
    queryFn: () =>
      api.get<RotaMonth>(`/rota?year=${chartYear}&month=${chartMonth}`),
    enabled: !!employeeId,
  })

  const { data: supervisionStatuses } = useQuery({
    queryKey: ["supervision-status"],
    queryFn: () => api.get<SupervisionStatus[]>("/supervisions/status"),
    enabled: !!employeeId && hasPermission("supervisions.view"),
  })

  const { data: appraisalData } = useQuery({
    queryKey: ["appraisals-matrix"],
    queryFn: () => api.get<AppraisalMatrixResponse>("/appraisals/matrix"),
    enabled: !!employeeId && hasPermission("appraisals.view"),
  })

  // --- All derived data via useMemo (must be before returns) ---

  const myRota = rota?.staff.find((s) => s.employeeId === employeeId)
  const chartMyRota = chartRota?.staff.find((s) => s.employeeId === employeeId)

  const hoursBarData = useMemo(() => {
    const scheduled = chartMyRota?.summary.totalHours ?? 0
    const contracted = chartRota?.contractedHours ?? 0
    if (scheduled === 0 && contracted === 0) return []
    const monthLabel = new Date(chartYear, chartMonth - 1).toLocaleDateString("en-GB", { month: "short" })
    return [{
      month: monthLabel,
      hours: Math.round(scheduled * 10) / 10,
      target: Math.round(contracted * 10) / 10,
    }]
  }, [chartMyRota, chartRota, chartYear, chartMonth])

  // Generate month options (6 months back, 6 months forward)
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = []
    for (let offset = -6; offset <= 6; offset++) {
      const d = new Date(currentYear, currentMonth - 1 + offset, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
      options.push({ value: `${y}-${m}`, label })
    }
    return options
  }, [currentYear, currentMonth])

  // --- Early returns (after all hooks) ---

  if (!employeeId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Your account is not linked to an employee record. Contact an
          administrator to link your account.
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

  // --- Derived data: training ---

  const myTraining =
    trainingStatuses?.filter((s) => s.employeeId === employeeId) ?? []
  const validTraining = myTraining.filter(
    (s) => s.status === "Valid" || s.status === "Completed",
  )
  const expiredTraining = myTraining.filter((s) => s.status === "Expired")
  const expiringTraining = myTraining.filter(
    (s) => s.status === "Expiring Soon",
  )
  const notCompleted = myTraining.filter((s) => s.status === "Not Completed")

  const trainingPct =
    myTraining.length > 0
      ? Math.round((validTraining.length / myTraining.length) * 100)
      : 0

  // Pie chart data (filtered by category dropdown)
  const pieTraining = pieCategory === "All"
    ? myTraining
    : myTraining.filter((s) => s.category === pieCategory)
  const pieValidCount = pieTraining.filter(
    (s) => s.status === "Valid" || s.status === "Completed",
  ).length
  const piePct = pieTraining.length > 0
    ? Math.round((pieValidCount / pieTraining.length) * 100)
    : 0

  const trainingPieData = [
    {
      status: "Valid",
      count: pieTraining.filter((s) => s.status === "Valid").length,
      fill: pieStyles.valid.fill,
      legendColor: pieStyles.valid.legend,
    },
    {
      status: "Expiring",
      count: pieTraining.filter((s) => s.status === "Expiring Soon").length,
      fill: pieStyles.expiring.fill,
      legendColor: pieStyles.expiring.legend,
    },
    {
      status: "Expired",
      count: pieTraining.filter((s) => s.status === "Expired").length,
      fill: pieStyles.expired.fill,
      legendColor: pieStyles.expired.legend,
    },
    {
      status: "Not Done",
      count: pieTraining.filter((s) => s.status === "Not Completed").length,
      fill: pieStyles.notDone.fill,
      legendColor: pieStyles.notDone.legend,
    },
    {
      status: "Completed",
      count: pieTraining.filter((s) => s.status === "Completed").length,
      fill: pieStyles.completed.fill,
      legendColor: pieStyles.completed.legend,
    },
  ].filter((d) => d.count > 0)

  const trainingPieConfig = buildPieConfig(trainingPieData)

  // --- Derived data: supervision ---

  const mySupervision = supervisionStatuses?.find(
    (s) => s.employeeId === employeeId,
  )

  // --- Derived data: appraisals ---

  const myAppraisalRow = appraisalData?.rows.find(
    (r) => r.employeeId === employeeId,
  )
  const nextAppraisal = myAppraisalRow?.reviews
    .filter((r): r is NonNullable<typeof r> => r !== null && !r.completedDate)
    .sort(
      (a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )[0]

  // --- Derived data: notifications ---

  const trainingAlertCount = expiredTraining.length + expiringTraining.length
  const supervisionAlert =
    mySupervision?.status === "Overdue" || mySupervision?.status === "Due Soon"
  const appraisalAlert =
    nextAppraisal?.status === "overdue" || nextAppraisal?.status === "due_soon"
  const totalAlerts =
    trainingAlertCount +
    (supervisionAlert ? 1 : 0) +
    (appraisalAlert ? 1 : 0)

  // --- Supervision status text ---
  const supervisionValue = mySupervision?.status ?? "\u2014"
  const nextSupervisionDue = mySupervision ? getNextSupervisionDate(mySupervision) : null
  const supervisionSubtitle = mySupervision
    ? nextSupervisionDue
      ? `Next due: ${formatDate(nextSupervisionDue)}`
      : mySupervision.lastSupervisionDate
        ? `Last: ${formatDate(mySupervision.lastSupervisionDate)}`
        : "No supervision recorded"
    : "Not available"

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
        <p className="text-sm text-muted-foreground leading-tight">
          {employee.role}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {employee.email}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Started {formatDate(employee.startDate)}
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Training"
          value={`${trainingPct}%`}
          subtitle={`${validTraining.length} of ${myTraining.length} compliant`}
          href="/my-training"
        />
        <StatCard
          icon={CalendarDays}
          label="Leave"
          value={leaveBalance ? `${leaveBalance.remaining}d` : "\u2014"}
          subtitle={
            leaveBalance
              ? `${leaveBalance.approvedDaysTaken} taken of ${leaveBalance.totalEntitlement}`
              : "No entitlement set"
          }
          href="/my-leave"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Supervision"
          value={supervisionValue}
          subtitle={supervisionSubtitle}
        />
        <StatCard
          icon={Bell}
          label="Alerts"
          value={`${totalAlerts}`}
          subtitle={
            totalAlerts === 0
              ? "All clear"
              : [
                  trainingAlertCount > 0
                    ? `${trainingAlertCount} training`
                    : null,
                  supervisionAlert ? "1 supervision" : null,
                  appraisalAlert ? "1 appraisal" : null,
                ]
                  .filter(Boolean)
                  .join(", ")
          }
        />
      </div>

      {/* Charts Row: Training Pie + Hours Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Training Breakdown Pie */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Training Breakdown</h3>
              <select
                value={pieCategory}
                onChange={(e) => setPieCategory(e.target.value)}
                className="text-xs border rounded-md px-2 py-1 bg-background text-foreground"
              >
                <option value="All">All Categories</option>
                <option value="Online Mandatory">Online Mandatory</option>
                <option value="F2F Mandatory">F2F Mandatory</option>
                <option value="Additional">Additional</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pieTraining.length} record{pieTraining.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="px-5 pb-5">
            {loadingTraining ? (
              <Skeleton className="h-[200px] w-full" />
            ) : pieTraining.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No training data
              </p>
            ) : (
              <ChartContainer
                config={trainingPieConfig}
                className="mx-auto aspect-square max-h-[220px]"
              >
                <PieChart key={pieCategory}>
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
                    style={{ filter: "url(#pieShadow)", cursor: "pointer" }}
                    onClick={(data) => {
                      const actual = pieStatusMap[data.status] ?? data.status
                      const params = new URLSearchParams({ status: actual })
                      if (pieCategory !== "All") params.set("category", pieCategory)
                      navigate(`/my-training?${params}`)
                    }}
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
                                {piePct}%
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
            {pieTraining.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {trainingPieData.map((d) => (
                  <div
                    key={d.status}
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => {
                      const actual = pieStatusMap[d.status] ?? d.status
                      const params = new URLSearchParams({ status: actual })
                      if (pieCategory !== "All") params.set("category", pieCategory)
                      navigate(`/my-training?${params}`)
                    }}
                  >
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

        {/* Scheduled vs Contracted Hours */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Hours</h3>
              <select
                value={`${chartYear}-${chartMonth}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split("-").map(Number)
                  setChartYear(y)
                  setChartMonth(m)
                }}
                className="text-xs border rounded-md px-2 py-1 bg-background text-foreground"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {chartMyRota
                ? `${chartMyRota.summary.totalHours.toFixed(1)}h scheduled${
                    chartRota?.contractedHours != null
                      ? ` of ${chartRota.contractedHours}h contracted`
                      : ""
                  }${
                    chartMyRota.summary.overUnder != null
                      ? ` (${chartMyRota.summary.overUnder > 0 ? "+" : ""}${chartMyRota.summary.overUnder.toFixed(1)})`
                      : ""
                  }`
                : "No rota data"}
            </p>
          </div>
          <div className="px-5 pb-5">
            {hoursBarData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No shift data this month
              </p>
            ) : (
              <div
                className="cursor-pointer"
                onClick={() => navigate(`/my-rota?year=${chartYear}&month=${chartMonth}`)}
              >
                <ChartContainer
                  config={hoursChartConfig}
                  className="h-[220px] w-full"
                >
                  <BarChart
                    key={`${chartYear}-${chartMonth}`}
                    data={hoursBarData}
                    margin={{ top: 8, right: 0, left: -20, bottom: 0 }}
                    barSize={50}
                  >
                    {chartGradientDefs()}
                    <XAxis
                      dataKey="month"
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
                      dataKey="hours"
                      fill={barStyles.primary}
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="target"
                      fill={barStyles.secondary}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: "hsl(180, 60%, 40%)" }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Scheduled ({hoursBarData[0]?.hours ?? 0}h)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: "hsl(220, 15%, 70%)" }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Contracted ({hoursBarData[0]?.target ?? 0}h)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom lists: Notifications + Upcoming Shifts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        <NotificationsPanel
          expiredTraining={expiredTraining}
          expiringTraining={expiringTraining}
          mySupervision={mySupervision}
          nextAppraisal={nextAppraisal}
          totalAlerts={totalAlerts}
        />

        <UpcomingShifts
          shifts={myRota?.shifts}
          leaveDates={myRota?.leaveDates}
        />
      </div>
    </div>
  )
}

// --- Notifications sub-component ---

function NotificationsPanel({
  expiredTraining,
  expiringTraining,
  mySupervision,
  nextAppraisal,
  totalAlerts,
}: {
  expiredTraining: TrainingStatus[]
  expiringTraining: TrainingStatus[]
  mySupervision?: SupervisionStatus
  nextAppraisal?: { status: string; dueDate: string; daysUntilDue: number | null }
  totalAlerts: number
}) {
  const hasAlerts = totalAlerts > 0

  return (
    <ListPanel title="Notifications" count={totalAlerts}>
      {!hasAlerts ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          All clear — no action needed
        </p>
      ) : (
        <>
          {expiredTraining.map((s) => (
            <div
              key={`exp-${s.courseId}`}
              className="flex items-center gap-3 px-4 py-2.5 min-h-[52px] hover:bg-muted/30 transition-colors"
            >
              <StatusDot color="red" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{s.courseName}</p>
                <p className="text-xs text-muted-foreground">
                  Expired{" "}
                  {s.daysUntilExpiry !== null
                    ? `${Math.abs(s.daysUntilExpiry)}d ago`
                    : ""}
                </p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                Training
              </Badge>
            </div>
          ))}
          {expiringTraining.map((s) => (
            <div
              key={`soon-${s.courseId}`}
              className="flex items-center gap-3 px-4 py-2.5 min-h-[52px] hover:bg-muted/30 transition-colors"
            >
              <StatusDot color="amber" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{s.courseName}</p>
                <p className="text-xs text-muted-foreground">
                  Expires in {s.daysUntilExpiry}d
                </p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                Training
              </Badge>
            </div>
          ))}
          {mySupervision &&
            (mySupervision.status === "Overdue" ||
              mySupervision.status === "Due Soon") && (
              <div className="flex items-center gap-3 px-4 py-2.5 min-h-[52px] hover:bg-muted/30 transition-colors">
                <StatusDot
                  color={
                    mySupervision.status === "Overdue" ? "red" : "amber"
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">Supervision {mySupervision.status.toLowerCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {mySupervision.lastSupervisionDate
                      ? `Last: ${formatDate(mySupervision.lastSupervisionDate)}`
                      : "No supervision recorded"}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  Supervision
                </Badge>
              </div>
            )}
          {nextAppraisal &&
            (nextAppraisal.status === "overdue" ||
              nextAppraisal.status === "due_soon") && (
              <div className="flex items-center gap-3 px-4 py-2.5 min-h-[52px] hover:bg-muted/30 transition-colors">
                <StatusDot
                  color={nextAppraisal.status === "overdue" ? "red" : "amber"}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    Appraisal{" "}
                    {nextAppraisal.status === "overdue"
                      ? "overdue"
                      : "due soon"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDate(nextAppraisal.dueDate)}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  Appraisal
                </Badge>
              </div>
            )}
        </>
      )}
    </ListPanel>
  )
}
