import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { AppraisalMatrixRow, AppraisalCellData, Employee } from "@/lib/types"
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

type ModalMode = "edit" | "schedule" | "new"

interface AppraisalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ModalMode
  row: AppraisalMatrixRow | null
  cell: AppraisalCellData | null
  employees?: Employee[]
}

export function AppraisalModal({
  open,
  onOpenChange,
  mode,
  row,
  cell,
  employees: externalEmployees,
}: AppraisalModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    employeeId: "",
    dueDate: "",
    isCompleted: false,
    completedDate: "",
    conductedById: "",
    notes: "",
  })
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: fetchedEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
    enabled: !externalEmployees,
  })

  const employees = externalEmployees ?? fetchedEmployees

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false)
      return
    }

    if (mode === "edit" && cell && row) {
      setForm({
        employeeId: row.employeeId,
        dueDate: cell.dueDate?.split("T")[0] ?? "",
        isCompleted: !!cell.completedDate,
        completedDate: cell.completedDate?.split("T")[0] ?? cell.dueDate?.split("T")[0] ?? "",
        conductedById: cell.conductedById ?? "",
        notes: cell.notes ?? "",
      })
    } else if ((mode === "schedule" || mode === "new") && row) {
      setForm({
        employeeId: row.employeeId,
        dueDate: "",
        isCompleted: false,
        completedDate: "",
        conductedById: "",
        notes: "",
      })
    }
    setError("")
    setConfirmDelete(false)
  }, [open, mode, cell, row])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (mode === "edit" && cell?.id) {
        // Update existing record
        return api.put(`/appraisals/${cell.id}`, {
          dueDate: form.dueDate,
          ...(form.isCompleted
            ? {
                completedDate: form.completedDate,
                conductedById: form.conductedById || null,
              }
            : { clearCompleted: true }),
          notes: form.notes || null,
        })
      } else {
        // Create new record (schedule or new mode)
        return api.post("/appraisals", {
          employeeId: form.employeeId,
          dueDate: form.dueDate,
          ...(form.isCompleted
            ? {
                completedDate: form.completedDate,
                conductedById: form.conductedById || null,
              }
            : {}),
          notes: form.notes || null,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appraisals-matrix"] })
      onOpenChange(false)
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to save review")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/appraisals/${cell?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appraisals-matrix"] })
      onOpenChange(false)
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to delete review")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.dueDate) {
      setError("Due date is required")
      return
    }
    if (form.isCompleted && !form.completedDate) {
      setError("Completed date is required when marking as complete")
      return
    }
    saveMutation.mutate()
  }

  if (!row) return null

  const title =
    mode === "edit"
      ? `Review #${cell?.reviewNumber}`
      : mode === "schedule"
        ? "Schedule Appraisal"
        : "New Appraisal"

  const isCreate = mode !== "edit"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-4">
          Employee: <span className="font-medium text-foreground">{row.firstName} {row.lastName}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <FieldLabel>Due Date</FieldLabel>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </FieldGroup>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isCompleted"
              checked={form.isCompleted}
              onCheckedChange={(checked) =>
                setForm({
                  ...form,
                  isCompleted: checked === true,
                  completedDate: checked === true && !form.completedDate ? form.dueDate : form.completedDate,
                })
              }
            />
            <label htmlFor="isCompleted" className="text-sm font-medium cursor-pointer">
              Mark as Completed
            </label>
          </div>

          {form.isCompleted && (
            <>
              <FieldGroup>
                <FieldLabel>Completed Date</FieldLabel>
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
            </>
          )}

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

          <div className="flex justify-between">
            {mode === "edit" && cell?.id && (
              <div>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600">Delete this review?</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
