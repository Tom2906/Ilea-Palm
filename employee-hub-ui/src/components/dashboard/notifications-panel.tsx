import type { TrainingStatus, SupervisionStatus } from "@/lib/types"
import { formatDate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { ListPanel } from "@/components/list-panel"
import { StatusDot } from "@/components/status-dot"

interface NotificationsPanelProps {
  expiredTraining: TrainingStatus[]
  expiringTraining: TrainingStatus[]
  mySupervision?: SupervisionStatus
  nextAppraisal?: { status: string; dueDate: string; daysUntilDue: number | null }
  totalAlerts: number
}

export function NotificationsPanel({
  expiredTraining,
  expiringTraining,
  mySupervision,
  nextAppraisal,
  totalAlerts,
}: NotificationsPanelProps) {
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
