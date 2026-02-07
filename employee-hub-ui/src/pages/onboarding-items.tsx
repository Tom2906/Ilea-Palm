import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { OnboardingItem } from "@/lib/types"
import { ListPage } from "@/components/list-page"
import { ListRow } from "@/components/list-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Plus, Pencil } from "lucide-react"

export default function OnboardingItemsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", description: "", displayOrder: 0 })
  const [error, setError] = useState("")

  const { data: items, isLoading } = useQuery({
    queryKey: ["onboarding-items"],
    queryFn: () => api.get<OnboardingItem[]>("/onboarding/items?includeInactive=true"),
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/onboarding/items", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-items"] })
      closeDialog()
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/onboarding/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-items"] })
      closeDialog()
    },
    onError: (err: Error) => setError(err.message),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.put(`/onboarding/items/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-items"] })
    },
  })

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setForm({ name: "", description: "", displayOrder: 0 })
    setError("")
  }

  const openEdit = (item: OnboardingItem) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description ?? "",
      displayOrder: item.displayOrder,
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
      displayOrder: form.displayOrder,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const filtered = useMemo(() => {
    if (!items) return []
    const term = search.toLowerCase()
    if (!term) return items
    return items.filter((i) =>
      i.name.toLowerCase().includes(term) ||
      (i.description?.toLowerCase().includes(term) ?? false)
    )
  }, [items, search])

  return (
    <ListPage
      loading={isLoading}
      itemCount={filtered.length}
      emptyMessage="No onboarding items match your search."
      searchPlaceholder="Search..."
      searchValue={search}
      onSearchChange={setSearch}
      toolbar={
        <Button
          size="sm"
          onClick={() => {
            setEditingId(null)
            setForm({ name: "", description: "", displayOrder: (items?.length ?? 0) + 1 })
            setError("")
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      }
    >
      {filtered.map((item) => (
        <ListRow key={item.id}>
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-medium shrink-0">
            {item.displayOrder}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{item.name}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            )}
          </div>
          <Badge
            variant={item.active ? "outline" : "secondary"}
            className={`text-xs shrink-0 cursor-pointer ${
              item.active
                ? "border-emerald-300 text-emerald-700"
                : ""
            }`}
            onClick={() =>
              toggleMutation.mutate({ id: item.id, active: !item.active })
            }
          >
            {item.active ? "Active" : "Inactive"}
          </Badge>
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => openEdit(item)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </ListRow>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="itemName">Name</FieldLabel>
                <Input
                  id="itemName"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="itemDesc">Description</FieldLabel>
                <Input
                  id="itemDesc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="itemOrder">Display Order</FieldLabel>
                <Input
                  id="itemOrder"
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
                  disabled={isPending}
                />
              </Field>
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
    </ListPage>
  )
}
