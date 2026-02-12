import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { formatDate } from "@/lib/format"
import type {
  Employee,
  TrainingStatus,
  SupervisionSummary,
  SupervisionStatus,
  AppraisalMatrixRow,
  LeaveRequest,
  AuditLogEntry,
} from "@/lib/types"
import { auditToActivityItems } from "@/lib/audit-messages"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/stat-card"
import { ListPanel } from "@/components/list-panel"
import { StatusDot } from "@/components/status-dot"
import { ActivityFeed } from "@/components/activity-feed"
import { pieStyles, complianceChartConfig } from "@/lib/chart-styles"
import { DonutChart } from "@/components/charts/donut-chart"
import { ComparisonBarChart } from "@/components/charts/comparison-bar-chart"
import {
  Users,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
} from "lucide-react"

interface DashboardOverviewProps {
  employees: Employee[]
  statuses: TrainingStatus[]
  loading: boolean
  supervisionSummary?: SupervisionSummary
  supervisionStatuses?: SupervisionStatus[]
  appraisalRows?: AppraisalMatrixRow[]
  leaveRequests?: LeaveRequest[]
  auditLog?: AuditLogEntry[]
}

export function DashboardOverview({
  employees,
  statuses,
  loading,
  supervisionSummary,
  supervisionStatuses,
  appraisalRows,
  leaveRequests,
  auditLog,
}: DashboardOverviewProps) {
  const navigate = useNavigate()

  // --- Training derived data ---

  const activeCount = employees.filter((e) => e.active).length

  const validCount = statuses.filter(
    (s) => s.status === "Valid" || s.status === "Completed",
  ).length
  const compliancePct =
    statuses.length > 0 ? Math.round((validCount / statuses.length) * 100) : 0

  const expiringSoon = statuses.filter((s) => s.status === "Expiring Soon")
  const expired = statuses.filter((s) => s.status === "Expired")

  const statusCounts: Record<string, number> = {
    Valid: statuses.filter((s) => s.status === "Valid").length,
    "Expiring Soon": expiringSoon.length,
    Expired: expired.length,
    "Not Completed": statuses.filter((s) => s.status === "Not Completed")
      .length,
    Completed: statuses.filter((s) => s.status === "Completed").length,
  }

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

  const categories = [
    "Online Mandatory",
    "F2F Mandatory",
    "Additional",
  ] as const
  const complianceBarData = categories.map((cat) => {
    const inCat = statuses.filter((s) => s.category === cat)
    const compliant = inCat.filter(
      (s) => s.status === "Valid" || s.status === "Completed",
    ).length
    return { category: cat, compliant, total: inCat.length }
  })

  // --- Leave derived data ---

  const pendingLeave = leaveRequests?.filter((r) => r.status === "pending") ?? []

  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }, [])

  const onLeaveToday = useMemo(() => {
    if (!leaveRequests) return []
    return leaveRequests.filter(
      (r) =>
        r.status === "approved" &&
        r.startDate <= todayStr &&
        r.endDate >= todayStr,
    )
  }, [leaveRequests, todayStr])

  // --- Unified alerts ---

  const unifiedAlerts = useMemo(() => {
    type Alert = {
      key: string
      severity: number
      dotColor: "red" | "amber"
      category: string
      name: string
      detail: string
      daysValue: number | null
      employeeId?: string
    }

    const alerts: Alert[] = []

    // Training expired
    for (const s of expired) {
      alerts.push({
        key: `train-exp-${s.employeeId}-${s.courseId}`,
        severity: 1,
        dotColor: "red",
        category: "Training",
        name: `${s.firstName} ${s.lastName}`,
        detail: s.courseName,
        daysValue: s.daysUntilExpiry,
        employeeId: s.employeeId,
      })
    }

    // Training expiring
    for (const s of expiringSoon) {
      alerts.push({
        key: `train-soon-${s.employeeId}-${s.courseId}`,
        severity: 2,
        dotColor: "amber",
        category: "Training",
        name: `${s.firstName} ${s.lastName}`,
        detail: s.courseName,
        daysValue: s.daysUntilExpiry,
        employeeId: s.employeeId,
      })
    }

    // Supervision overdue/due soon
    if (supervisionStatuses) {
      for (const s of supervisionStatuses) {
        if (s.status === "Overdue") {
          alerts.push({
            key: `sup-over-${s.employeeId}`,
            severity: 1,
            dotColor: "red",
            category: "Supervision",
            name: `${s.firstName} ${s.lastName}`,
            detail: s.lastSupervisionDate
              ? `Last: ${formatDate(s.lastSupervisionDate)}`
              : "Never supervised",
            daysValue: s.daysSinceLastSupervision
              ? -s.daysSinceLastSupervision
              : null,
            employeeId: s.employeeId,
          })
        } else if (s.status === "Due Soon") {
          alerts.push({
            key: `sup-due-${s.employeeId}`,
            severity: 2,
            dotColor: "amber",
            category: "Supervision",
            name: `${s.firstName} ${s.lastName}`,
            detail: s.lastSupervisionDate
              ? `Last: ${formatDate(s.lastSupervisionDate)}`
              : "Never supervised",
            daysValue: s.daysSinceLastSupervision
              ? -s.daysSinceLastSupervision
              : null,
            employeeId: s.employeeId,
          })
        }
      }
    }

    // Appraisals overdue/due soon
    if (appraisalRows) {
      for (const row of appraisalRows) {
        for (const review of row.reviews) {
          if (!review) continue
          if (review.status === "overdue") {
            alerts.push({
              key: `app-over-${row.employeeId}-${review.reviewNumber}`,
              severity: 1,
              dotColor: "red",
              category: "Appraisal",
              name: `${row.firstName} ${row.lastName}`,
              detail: `Review #${review.reviewNumber} due ${formatDate(review.dueDate)}`,
              daysValue: review.daysUntilDue,
              employeeId: row.employeeId,
            })
          } else if (review.status === "due_soon") {
            alerts.push({
              key: `app-due-${row.employeeId}-${review.reviewNumber}`,
              severity: 2,
              dotColor: "amber",
              category: "Appraisal",
              name: `${row.firstName} ${row.lastName}`,
              detail: `Review #${review.reviewNumber} due ${formatDate(review.dueDate)}`,
              daysValue: review.daysUntilDue,
              employeeId: row.employeeId,
            })
          }
        }
      }
    }

    // Sort: severity first (1=critical), then by urgency
    alerts.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity - b.severity
      const aVal = a.daysValue ?? 999
      const bVal = b.daysValue ?? 999
      return aVal - bVal
    })

    return alerts.slice(0, 20)
  }, [expired, expiringSoon, supervisionStatuses, appraisalRows])

  // --- Activity feed ---

  const activityItems = useMemo(() => {
    if (!auditLog) return []
    return auditToActivityItems(auditLog).slice(0, 15)
  }, [auditLog])

  // --- Render ---

  if (loading) {
    return (
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Employees"
          value={String(activeCount)}
          subtitle={`${activeCount} active employee${activeCount !== 1 ? "s" : ""}`}
          href="/employees"
        />
        <StatCard
          icon={BookOpen}
          label="Compliance"
          value={`${compliancePct}%`}
          subtitle={`${validCount} of ${statuses.length} compliant`}
          href="/training-matrix"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Supervision"
          value={
            supervisionSummary
              ? `${supervisionSummary.ok}/${supervisionSummary.totalEmployees}`
              : "\u2014"
          }
          subtitle={
            supervisionSummary
              ? `${supervisionSummary.overdue} overdue, ${supervisionSummary.dueSoon} due soon`
              : "Not available"
          }
          href="/supervision-matrix"
        />
        <StatCard
          icon={CalendarDays}
          label="Leave"
          value={leaveRequests ? `${pendingLeave.length} pending` : "\u2014"}
          subtitle={
            leaveRequests
              ? `${onLeaveToday.length} on leave today`
              : "Not available"
          }
          href="/leave"
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
          <DonutChart
            data={trainingPieData}
            centerValue={`${compliancePct}%`}
            centerLabel="compliant"
            chartKey={statuses.length}
            emptyMessage="No training data"
          />
        </div>

        {/* Compliance by Category Bar */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-sm font-semibold">
              Compliance by Category
            </h3>
            <p className="text-xs text-muted-foreground">
              Compliant vs total assignments per category
            </p>
          </div>
          <ComparisonBarChart
            data={complianceBarData}
            config={complianceChartConfig}
            categoryKey="category"
            primaryKey="compliant"
            secondaryKey="total"
            chartKey={statuses.length}
            emptyMessage="No training data"
          />
        </div>
      </div>

      {/* Alerts & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        <ListPanel title="Alerts" count={unifiedAlerts.length}>
          {unifiedAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No alerts
            </p>
          ) : (
            unifiedAlerts.map((a) => (
              <div
                key={a.key}
                className="flex items-center gap-3 px-4 py-2.5 min-h-[52px] hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() =>
                  a.employeeId && navigate(`/employees/${a.employeeId}`)
                }
              >
                <StatusDot color={a.dotColor} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.detail}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.daysValue !== null && (
                    <span className="text-xs text-muted-foreground">
                      {a.daysValue < 0
                        ? `${Math.abs(a.daysValue)}d overdue`
                        : `${a.daysValue}d`}
                    </span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {a.category}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </ListPanel>

        {auditLog ? (
          <ActivityFeed items={activityItems} />
        ) : (
          <RecentTrainingActivity statuses={statuses} />
        )}
      </div>
    </div>
  )
}

/** Fallback "Recent Activity" when audit log is unavailable */
function RecentTrainingActivity({
  statuses,
}: {
  statuses: TrainingStatus[]
}) {
  const recent = statuses
    .filter((s) => s.completionDate)
    .sort(
      (a, b) =>
        new Date(b.completionDate!).getTime() -
        new Date(a.completionDate!).getTime(),
    )
    .slice(0, 10)

  return (
    <ListPanel title="Recent Activity">
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No recent activity
        </p>
      ) : (
        recent.map((s) => (
          <div
            key={`${s.employeeId}-${s.courseId}`}
            className="flex items-center gap-3 px-4 py-2.5 min-h-[52px] hover:bg-muted/30 transition-colors"
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
  )
}
