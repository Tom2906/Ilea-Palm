import type { LegendItem } from "./types"

interface DataGridLegendProps {
  items: LegendItem[]
}

export function DataGridLegend({ items }: DataGridLegendProps) {
  if (items.length === 0) return null

  return (
    <div className="flex items-center gap-4 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className={`w-3 h-3 rounded-sm ${item.color} ${item.borderColor || ""}`}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
