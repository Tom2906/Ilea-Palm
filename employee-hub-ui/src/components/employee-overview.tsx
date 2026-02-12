import { formatDate } from "@/lib/format"
import type {
  Employee,
  TrainingStatus,
  OnboardingRecord,
  EmployeeReference,
} from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/stat-card"
import { ListPanel } from "@/components/list-panel"
import { StatusDot } from "@/components/status-dot"
import { pieStyles } from "@/lib/chart-styles"
import { hoursChartConfig } from "@/lib/chart-styles"
import { DonutChart } from "@/components/charts/donut-chart"
import { ComparisonBarChart } from "@/components/charts/comparison-bar-chart"
import { BookOpen, Users, ClipboardCheck, Timer } from "lucide-react"

// TODO: Replace with real rota data — the rota backend already exists
const mockWeeklyHours = [
  { day: "Mon", hours: 8, target: 7.5 },
  { day: "Tue", hours: 7.5, target: 7.5 },
  { day: "Wed", hours: 9, target: 7.5 },
  { day: "Thu", hours: 7, target: 7.5 },
  { day: "Fri", hours: 8, target: 7.5 },
  { day: "Sat", hours: 0, target: 0 },
  { day: "Sun", hours: 0, target: 0 },
]

interface EmployeeOverviewProps {
  employee: Employee
  training: TrainingStatus[]
  onboarding: OnboardingRecord[] | undefined
  references: EmployeeReference[] | undefined
  loadingTraining: boolean
  statusCounts: Record<string, number>
}

export function EmployeeOverview({
  employee,
  training,
  onboarding,
  references,
  loadingTraining,
  statusCounts,
}: EmployeeOverviewProps) {
  const validTraining = training.filter((s) => s.status === "Valid" || s.status === "Completed")
  const expiredTraining = training.filter((s) => s.status === "Expired")
  const expiringTraining = training.filter((s) => s.status === "Expiring Soon")
  const completedOnboarding = onboarding?.filter((r) => r.status === "complete") ?? []
  const incompleteOnboarding = onboarding?.filter((r) => r.status !== "complete") ?? []
  const refsReceived = references?.filter((r) => r.received) ?? []

  const hasAlerts = expiredTraining.length > 0 || expiringTraining.length > 0 || incompleteOnboarding.length > 0
  const notificationCount = expiredTraining.length + expiringTraining.length + incompleteOnboarding.length

  const trainingPct = training.length > 0
    ? Math.round((validTraining.length / training.length) * 100)
    : 0
  const onboardingPct = onboarding && onboarding.length > 0
    ? Math.round((completedOnboarding.length / onboarding.length) * 100)
    : 0
  const mockTotalHours = mockWeeklyHours.reduce((sum, d) => sum + d.hours, 0)
  const mockTargetHours = mockWeeklyHours.reduce((sum, d) => sum + d.target, 0)

  const activityFeed = buildActivityFeed(training, onboarding, references)

  const trainingPieData = [
    { status: "Valid", count: statusCounts.Valid, fill: pieStyles.valid.fill, legendColor: pieStyles.valid.legend },
    { status: "Expiring", count: statusCounts["Expiring Soon"], fill: pieStyles.expiring.fill, legendColor: pieStyles.expiring.legend },
    { status: "Expired", count: statusCounts.Expired, fill: pieStyles.expired.fill, legendColor: pieStyles.expired.legend },
    { status: "Not Done", count: statusCounts["Not Completed"], fill: pieStyles.notDone.fill, legendColor: pieStyles.notDone.legend },
    { status: "Completed", count: statusCounts.Completed, fill: pieStyles.completed.fill, legendColor: pieStyles.completed.legend },
  ].filter((d) => d.count > 0)

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Training" value={`${trainingPct}%`} subtitle={`${validTraining.length} of ${training.length} compliant`} />
        <StatCard icon={ClipboardCheck} label="Onboarding" value={`${onboardingPct}%`} subtitle={`${completedOnboarding.length} of ${onboarding?.length ?? 0} complete`} />
        <StatCard icon={Users} label="References" value={`${refsReceived.length}/${references?.length ?? 0}`} subtitle={refsReceived.length === (references?.length ?? 0) && references?.length ? "All received" : "Awaiting references"} />
        <StatCard icon={Timer} label="Hours (Week)" value={`${mockTotalHours}h`} subtitle={`Target: ${mockTargetHours}h`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Training Breakdown Pie */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-sm font-semibold">Training Breakdown</h3>
            <p className="text-xs text-muted-foreground">Compliance overview</p>
          </div>
          {loadingTraining ? (
            <div className="px-5 pb-5">
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : (
            <DonutChart
              data={trainingPieData}
              centerValue={`${trainingPct}%`}
              centerLabel="compliant"
              chartKey={employee.id}
              emptyMessage="No training data"
            />
          )}
        </div>

        {/* Weekly Hours Bar */}
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-sm font-semibold">Weekly Hours</h3>
            <p className="text-xs text-muted-foreground">{mockTotalHours}h worked of {mockTargetHours}h target</p>
          </div>
          <ComparisonBarChart
            data={mockWeeklyHours}
            config={hoursChartConfig}
            categoryKey="day"
            primaryKey="hours"
            secondaryKey="target"
            chartKey={employee.id}
          />
        </div>
      </div>

      {/* Notes */}
      {employee.notes && (
        <div className="rounded-lg border p-5">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Notes</p>
          <p className="text-sm leading-relaxed">{employee.notes}</p>
        </div>
      )}

      {/* Activity & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        <ListPanel title="Activity">
          {activityFeed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
          ) : (
            activityFeed.map((item) => (
              <div key={item.key} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                <StatusDot color={item.dotColor} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{item.date}</span>
              </div>
            ))
          )}
        </ListPanel>

        <ListPanel title="Notifications" count={notificationCount}>
          {!hasAlerts ? (
            <p className="text-sm text-muted-foreground text-center py-6">All clear</p>
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
              {incompleteOnboarding.map((r) => (
                <div key={`onb-${r.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <StatusDot color="blue" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{r.itemName}</p>
                    <p className="text-xs text-muted-foreground">Onboarding incomplete</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">Pending</Badge>
                </div>
              ))}
            </>
          )}
        </ListPanel>
      </div>
    </div>
  )
}

type ActivityItem = {
  key: string
  label: string
  sub: string
  date: string
  sortDate: string
  dotColor: "teal" | "slate"
}

function buildActivityFeed(
  training: TrainingStatus[],
  onboarding: OnboardingRecord[] | undefined,
  references: EmployeeReference[] | undefined,
): ActivityItem[] {
  return [
    ...training
      .filter((s): s is TrainingStatus & { completionDate: string } => s.completionDate !== null)
      .map((s) => ({
        key: `train-${s.courseId}`,
        label: s.courseName,
        sub: "Training completed",
        date: formatDate(s.completionDate),
        sortDate: s.completionDate,
        dotColor: "teal" as const,
      })),
    ...(onboarding ?? [])
      .filter((r) => r.status === "complete" && r.completedDate)
      .map((r) => ({
        key: `onb-${r.id}`,
        label: r.itemName,
        sub: "Onboarding completed",
        date: formatDate(r.completedDate!),
        sortDate: r.completedDate!,
        dotColor: "teal" as const,
      })),
    ...(references ?? [])
      .filter((r) => r.dateReceived)
      .map((r) => ({
        key: `ref-recv-${r.id}`,
        label: r.contactName || `Reference #${r.referenceNumber}`,
        sub: "Reference received",
        date: formatDate(r.dateReceived!),
        sortDate: r.dateReceived!,
        dotColor: "teal" as const,
      })),
    ...(references ?? [])
      .filter((r) => r.dateRequested && !r.dateReceived)
      .map((r) => ({
        key: `ref-req-${r.id}`,
        label: r.contactName || `Reference #${r.referenceNumber}`,
        sub: "Reference requested",
        date: formatDate(r.dateRequested!),
        sortDate: r.dateRequested!,
        dotColor: "slate" as const,
      })),
  ]
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
    .slice(0, 10)
}
