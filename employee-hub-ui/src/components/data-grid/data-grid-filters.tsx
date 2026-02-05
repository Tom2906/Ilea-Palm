import { Button } from "@/components/ui/button"
import { FilterDropdown } from "@/components/filter-dropdown"
import { X } from "lucide-react"
import type { FilterConfig } from "./types"

interface DataGridFiltersProps {
  filters: FilterConfig[]
  hidden: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[], hide: boolean) => void
  onClear: () => void
}

export function DataGridFilters({
  filters,
  hidden,
  onToggle,
  onToggleAll,
  onClear,
}: DataGridFiltersProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex items-center gap-1.5">
      {filters.map((filter) => (
        <FilterDropdown
          key={filter.key}
          label={filter.label}
          items={filter.items}
          hidden={hidden}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
        />
      ))}
      {hidden.size > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={onClear}
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  )
}
