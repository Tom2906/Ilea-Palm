import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SupervisionStatus, Employee } from "@/lib/types"
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

interface RecordSupervisionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: SupervisionStatus | null
  period?: string | null
}

export function RecordSupervisionModal({
  open,
  onOpenChange,
  employee,
  period,
}: RecordSupervisionModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    supervisionDate: new Date().toISOString().split("T")[0],
    conductedById: "",
    notes: "",
    isCompleted: true,
    requiredCount: 1,
  })
  const [error, setError] = useState("")

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  // Auto-select supervisor and set default required count when employee changes
  useEffect(() => {
    if (employee) {
      setForm((prev) => ({
        ...prev,
        conductedById: employee.reportsTo || prev.conductedById,
        requiredCount: employee.supervisionFrequency || 1,
      }))
    }
  }, [employee])

  // Set default date to 1st of clicked month when period is provided
  useEffect(() => {
    if (open && period) {
      // period format is "YYYY-MM", convert to "YYYY-MM-01"
      const defaultDate = `${period}-01`
      setForm((prev) => ({ ...prev, supervisionDate: defaultDate }))
    } else if (open && !period) {
      // Default to today if no period provided
      setForm((prev) => ({ ...prev, supervisionDate: new Date().toISOString().split("T")[0] }))
    }
  }, [open, period])

  const createMutation = useMutation({
    mutationFn: (data: { employeeId: string; conductedById: string; supervisionDate: string; notes: string | null; isCompleted: boolean; requiredCount: number }) =>
      api.post("/supervisions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervision-status"] })
      queryClient.invalidateQueries({ queryKey: ["supervision-summary"] })
      queryClient.invalidateQueries({ queryKey: ["supervisions"] })
      onOpenChange(false)
      setForm({
        supervisionDate: new Date().toISOString().split("T")[0],
        conductedById: employee?.reportsTo || "",
        notes: "",
        isCompleted: true,
        requiredCount: employee?.supervisionFrequency || 1,
      })
      setError("")
    },
    onError: (err: any) => {
      setError(err.message || "Failed to record supervision")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee) return
    if (!form.conductedById) {
      setError("Please select who conducted the supervision")
      return
    }

    createMutation.mutate({
      employeeId: employee.employeeId,
      conductedById: form.conductedById,
      supervisionDate: form.supervisionDate,
      notes: form.notes || null,
      isCompleted: form.isCompleted,
      requiredCount: form.requiredCount,
    })
  }

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Add Supervision - {employee.firstName} {employee.lastName}
          </DialogTitle>
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
                    {emp.id === employee.reportsTo && " (usual supervisor)"}
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
              placeholder="e.g., 3 month review, A/L, single subject..."
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save Supervision"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
