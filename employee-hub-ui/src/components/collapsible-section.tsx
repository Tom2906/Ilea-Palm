import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"

interface CollapsibleSectionProps {
  title: string
  count?: number
  countLabel?: string
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function CollapsibleSection({
  title,
  count,
  countLabel,
  defaultOpen = true,
  open,
  onOpenChange,
  children,
}: CollapsibleSectionProps) {
  const label =
    count !== undefined
      ? countLabel
        ? `${count} ${countLabel}`
        : `${count}`
      : undefined

  const collapsibleProps =
    open !== undefined
      ? { open, onOpenChange }
      : { defaultOpen }

  return (
    <Collapsible {...collapsibleProps}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 text-left hover:bg-muted/70 transition-colors group">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {label && (
          <Badge variant="outline" className="text-xs">
            {label}
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
