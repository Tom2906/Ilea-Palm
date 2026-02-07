import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Employee, EmployeeStatus } from "@/lib/types"
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
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

const roles = [
  "Director",
  "Responsible Individual",
  "Registered Manager",
  "Senior Residential Support Worker",
  "Residential Support Worker",
  "Bank",
]

interface EmployeeEditModalProps {
  employee: Employee
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmployeeEditModal({
  employee,
  open,
  onOpenChange,
}: EmployeeEditModalProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState("")
  const [form, setForm] = useState(() => formFromEmployee(employee))

  // Reset form whenever modal opens or employee data changes
  const prevOpenRef = useState({ wasOpen: open })[0]
  if (open && !prevOpenRef.wasOpen) {
    setForm(formFromEmployee(employee))
    setError("")
  }
  prevOpenRef.wasOpen = open

  const { data: statuses } = useQuery({
    queryKey: ["employee-statuses"],
    queryFn: () => api.get<EmployeeStatus[]>("/employee-statuses"),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put<Employee>(`/employees/${employee.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      queryClient.invalidateQueries({ queryKey: ["employee", employee.id] })
      onOpenChange(false)
      setError("")
    },
    onError: (err: Error) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    updateMutation.mutate({
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      department: form.department || null,
      role: form.role,
      startDate: form.startDate,
      statusId: form.statusId || null,
      notes: form.notes || null,
    })
  }

  const isPending = updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="ed-firstName">First Name</FieldLabel>
                <Input
                  id="ed-firstName"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ed-lastName">Last Name</FieldLabel>
                <Input
                  id="ed-lastName"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  disabled={isPending}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="ed-email">Email</FieldLabel>
              <Input
                id="ed-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={isPending}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="ed-role">Role</FieldLabel>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v })}
                  disabled={isPending}
                >
                  <SelectTrigger id="ed-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="ed-dept">Department</FieldLabel>
                <Input
                  id="ed-dept"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  disabled={isPending}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="ed-startDate">Start Date</FieldLabel>
                <Input
                  id="ed-startDate"
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ed-status">Status</FieldLabel>
                <Select
                  value={form.statusId}
                  onValueChange={(v) => setForm({ ...form, statusId: v })}
                  disabled={isPending}
                >
                  <SelectTrigger id="ed-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {statuses?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="ed-notes">Notes</FieldLabel>
              <Textarea
                id="ed-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={isPending}
                rows={3}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function formFromEmployee(emp: Employee) {
  return {
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    role: emp.role,
    department: emp.department ?? "",
    startDate: emp.startDate,
    statusId: emp.statusId ?? "",
    notes: emp.notes ?? "",
  }
}
