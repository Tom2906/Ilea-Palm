import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { RoleResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Trash2, Shield } from "lucide-react"

const PERMISSION_GROUPS: Record<string, { label: string; permissions: { key: string; label: string }[] }> = {
  employees: {
    label: "Employees",
    permissions: [
      { key: "employees.manage", label: "Manage employees" },
    ],
  },
  training: {
    label: "Training",
    permissions: [
      { key: "training_courses.manage", label: "Manage courses" },
      { key: "training_records.record", label: "Record training" },
    ],
  },
  supervisions: {
    label: "Supervisions",
    permissions: [
      { key: "supervisions.create", label: "Create supervisions" },
      { key: "supervisions.manage", label: "Manage supervisions" },
    ],
  },
  leave: {
    label: "Leave",
    permissions: [
      { key: "leave.approve", label: "Approve/reject leave" },
      { key: "leave.manage_entitlements", label: "Manage entitlements" },
    ],
  },
  other: {
    label: "Other Features",
    permissions: [
      { key: "onboarding.manage", label: "Manage onboarding" },
      { key: "appraisals.manage", label: "Manage appraisals" },
      { key: "rotas.edit", label: "Edit rotas" },
    ],
  },
  admin: {
    label: "Administration",
    permissions: [
      { key: "settings.manage", label: "Manage settings" },
      { key: "notifications.manage", label: "Manage notifications" },
      { key: "audit_log.view", label: "View audit log" },
      { key: "users.manage", label: "Manage users & roles" },
      { key: "employee_statuses.manage", label: "Manage employee statuses" },
    ],
  },
}

interface RoleFormData {
  name: string
  description: string
  dataScope: string
  permissions: string[]
}

const emptyForm: RoleFormData = {
  name: "",
  description: "",
  dataScope: "own",
  permissions: [],
}

export default function RolesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null)
  const [form, setForm] = useState<RoleFormData>(emptyForm)

  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get<RoleResponse[]>("/roles"),
  })

  const createRole = useMutation({
    mutationFn: (data: RoleFormData) => api.post<RoleResponse>("/roles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setDialogOpen(false)
    },
  })

  const updateRole = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoleFormData }) =>
      api.put<RoleResponse>(`/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setDialogOpen(false)
    },
  })

  const deleteRole = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })

  function openCreate() {
    setEditingRole(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(role: RoleResponse) {
    setEditingRole(role)
    setForm({
      name: role.name,
      description: role.description ?? "",
      dataScope: role.dataScope,
      permissions: [...role.permissions],
    })
    setDialogOpen(true)
  }

  function togglePermission(key: string) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingRole) {
      updateRole.mutate({ id: editingRole.id, data: form })
    } else {
      createRole.mutate(form)
    }
  }

  const isPending = createRole.isPending || updateRole.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Roles</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add Role
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {roles?.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{role.name}</span>
                    {role.isSystem && (
                      <Badge variant="secondary" className="text-xs">System</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {role.description && <span>{role.description}</span>}
                    <span>Scope: {role.dataScope}</span>
                    <span>{role.permissions.length} permissions</span>
                    <span>{role.userCount} user{role.userCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(role)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {!role.isSystem && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete role "${role.name}"?`))
                        deleteRole.mutate(role.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Scope</Label>
              <Select
                value={form.dataScope}
                onValueChange={(v) => setForm({ ...form, dataScope: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  <SelectItem value="reports">Direct Reports Only</SelectItem>
                  <SelectItem value="own">Own Data Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Controls which employees this role can act on for scoped permissions.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                <div key={groupKey} className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </p>
                  {group.permissions.map((perm) => (
                    <label
                      key={perm.key}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={form.permissions.includes(perm.key)}
                        onCheckedChange={() => togglePermission(perm.key)}
                      />
                      <span>{perm.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto font-mono">
                        {perm.key}
                      </span>
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : editingRole ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
