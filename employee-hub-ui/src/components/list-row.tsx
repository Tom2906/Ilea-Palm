import { cn } from "@/lib/utils"

interface ListRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function ListRow({ children, className, onClick }: ListRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border px-4 py-3 transition-colors",
        onClick && "cursor-pointer",
        "hover:bg-muted/30",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
