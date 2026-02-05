import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { TrainingCourse } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { ListRow } from "@/components/list-row"
import { Plus, Pencil } from "lucide-react"

const categories = ["Online Mandatory", "F2F Mandatory", "Additional"] as const

const defaultForm = {
  name: "",
  description: "",
  category: "Online Mandatory" as string,
  validityMonths: "",
  expiryWarningDaysBefore: "30",
  notificationDaysBefore: "0",
  reminderFrequencyDays: "7",
  notifyEmployee: true,
  notifyAdmin: true,
}

export default function TrainingCoursesPage() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState("")

  const { data: courses, isLoading } = useQuery({
    queryKey: ["training-courses", categoryFilter],
    queryFn: () =>
      api.get<TrainingCourse[]>(
        `/training-courses${categoryFilter !== "all" ? `?category=${encodeURIComponent(categoryFilter)}` : ""}`
      ),
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/training-courses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] })
      closeDialog()
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/training-courses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] })
      closeDialog()
    },
    onError: (err: Error) => setError(err.message),
  })

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setForm(defaultForm)
    setError("")
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(defaultForm)
    setError("")
    setDialogOpen(true)
  }

  const openEdit = (course: TrainingCourse) => {
    setEditingId(course.id)
    setForm({
      name: course.name,
      description: course.description ?? "",
      category: course.category,
      validityMonths: course.validityMonths?.toString() ?? "",
      expiryWarningDaysBefore: course.expiryWarningDaysBefore.toString(),
      notificationDaysBefore: course.notificationDaysBefore.toString(),
      reminderFrequencyDays: course.reminderFrequencyDays.toString(),
      notifyEmployee: course.notifyEmployee,
      notifyAdmin: course.notifyAdmin,
    })
    setError("")
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const data: Record<string, unknown> = {
      name: form.name,
      description: form.description || null,
      category: form.category,
      validityMonths: form.validityMonths ? parseInt(form.validityMonths) : null,
      expiryWarningDaysBefore: parseInt(form.expiryWarningDaysBefore) || 30,
      notificationDaysBefore: parseInt(form.notificationDaysBefore) || 0,
      reminderFrequencyDays: parseInt(form.reminderFrequencyDays) || 7,
      notifyEmployee: form.notifyEmployee,
      notifyAdmin: form.notifyAdmin,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add Course
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No courses found.
        </p>
      ) : (
        <div className="space-y-2">
          {courses?.map((c) => (
            <ListRow key={c.id}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span>{c.validityMonths ? `${c.validityMonths} month validity` : "No expiry"}</span>
                  <span>{c.expiryWarningDaysBefore}d warning</span>
                  <span>{c.notificationDaysBefore}d notification</span>
                  {(c.notifyEmployee || c.notifyAdmin) && (
                    <span>
                      Notify: {[c.notifyEmployee && "Employee", c.notifyAdmin && "Admin"].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {c.category}
              </Badge>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => openEdit(c)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </ListRow>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Course" : "Add Course"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="courseName">Course Name</FieldLabel>
                <Input
                  id="courseName"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="courseDesc">Description</FieldLabel>
                <Input
                  id="courseDesc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={isPending}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="courseCategory">Category</FieldLabel>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                    disabled={isPending}
                  >
                    <SelectTrigger id="courseCategory"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="validity">Validity (months)</FieldLabel>
                  <Input
                    id="validity"
                    type="number"
                    placeholder="Empty = no expiry"
                    value={form.validityMonths}
                    onChange={(e) => setForm({ ...form, validityMonths: e.target.value })}
                    disabled={isPending}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="warningDays">Warning Days Before Expiry</FieldLabel>
                  <Input
                    id="warningDays"
                    type="number"
                    value={form.expiryWarningDaysBefore}
                    onChange={(e) => setForm({ ...form, expiryWarningDaysBefore: e.target.value })}
                    disabled={isPending}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="notifDays">Notification Days Before</FieldLabel>
                  <Input
                    id="notifDays"
                    type="number"
                    placeholder="0 = on expiry only"
                    value={form.notificationDaysBefore}
                    onChange={(e) => setForm({ ...form, notificationDaysBefore: e.target.value })}
                    disabled={isPending}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="reminderFreq">Reminder Frequency (Days)</FieldLabel>
                <Input
                  id="reminderFreq"
                  type="number"
                  value={form.reminderFrequencyDays}
                  onChange={(e) => setForm({ ...form, reminderFrequencyDays: e.target.value })}
                  disabled={isPending}
                />
              </Field>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="notifyEmp"
                    checked={form.notifyEmployee}
                    onCheckedChange={(c) => setForm({ ...form, notifyEmployee: !!c })}
                    disabled={isPending}
                  />
                  <label htmlFor="notifyEmp" className="text-sm">Notify Employee</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="notifyAdm"
                    checked={form.notifyAdmin}
                    onCheckedChange={(c) => setForm({ ...form, notifyAdmin: !!c })}
                    disabled={isPending}
                  />
                  <label htmlFor="notifyAdm" className="text-sm">Notify Admin</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isPending}>
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
  )
}
