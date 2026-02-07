import { useState, useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import type { Employee } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

interface LeaveRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId?: string
  employeeName?: string
}

export function LeaveRequestModal({
  open,
  onOpenChange,
  employeeId: fixedEmployeeId,
  employeeName: fixedEmployeeName,
}: LeaveRequestModalProps) {
  const { user, hasPermission } = useAuth()
  const canViewAll = hasPermission("leave.view")
  const queryClient = useQueryClient()

  const [employeeId, setEmployeeId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [totalDays, setTotalDays] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  // Load employees for admin dropdown
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
    enabled: open && canViewAll && !fixedEmployeeId,
  })

  const activeEmployees = useMemo(
    () => employees?.filter((e) => e.active).sort((a, b) => a.lastName.localeCompare(b.lastName)) ?? [],
    [employees],
  )

  useEffect(() => {
    if (open) {
      setError("")
      setStartDate("")
      setEndDate("")
      setTotalDays("")
      setNotes("")
      setEmployeeId(fixedEmployeeId ?? user?.employeeId ?? "")
    }
  }, [open, fixedEmployeeId, user?.employeeId])

  // Auto-calculate total days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end >= start) {
        let count = 0
        const current = new Date(start)
        while (current <= end) {
          const day = current.getDay()
          if (day !== 0 && day !== 6) count++
          current.setDate(current.getDate() + 1)
        }
        setTotalDays(String(count))
      }
    }
  }, [startDate, endDate])

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/leave/requests", {
        employeeId,
        startDate,
        endDate,
        totalDays: Number(totalDays),
        notes: notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] })
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] })
      onOpenChange(false)
    },
    onError: (err: Error) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId || !startDate || !endDate || !totalDays) {
      setError("Please fill in all required fields")
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date must be on or after start date")
      return
    }
    mutation.mutate()
  }

  const showEmployeeSelect = canViewAll && !fixedEmployeeId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
          <DialogDescription>
            {fixedEmployeeName
              ? `Request leave for ${fixedEmployeeName}`
              : "Submit a new leave request"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {showEmployeeSelect && (
              <Field>
                <FieldLabel htmlFor="employee">Employee</FieldLabel>
                <Select value={employeeId} onValueChange={setEmployeeId} disabled={mutation.isPending}>
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="startDate">Start Date</FieldLabel>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={mutation.isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="endDate">End Date</FieldLabel>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={mutation.isPending}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="totalDays">Total Days</FieldLabel>
              <Input
                id="totalDays"
                type="number"
                step="0.5"
                min="0.5"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
                disabled={mutation.isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-calculated from dates (weekdays only). Adjust for half-days or bank holidays.
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={mutation.isPending}
                rows={2}
                placeholder="Optional notes"
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
