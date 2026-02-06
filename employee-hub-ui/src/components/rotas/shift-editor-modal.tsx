import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { ShiftType, Shift } from "@/lib/types"
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

interface ShiftEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string
  employeeName: string
  date: string
  existingShift: Shift | null
  shiftTypes: ShiftType[]
  year: number
  month: number
}

export function ShiftEditorModal({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  date,
  existingShift,
  shiftTypes,
  year,
  month,
}: ShiftEditorModalProps) {
  const queryClient = useQueryClient()
  const [shiftTypeId, setShiftTypeId] = useState("")
  const [hours, setHours] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setError("")
      if (existingShift) {
        setShiftTypeId(existingShift.shiftTypeId)
        setHours(String(existingShift.hours))
        setNotes(existingShift.notes ?? "")
      } else {
        setShiftTypeId("")
        setHours("")
        setNotes("")
      }
    }
  }, [open, existingShift])

  // Update hours when shift type changes
  useEffect(() => {
    if (shiftTypeId && !existingShift) {
      const st = shiftTypes.find((t) => t.id === shiftTypeId)
      if (st) setHours(String(st.defaultHours))
    }
  }, [shiftTypeId, shiftTypes, existingShift])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        employeeId,
        date,
        shiftTypeId,
        hours: hours ? Number(hours) : null,
        notes: notes || null,
      }
      return api.post("/rota/shifts", data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rota", year, month] })
      onOpenChange(false)
    },
    onError: (err: Error) => setError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/rota/shifts/${existingShift!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rota", year, month] })
      onOpenChange(false)
    },
    onError: (err: Error) => setError(err.message),
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shiftTypeId) {
      if (existingShift) {
        deleteMutation.mutate()
      } else {
        onOpenChange(false)
      }
      return
    }
    saveMutation.mutate()
  }

  const isPending = saveMutation.isPending || deleteMutation.isPending

  const formattedDate = (() => {
    const d = new Date(date + "T00:00:00")
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Shift</DialogTitle>
          <DialogDescription>
            {employeeName} &mdash; {formattedDate}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave}>
          <FieldGroup>
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="shiftType">Shift Type</FieldLabel>
              <Select
                value={shiftTypeId}
                onValueChange={(v) => {
                  setShiftTypeId(v === "none" ? "" : v)
                  if (v !== "none") {
                    const st = shiftTypes.find((t) => t.id === v)
                    if (st) setHours(String(st.defaultHours))
                  } else {
                    setHours("")
                  }
                }}
                disabled={isPending}
              >
                <SelectTrigger id="shiftType">
                  <SelectValue placeholder="None (no shift)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (remove shift)</SelectItem>
                  {shiftTypes.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.code} &mdash; {st.name} ({st.defaultHours}h)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {shiftTypeId && (
              <>
                <Field>
                  <FieldLabel htmlFor="hours">Hours</FieldLabel>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    disabled={isPending}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="notes">Notes</FieldLabel>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isPending}
                    rows={2}
                    placeholder="Optional notes"
                  />
                </Field>
              </>
            )}
          </FieldGroup>

          <DialogFooter className="mt-6">
            {existingShift && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={isPending}
                className="mr-auto"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
