import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { ChevronRight } from "lucide-react"

export interface FilterGroup {
  key: string
  label: string
  items: { id: string; label: string }[]
}

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: FilterGroup[]
  /** Set of item IDs that are currently hidden */
  hidden: Set<string>
  onApply: (hidden: Set<string>) => void
}

export function FilterModal({
  open,
  onOpenChange,
  groups,
  hidden,
  onApply,
}: FilterModalProps) {
  const [draft, setDraft] = useState<Set<string>>(new Set(hidden))

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setDraft(new Set(hidden))
    onOpenChange(nextOpen)
  }

  function toggleItem(id: string) {
    setDraft((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearAll() {
    setDraft(new Set())
  }

  function apply() {
    onApply(draft)
    onOpenChange(false)
  }

  const hasChanges = draft.size !== hidden.size || [...draft].some((id) => !hidden.has(id))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>Toggle items to show or hide them in the matrix.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto py-1">
          {groups.map((group) => {
            const ids = group.items.map((i) => i.id)
            const visibleCount = ids.filter((id) => !draft.has(id)).length

            return (
              <Collapsible key={group.key}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 text-left hover:bg-muted/70 transition-colors group">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                    <span className="text-sm font-medium">{group.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {visibleCount}/{ids.length}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-1 py-2 px-1">
                    {group.items.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center justify-between gap-3 px-3 py-1.5 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <span className="text-sm">{item.label}</span>
                        <Switch
                          size="sm"
                          checked={!draft.has(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>

        <DialogFooter>
          {draft.size > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="mr-auto">
              Clear all
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={apply} disabled={!hasChanges}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
