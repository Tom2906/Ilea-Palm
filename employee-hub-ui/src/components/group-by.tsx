import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Layers, Check, X } from "lucide-react"

export interface GroupByOption {
  id: string
  label: string
}

interface GroupByProps {
  options: GroupByOption[]
  value: string | null
  onChange: (value: string | null) => void
}

export function GroupBy({ options, value, onChange }: GroupByProps) {
  const activeLabel = options.find((o) => o.id === value)?.label

  return (
    <div className="shrink-0">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1">
            <Layers className="h-3.5 w-3.5" />
            Group
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1">
          <button
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
            onClick={() => onChange(null)}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {value === null && <Check className="h-3.5 w-3.5" />}
            </span>
            None
          </button>
          {options.map((opt) => (
            <button
              key={opt.id}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm"
              onClick={() => onChange(opt.id)}
            >
              <span className="w-4 h-4 flex items-center justify-center">
                {value === opt.id && <Check className="h-3.5 w-3.5" />}
              </span>
              {opt.label}
            </button>
          ))}
          {value !== null && (
            <div className="border-t mt-1 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs text-muted-foreground"
                onClick={() => onChange(null)}
              >
                <X className="h-3 w-3" />
                Clear grouping
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
