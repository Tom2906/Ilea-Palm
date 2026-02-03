import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { EmployeeStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { ListRow } from "@/components/list-row"
import { Plus, Pencil } from "lucide-react"

export default function EmployeeStatusesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", displayOrder: 0 })
  const [error, setError] = useState("")

  const { data: statuses, isLoading } = useQuery({
    queryKey: ["employee-statuses", true],
    queryFn: () =>
      api.get<EmployeeStatus[]>("/employee-statuses?includeInactive=true"),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; displayOrder: number }) =>
      api.post("/employee-statuses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-statuses"] })
      closeDialog()
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Record<string, unknown>
    }) => api.put(`/employee-statuses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-statuses"] })
      closeDialog()
    },
    onError: (err: Error) => setError(err.message),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.put(`/employee-statuses/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-statuses"] })
    },
  })

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setForm({ name: "", displayOrder: 0 })
    setError("")
  }

  const openEdit = (status: EmployeeStatus) => {
    setEditingId(status.id)
    setForm({ name: status.name, displayOrder: status.displayOrder })
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Employee Statuses</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => {
                setEditingId(null)
                setForm({ name: "", displayOrder: 0 })
                setError("")
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Status" : "Add Status"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {error && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <Field>
                  <FieldLabel htmlFor="statusName">Name</FieldLabel>
                  <Input
                    id="statusName"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    disabled={isPending}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="displayOrder">Display Order</FieldLabel>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        displayOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    disabled={isPending}
                  />
                </Field>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeDialog}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {statuses?.map((s) => (
            <ListRow key={s.id}>
              <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-medium shrink-0">
                {s.displayOrder}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.name}</p>
              </div>
              <Badge
                variant={s.active ? "outline" : "secondary"}
                className={`text-xs shrink-0 cursor-pointer ${
                  s.active
                    ? "border-emerald-300 text-emerald-700"
                    : ""
                }`}
                onClick={() =>
                  toggleMutation.mutate({ id: s.id, active: !s.active })
                }
              >
                {s.active ? "Active" : "Inactive"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => openEdit(s)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </ListRow>
          ))}
        </div>
      )}
    </div>
  )
}
