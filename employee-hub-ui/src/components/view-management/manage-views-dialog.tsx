import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { GridView } from "@/lib/types"
import { Star, Pencil, Trash2, Check, X, Building2 } from "lucide-react"

interface ManageViewsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  views: GridView[]
  onRename: (viewId: string, name: string) => Promise<void>
  onDelete: (viewId: string) => Promise<void>
  onSetDefault: (viewId: string) => Promise<void>
  onClearDefault: (viewId: string) => Promise<void>
}

export function ManageViewsDialog({
  open,
  onOpenChange,
  views,
  onRename,
  onDelete,
  onSetDefault,
  onClearDefault,
}: ManageViewsDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const startRename = (view: GridView) => {
    setEditingId(view.id)
    setEditName(view.name)
  }

  const confirmRename = async () => {
    if (!editingId || !editName.trim()) return
    await onRename(editingId, editName.trim())
    setEditingId(null)
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditName("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Manage Views</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {views.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No saved views yet.
            </p>
          ) : (
            <div className="space-y-1">
              {views.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted/50"
                >
                  {editingId === view.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmRename()
                          if (e.key === "Escape") cancelRename()
                        }}
                        className="h-7 text-sm flex-1"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={confirmRename}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={cancelRename}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm flex-1 truncate">{view.name}</span>
                      {view.isCompanyDefault ? (
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title={view.isDefault ? "Remove default" : "Set as default"}
                          onClick={() =>
                            view.isDefault
                              ? onClearDefault(view.id)
                              : onSetDefault(view.id)
                          }
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              view.isDefault
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Rename"
                        onClick={() => startRename(view)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Delete"
                        onClick={() => onDelete(view.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
