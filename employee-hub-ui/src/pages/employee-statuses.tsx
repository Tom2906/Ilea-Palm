import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { EmployeeStatus } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(4)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                statuses?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.displayOrder}</TableCell>
                    <TableCell>
                      <Badge
                        variant={s.active ? "outline" : "secondary"}
                        className={
                          s.active
                            ? "border-emerald-300 text-emerald-700 cursor-pointer"
                            : "cursor-pointer"
                        }
                        onClick={() =>
                          toggleMutation.mutate({
                            id: s.id,
                            active: !s.active,
                          })
                        }
                      >
                        {s.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
