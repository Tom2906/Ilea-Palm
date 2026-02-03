import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ListPanelProps {
  title: string
  count?: number
  children: React.ReactNode
  className?: string
}

export function ListPanel({ title, count, children, className }: ListPanelProps) {
  return (
    <div className={cn("rounded-lg border overflow-hidden flex flex-col min-h-0", className)}>
      <div className="px-4 py-3 border-b bg-muted/30 shrink-0">
        <h3 className="text-sm font-semibold">
          {title}
          {count !== undefined && count > 0 && (
            <Badge variant="secondary" className="text-xs ml-2">{count}</Badge>
          )}
        </h3>
      </div>
      <div className="divide-y scrollbar-hover flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}
