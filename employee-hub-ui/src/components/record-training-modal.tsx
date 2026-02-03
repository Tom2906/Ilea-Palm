import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { TrainingCourse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

interface RecordTrainingModalProps {
  employeeId: string
  employeeName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordTrainingModal({
  employeeId,
  employeeName,
  open,
  onOpenChange,
}: RecordTrainingModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    courseId: "",
    completionDate: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [error, setError] = useState("")

  const { data: courses } = useQuery({
    queryKey: ["training-courses"],
    queryFn: () => api.get<TrainingCourse[]>("/training-courses"),
  })

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/training-records", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-status"] })
      queryClient.invalidateQueries({ queryKey: ["training-records"] })
      onOpenChange(false)
      resetForm()
    },
    onError: (err: Error) => setError(err.message),
  })

  function resetForm() {
    setForm({ courseId: "", completionDate: new Date().toISOString().split("T")[0], notes: "" })
    setError("")
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    mutation.mutate({
      employeeId,
      courseId: form.courseId,
      completionDate: form.completionDate,
      notes: form.notes || null,
    })
  }

  const selectedCourse = courses?.find((c) => c.id === form.courseId)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Training</DialogTitle>
          <DialogDescription>
            Record a training completion for {employeeName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="rt-course">Training Course</FieldLabel>
              <Select
                value={form.courseId}
                onValueChange={(v) => setForm({ ...form, courseId: v })}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="rt-course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {selectedCourse && (
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                {selectedCourse.validityMonths
                  ? `Valid for ${selectedCourse.validityMonths} months. Expiry date will be calculated automatically.`
                  : "This course does not expire."}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="rt-date">Completion Date</FieldLabel>
              <Input
                id="rt-date"
                type="date"
                required
                value={form.completionDate}
                onChange={(e) => setForm({ ...form, completionDate: e.target.value })}
                disabled={mutation.isPending}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="rt-notes">Notes (optional)</FieldLabel>
              <Textarea
                id="rt-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={mutation.isPending}
                rows={2}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending || !form.courseId}
            >
              {mutation.isPending ? "Saving..." : "Record Training"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
