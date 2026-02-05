import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SupervisionRequirement } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ListRow } from "@/components/list-row"
import { Plus, Pencil, Trash2 } from "lucide-react"

interface SupervisionSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  employeeName: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function SupervisionSettingsModal({
  open,
  onOpenChange,
  employeeId,
  employeeName,
}: SupervisionSettingsModalProps) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [effectiveFrom, setEffectiveFrom] = useState("")
  const [requiredCount, setRequiredCount] = useState("1")

  const { data: requirements, isLoading } = useQuery({
    queryKey: ["supervision-requirements", employeeId],
    queryFn: () => api.get<SupervisionRequirement[]>(`/supervision-requirements/employee/${employeeId}`),
    enabled: open && !!employeeId,
  })

  const createMutation = useMutation({
    mutationFn: (data: { employeeId: string; effectiveFrom: string; requiredCount: number }) =>
      api.post("/supervision-requirements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervision-requirements", employeeId] })
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { effectiveFrom: string; requiredCount: number } }) =>
      api.put(`/supervision-requirements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervision-requirements", employeeId] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/supervision-requirements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervision-requirements", employeeId] })
    },
  })

  const resetForm = () => {
    setIsAdding(false)
    setEditingId(null)
    setEffectiveFrom("")
    setRequiredCount("1")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      effectiveFrom,
      requiredCount: parseInt(requiredCount, 10),
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data })
    } else {
      createMutation.mutate({ ...data, employeeId })
    }
  }

  const startEdit = (req: SupervisionRequirement) => {
    setEditingId(req.id)
    setEffectiveFrom(req.effectiveFrom.split("T")[0])
    setRequiredCount(req.requiredCount.toString())
    setIsAdding(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Delete this requirement?")) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Supervision Settings - {employeeName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Monthly Requirements</h4>
            {!isAdding && (
              <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            )}
          </div>

          {isAdding && (
            <form onSubmit={handleSubmit} className="border rounded-lg p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="effectiveFrom">Effective From</Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="requiredCount">Required/Month</Label>
                  <Input
                    id="requiredCount"
                    type="number"
                    min="0"
                    max="10"
                    value={requiredCount}
                    onChange={(e) => setRequiredCount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Update" : "Add"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : requirements?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requirements set. Default is 1 per month.</p>
          ) : (
            <div className="space-y-2">
              {requirements?.map((req) => (
                <ListRow key={req.id}>
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {req.requiredCount} per month
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      from {formatDate(req.effectiveFrom)}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => startEdit(req)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(req.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </ListRow>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Requirements are effective from the date specified. The most recent requirement before a given month applies to that month.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
