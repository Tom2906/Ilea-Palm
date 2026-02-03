import { cn } from "@/lib/utils"

const dotColors = {
  red: "bg-red-400",
  amber: "bg-amber-400",
  blue: "bg-blue-400",
  teal: "bg-teal-400",
  slate: "bg-slate-300",
} as const

interface StatusDotProps {
  color: keyof typeof dotColors
  className?: string
}

export function StatusDot({ color, className }: StatusDotProps) {
  return (
    <div
      className={cn(
        "h-2 w-2 rounded-full shrink-0",
        dotColors[color],
        className
      )}
    />
  )
}
