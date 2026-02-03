import { formatDate } from "@/lib/format"
import type { TrainingStatus } from "@/lib/types"
import { ListRow } from "@/components/list-row"
import { StatusBadge } from "@/components/status-badge"

export function TrainingCard({ data: s }: { data: TrainingStatus }) {
  return (
    <ListRow>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{s.courseName}</p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span>Completed: {formatDate(s.completionDate)}</span>
          {s.expiryDate && <span>Expires: {formatDate(s.expiryDate)}</span>}
          {s.daysUntilExpiry !== null && (
            <span>
              {s.daysUntilExpiry < 0
                ? `${Math.abs(s.daysUntilExpiry)}d overdue`
                : `${s.daysUntilExpiry}d remaining`}
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={s.status} />
    </ListRow>
  )
}
