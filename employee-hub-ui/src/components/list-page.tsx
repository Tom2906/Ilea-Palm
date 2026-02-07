import { useState, useEffect, type ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CollapsibleSection } from "@/components/collapsible-section"
import { Search, ChevronsDownUp, ChevronsUpDown } from "lucide-react"

export interface ListPageGroup {
  key: string
  label: string
  content: ReactNode
  itemCount: number
}

interface ListPageProps {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  toolbar?: ReactNode
  loading?: boolean
  emptyMessage?: string
  itemCount?: number
  groups?: ListPageGroup[]
  children?: ReactNode
}

export function ListPage({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  toolbar,
  loading = false,
  emptyMessage = "No items found.",
  itemCount,
  groups,
  children,
}: ListPageProps) {
  const hasSearch = onSearchChange !== undefined
  const hasToolbar = hasSearch || toolbar

  const visibleGroups = groups?.filter((g) => g.itemCount > 0)
  const totalItems = groups
    ? groups.reduce((sum, g) => sum + g.itemCount, 0)
    : itemCount ?? 0

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  // Reset all sections to open when groups change (e.g. switching group-by field)
  useEffect(() => {
    if (visibleGroups) {
      const all: Record<string, boolean> = {}
      visibleGroups.forEach((g) => { all[g.key] = true })
      setOpenSections(all)
    }
  }, [groups])

  const allExpanded = visibleGroups
    ? visibleGroups.every((g) => openSections[g.key] !== false)
    : false

  const toggleAll = () => {
    if (!visibleGroups) return
    const next: Record<string, boolean> = {}
    const newState = !allExpanded
    visibleGroups.forEach((g) => { next[g.key] = newState })
    setOpenSections(next)
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {hasToolbar && (
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div>
            {hasSearch && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue ?? ""}
                  onChange={(e) => onSearchChange!(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {visibleGroups && visibleGroups.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleAll}
                title={allExpanded ? "Collapse all" : "Expand all"}
              >
                {allExpanded ? (
                  <ChevronsDownUp className="h-4 w-4" />
                ) : (
                  <ChevronsUpDown className="h-4 w-4" />
                )}
              </Button>
            )}
            {toolbar}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : totalItems === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {emptyMessage}
        </p>
      ) : groups ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
          {visibleGroups!.map((g) => (
            <CollapsibleSection
              key={g.key}
              title={g.label}
              count={g.itemCount}
              countLabel={g.itemCount === 1 ? "item" : "items"}
              open={openSections[g.key] !== false}
              onOpenChange={(open) =>
                setOpenSections((prev) => ({ ...prev, [g.key]: open }))
              }
            >
              <div className="space-y-2">{g.content}</div>
            </CollapsibleSection>
          ))}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">{children}</div>
      )}
    </div>
  )
}
