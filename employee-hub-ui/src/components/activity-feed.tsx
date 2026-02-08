import { formatRelativeTime } from "@/lib/format"
import type { ActivityFeedItem } from "@/lib/audit-messages"
import { ListPanel } from "@/components/list-panel"
import { StatusDot } from "@/components/status-dot"

interface ActivityFeedProps {
  items: ActivityFeedItem[]
  title?: string
  emptyMessage?: string
  className?: string
}

export function ActivityFeed({
  items,
  title = "Recent Activity",
  emptyMessage = "No recent activity",
  className,
}: ActivityFeedProps) {
  return (
    <ListPanel title={title} className={className}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          {emptyMessage}
        </p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-4 py-2.5 min-h-[52px] hover:bg-muted/30 transition-colors"
          >
            <StatusDot color={item.dotColor} />
            <div className="flex-1 min-w-0">
              <p className="text-sm">{item.message}</p>
              {item.detail && (
                <p className="text-xs text-muted-foreground truncate">
                  {item.detail}
                </p>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatRelativeTime(item.timestamp)}
            </span>
          </div>
        ))
      )}
    </ListPanel>
  )
}
