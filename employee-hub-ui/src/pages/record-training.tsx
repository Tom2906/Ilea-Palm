import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Employee, TrainingCourse } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

export default function RecordTrainingPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    employeeId: "",
    courseId: "",
    completionDate: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

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
      setSuccess("Training record saved successfully.")
      setForm({ ...form, courseId: "", notes: "" })
    },
    onError: (err: Error) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    mutation.mutate({
      employeeId: form.employeeId,
      courseId: form.courseId,
      completionDate: form.completionDate,
      notes: form.notes || null,
    })
  }

  const selectedCourse = courses?.find((c) => c.id === form.courseId)

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Record Training Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="employee">Employee</FieldLabel>
                <Select
                  value={form.employeeId}
                  onValueChange={(v) => setForm({ ...form, employeeId: v })}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="course">Training Course</FieldLabel>
                <Select
                  value={form.courseId}
                  onValueChange={(v) => setForm({ ...form, courseId: v })}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger id="course">
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
                <FieldLabel htmlFor="completionDate">Completion Date</FieldLabel>
                <Input
                  id="completionDate"
                  type="date"
                  required
                  value={form.completionDate}
                  onChange={(e) =>
                    setForm({ ...form, completionDate: e.target.value })
                  }
                  disabled={mutation.isPending}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  disabled={mutation.isPending}
                  rows={2}
                />
              </Field>

              <Button
                type="submit"
                disabled={
                  mutation.isPending || !form.employeeId || !form.courseId
                }
                className="w-full"
              >
                {mutation.isPending ? "Saving..." : "Record Training"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
