import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { AppraisalMilestone, Employee } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MarkCompleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  milestone: AppraisalMilestone | null
  employeeName: string
}

export function MarkCompleteModal({
  open,
  onOpenChange,
  milestone,
  employeeName,
}: MarkCompleteModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    completedDate: new Date().toISOString().split("T")[0],
    conductedById: "",
    notes: "",
  })
  const [error, setError] = useState("")

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open && milestone) {
      setForm({
        completedDate: milestone.completedDate || new Date().toISOString().split("T")[0],
        conductedById: milestone.conductedById || "",
        notes: milestone.notes || "",
      })
      setError("")
    }
  }, [open, milestone])

  const updateMutation = useMutation({
    mutationFn: (data: { completedDate: string; conductedById: string | null; notes: string | null }) =>
      api.put(`/appraisals/${milestone?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appraisals-matrix"] })
      queryClient.invalidateQueries({ queryKey: ["appraisals-summary"] })
      onOpenChange(false)
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to update milestone")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!milestone) return

    updateMutation.mutate({
      completedDate: form.completedDate,
      conductedById: form.conductedById || null,
      notes: form.notes || null,
    })
  }

  if (!milestone) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {milestone.completedDate ? "Edit" : "Mark Complete"} - {milestone.milestoneLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-4">
          Employee: <span className="font-medium text-foreground">{employeeName}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <FieldLabel>Completion Date</FieldLabel>
            <Input
              type="date"
              value={form.completedDate}
              onChange={(e) => setForm({ ...form, completedDate: e.target.value })}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Conducted By</FieldLabel>
            <Select
              value={form.conductedById}
              onValueChange={(value) => setForm({ ...form, conductedById: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select who conducted the appraisal" />
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
            <FieldLabel>Notes (optional)</FieldLabel>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any notes about this appraisal..."
              rows={3}
            />
          </FieldGroup>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
