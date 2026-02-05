import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Supervision, Employee } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2 } from "lucide-react"

interface EditSupervisionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supervision: Supervision | null
}

export function EditSupervisionModal({
  open,
  onOpenChange,
  supervision,
}: EditSupervisionModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    supervisionDate: "",
    conductedById: "",
    notes: "",
    isCompleted: true,
    requiredCount: 1,
  })
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  // Populate form when supervision changes
  useEffect(() => {
    if (supervision) {
      setForm({
        supervisionDate: supervision.supervisionDate.split("T")[0],
        conductedById: supervision.conductedById,
        notes: supervision.notes || "",
        isCompleted: supervision.isCompleted,
        requiredCount: supervision.requiredCount,
      })
      setConfirmDelete(false)
      setError("")
    }
  }, [supervision])

  const updateMutation = useMutation({
    mutationFn: (data: { conductedById: string; supervisionDate: string; notes: string | null; isCompleted: boolean; requiredCount: number }) =>
      api.put(`/supervisions/${supervision?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervisions"] })
      queryClient.invalidateQueries({ queryKey: ["supervision-status"] })
      onOpenChange(false)
      setError("")
    },
    onError: (err: any) => {
      setError(err.message || "Failed to update supervision")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/supervisions/${supervision?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervisions"] })
      queryClient.invalidateQueries({ queryKey: ["supervision-status"] })
      onOpenChange(false)
    },
    onError: (err: any) => {
      setError(err.message || "Failed to delete supervision")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supervision) return
    if (!form.conductedById) {
      setError("Please select who conducted the supervision")
      return
    }

    updateMutation.mutate({
      conductedById: form.conductedById,
      supervisionDate: form.supervisionDate,
      notes: form.notes || null,
      isCompleted: form.isCompleted,
      requiredCount: form.requiredCount,
    })
  }

  const handleDelete = () => {
    if (confirmDelete) {
      deleteMutation.mutate()
    } else {
      setConfirmDelete(true)
    }
  }

  if (!supervision) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Supervision</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <FieldLabel>Supervision Date</FieldLabel>
            <Input
              type="date"
              value={form.supervisionDate}
              onChange={(e) => setForm({ ...form, supervisionDate: e.target.value })}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Conducted By</FieldLabel>
            <Select
              value={form.conductedById}
              onValueChange={(value) => setForm({ ...form, conductedById: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supervisor" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Required this month</FieldLabel>
            <Input
              type="number"
              min="1"
              max="10"
              value={form.requiredCount}
              onChange={(e) => setForm({ ...form, requiredCount: parseInt(e.target.value) || 1 })}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Notes (optional)</FieldLabel>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </FieldGroup>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isCompleted"
              checked={form.isCompleted}
              onCheckedChange={(checked) => setForm({ ...form, isCompleted: checked === true })}
            />
            <label htmlFor="isCompleted" className="text-sm cursor-pointer">
              Mark as completed
            </label>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
          )}

          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant={confirmDelete ? "destructive" : "outline"}
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? "Confirm Delete" : "Delete"}
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
