import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  subtitle: string
  icon: LucideIcon
  className?: string
}

export function StatCard({ label, value, subtitle, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-r from-muted/50 to-white p-4 hover:shadow-sm transition-all",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted/60 p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tracking-tight">{value}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
    </div>
  )
}
