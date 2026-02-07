import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { SlidersHorizontal, ChevronRight, X } from "lucide-react"

interface FilterGroup {
  label: string
  items: { id: string; label: string }[]
}

interface FilterBarProps {
  filters: FilterGroup[]
  hidden: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[], hide: boolean) => void
  onClear: () => void
}

export function FilterBar({ filters, hidden, onToggle, onToggleAll, onClear }: FilterBarProps) {
  const totalHidden = filters.reduce(
    (count, f) => count + f.items.filter((i) => hidden.has(i.id)).length,
    0,
  )
  const hasAnyHidden = hidden.size > 0

  return (
    <div className="shrink-0">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {totalHidden > 0 && (
              <span className="text-muted-foreground">({totalHidden})</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-0">
          <div className="max-h-80 overflow-y-auto">
            {filters.map((f) => {
              const ids = f.items.map((i) => i.id)
              const hiddenCount = ids.filter((id) => hidden.has(id)).length
              const allVisible = hiddenCount === 0
              const noneVisible = hiddenCount === ids.length

              return (
                <Collapsible key={f.label}>
                  <div className="border-b px-3 py-3 bg-muted/30 flex items-center gap-2">
                    <Checkbox
                      checked={allVisible ? true : noneVisible ? false : "indeterminate"}
                      onCheckedChange={() => onToggleAll(ids, allVisible)}
                    />
                    <CollapsibleTrigger className="flex items-center gap-1.5 flex-1 cursor-pointer">
                      <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
                      <span className="text-xs font-semibold">{f.label}</span>
                      {hiddenCount > 0 && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {f.items.length - hiddenCount}/{f.items.length}
                        </span>
                      )}
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-1">
                      {f.items.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={!hidden.has(item.id)}
                            onCheckedChange={() => onToggle(item.id)}
                          />
                          <span className="text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
          {hasAnyHidden && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs text-muted-foreground"
                onClick={onClear}
              >
                <X className="h-3 w-3" />
                Clear all filters
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
