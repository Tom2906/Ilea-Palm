import { useState, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { GripVertical } from "lucide-react"

interface RowItem {
  id: string
  label: string
  sublabel?: string
}

interface ReorderRowsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: RowItem[]
  onApply: (orderedIds: string[]) => void
}

function SortableItem({ item }: { item: RowItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 rounded border bg-white hover:bg-muted/30"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.label}</div>
        {item.sublabel && (
          <div className="text-xs text-muted-foreground truncate">{item.sublabel}</div>
        )}
      </div>
    </div>
  )
}

export function ReorderRowsDialog({
  open,
  onOpenChange,
  items: initialItems,
  onApply,
}: ReorderRowsDialogProps) {
  const [items, setItems] = useState<RowItem[]>([])

  // Reset items when dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setItems(initialItems)
    }
    onOpenChange(nextOpen)
  }

  // Sync when initialItems change while open
  useMemo(() => {
    if (open) setItems(initialItems)
  }, [open, initialItems])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id)
        const newIndex = prev.findIndex((item) => item.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const handleApply = () => {
    onApply(items.map((item) => item.id))
    onOpenChange(false)
  }

  const itemIds = useMemo(() => items.map((item) => item.id), [items])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Reorder Rows</DialogTitle>
        </DialogHeader>
        <div className="py-2 max-h-[400px] overflow-y-auto space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              {items.map((item) => (
                <SortableItem key={item.id} item={item} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
