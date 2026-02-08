import { useState, useMemo, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { UserListResponse, RoleResponse, Employee } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Switch } from "@/components/ui/switch"
import { FilterBar } from "@/components/filter-bar"
import { ListPage } from "@/components/list-page"
import { ListRow } from "@/components/list-row"
import { Plus, KeyRound } from "lucide-react"

interface CreateForm {
  email: string
  displayName: string
  password: string
  authMethod: "password" | "microsoft" | "both"
  roleId: string
  employeeId: string
}

interface EditForm {
  roleId: string
  employeeId: string
  active: boolean
  authMethod: "password" | "microsoft" | "both"
}

interface ResetForm {
  newPassword: string
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState("")
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserListResponse | null>(null)
  const [resetUser, setResetUser] = useState<UserListResponse | null>(null)

  const [createForm, setCreateForm] = useState<CreateForm>({
    email: "", displayName: "", password: "", authMethod: "microsoft", roleId: "", employeeId: "",
  })
  const [editForm, setEditForm] = useState<EditForm>({
    roleId: "", employeeId: "", active: true, authMethod: "microsoft",
  })
  const [resetForm, setResetForm] = useState<ResetForm>({ newPassword: "" })

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<UserListResponse[]>("/users"),
  })

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get<RoleResponse[]>("/roles"),
  })

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  const toggle = useCallback((id: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback((ids: string[], hide: boolean) => {
    setHidden((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (hide ? next.add(id) : next.delete(id)))
      return next
    })
  }, [])

  const roleNames = useMemo(() => {
    if (!users) return []
    return [...new Set(users.map((u) => u.roleName))].sort()
  }, [users])

  const filterGroups = useMemo(() => [
    { label: "Role", items: roleNames.map((r) => ({ id: `role:${r}`, label: r })) },
    { label: "Status", items: [
      { id: "status:Active", label: "Active" },
      { id: "status:Inactive", label: "Inactive" },
    ]},
  ], [roleNames])

  const filtered = useMemo(() => {
    if (!users) return []
    return users.filter((u) => {
      if (hidden.has(`role:${u.roleName}`)) return false
      const status = u.active ? "Active" : "Inactive"
      if (hidden.has(`status:${status}`)) return false
      const term = search.toLowerCase()
      return (
        u.displayName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.roleName.toLowerCase().includes(term)
      )
    })
  }, [users, hidden, search])

  const createUser = useMutation({
    mutationFn: (data: CreateForm) => {
      const body: Record<string, unknown> = {
        email: data.email,
        displayName: data.displayName,
        authMethod: data.authMethod,
        roleId: data.roleId,
      }
      if (data.authMethod === "password" || data.authMethod === "both") body.password = data.password
      if (data.employeeId && data.employeeId !== "none") body.employeeId = data.employeeId
      return api.post<UserListResponse>("/users", body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setCreateOpen(false)
      setCreateForm({ email: "", displayName: "", password: "", authMethod: "microsoft", roleId: "", employeeId: "" })
    },
  })

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditForm }) => {
      const body: Record<string, unknown> = {
        roleId: data.roleId,
        active: data.active,
        authMethod: data.authMethod,
      }
      if (data.employeeId && data.employeeId !== "none") body.employeeId = data.employeeId
      else body.employeeId = null
      return api.put<UserListResponse>(`/users/${id}`, body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setEditUser(null)
    },
  })

  const resetPassword = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResetForm }) =>
      api.post(`/users/${id}/reset-password`, data),
    onSuccess: () => {
      setResetUser(null)
      setResetForm({ newPassword: "" })
    },
  })

  function openEdit(u: UserListResponse) {
    setEditUser(u)
    setEditForm({
      roleId: u.roleId,
      employeeId: u.employeeId ?? "",
      active: u.active,
      authMethod: u.authMethod,
    })
  }

  const isSelf = (id: string) => id === currentUser?.id

  return (
    <ListPage
      loading={isLoading}
      itemCount={filtered.length}
      emptyMessage="No users found."
      searchPlaceholder="Search..."
      searchValue={search}
      onSearchChange={setSearch}
      toolbar={
        <>
          <FilterBar
            filters={filterGroups}
            hidden={hidden}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onClear={() => setHidden(new Set())}
          />
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add User
          </Button>
        </>
      }
    >
      {filtered.map((u) => (
        <ListRow
          key={u.id}
          onClick={!isSelf(u.id) ? () => openEdit(u) : undefined}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{u.displayName}</span>
              <Badge variant="outline" className="text-xs">{u.roleName}</Badge>
              <Badge variant="outline" className="text-xs">
                {u.authMethod === "microsoft" ? "Microsoft" : u.authMethod === "both" ? "Both" : "Password"}
              </Badge>
              {!u.active && (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
              {isSelf(u.id) && (
                <Badge variant="secondary" className="text-xs">You</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span>{u.email}</span>
              {u.employeeName && <span>Linked: {u.employeeName}</span>}
              {u.lastLogin && (
                <span>
                  Last login: {new Date(u.lastLogin).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          {u.authMethod !== "microsoft" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                setResetUser(u)
              }}
              title="Reset password"
            >
              <KeyRound className="h-4 w-4" />
            </Button>
          )}
        </ListRow>
      ))}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createUser.mutate(createForm)
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="create-name">Display Name</Label>
              <Input
                id="create-name"
                value={createForm.displayName}
                onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Authentication Method</Label>
              <Select
                value={createForm.authMethod}
                onValueChange={(v) => setCreateForm({ ...createForm, authMethod: v as CreateForm["authMethod"], password: "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="microsoft">Microsoft</SelectItem>
                  <SelectItem value="password">Password</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(createForm.authMethod === "password" || createForm.authMethod === "both") && (
              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={createForm.roleId}
                onValueChange={(v) => setCreateForm({ ...createForm, roleId: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Linked Employee (optional)</Label>
              <Select
                value={createForm.employeeId}
                onValueChange={(v) => setCreateForm({ ...createForm, employeeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User: {editUser?.displayName}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (editUser) updateUser.mutate({ id: editUser.id, data: editForm })
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.roleId}
                onValueChange={(v) => setEditForm({ ...editForm, roleId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Linked Employee</Label>
              <Select
                value={editForm.employeeId}
                onValueChange={(v) => setEditForm({ ...editForm, employeeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Authentication Method</Label>
              <Select
                value={editForm.authMethod}
                onValueChange={(v) => setEditForm({ ...editForm, authMethod: v as EditForm["authMethod"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="microsoft">Microsoft</SelectItem>
                  <SelectItem value="password">Password</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.active}
                onCheckedChange={(v) => setEditForm({ ...editForm, active: v })}
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password: {resetUser?.displayName}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (resetUser) resetPassword.mutate({ id: resetUser.id, data: resetForm })
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={resetForm.newPassword}
                onChange={(e) => setResetForm({ newPassword: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setResetUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={resetPassword.isPending}>
                {resetPassword.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </ListPage>
  )
}
