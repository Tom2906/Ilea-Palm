import type { LegendItem } from "./types"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

interface DataGridLegendProps {
  items: LegendItem[]
}

function LegendItems({ items }: { items: LegendItem[] }) {
  return (
    <>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className={`w-3 h-3 rounded-sm shrink-0 ${item.color} ${item.borderColor || ""}`}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </>
  )
}

export function DataGridLegend({ items }: DataGridLegendProps) {
  if (items.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Info className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto">
        <div className="flex flex-col gap-2 text-xs">
          <LegendItems items={items} />
        </div>
      </PopoverContent>
    </Popover>
  )
}
