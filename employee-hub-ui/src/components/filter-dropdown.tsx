import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { ChevronDown } from "lucide-react"

interface FilterDropdownProps {
  label: string
  items: { id: string; label: string }[]
  hidden: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[], hide: boolean) => void
}

export function FilterDropdown({
  label,
  items,
  hidden,
  onToggle,
  onToggleAll,
}: FilterDropdownProps) {
  const ids = items.map((i) => i.id)
  const hiddenCount = ids.filter((id) => hidden.has(id)).length
  const allVisible = hiddenCount === 0
  const noneVisible = hiddenCount === ids.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium"
        >
          {label}
          {hiddenCount > 0 && (
            <span className="text-muted-foreground">
              ({items.length - hiddenCount}/{items.length})
            </span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <div className="border-b px-3 py-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={allVisible ? true : noneVisible ? false : "indeterminate"}
              onCheckedChange={() => onToggleAll(ids, allVisible)}
            />
            <span className="text-sm font-medium">
              {allVisible ? "Deselect all" : "Select all"}
            </span>
          </label>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {items.map((item) => (
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
      </PopoverContent>
    </Popover>
  )
}
