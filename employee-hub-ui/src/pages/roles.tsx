import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { RoleResponse } from "@/lib/types"
import { ListPage } from "@/components/list-page"
import { ListRow } from "@/components/list-row"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, Shield, ChevronLeft, ChevronRight } from "lucide-react"

interface PageRow {
  page: string
  accessKeys: string[]
  editKeys: string[]
}

interface PermissionTab {
  label: string
  pages: PageRow[]
}

const PERMISSION_TABS: PermissionTab[] = [
  {
    label: "Training",
    pages: [
      {
        page: "Training Matrix",
        accessKeys: ["training_matrix.view"],
        editKeys: ["training_records.record"],
      },
      {
        page: "Training Courses",
        accessKeys: ["training_courses.view"],
        editKeys: ["training_courses.add", "training_courses.edit", "training_courses.delete"],
      },
    ],
  },
  {
    label: "Reviews",
    pages: [
      {
        page: "Supervisions",
        accessKeys: ["supervisions.view"],
        editKeys: ["supervisions.add", "supervisions.edit", "supervisions.delete"],
      },
      {
        page: "Appraisals",
        accessKeys: ["appraisals.view"],
        editKeys: ["appraisals.add", "appraisals.edit", "appraisals.delete"],
      },
    ],
  },
  {
    label: "Rotas",
    pages: [
      {
        page: "Rotas",
        accessKeys: ["rotas.view"],
        editKeys: ["rotas.add", "rotas.edit", "rotas.delete"],
      },
    ],
  },
  {
    label: "Leave",
    pages: [
      {
        page: "Leave",
        accessKeys: ["leave.view"],
        editKeys: ["leave.approve", "leave.manage_entitlements"],
      },
    ],
  },
  {
    label: "Tools",
    pages: [
      {
        page: "Day in the Life",
        accessKeys: ["day_in_life.use"],
        editKeys: [],
      },
    ],
  },
  {
    label: "Administration",
    pages: [
      { page: "Dashboard", accessKeys: ["dashboard.view"], editKeys: [] },
      {
        page: "Employees",
        accessKeys: ["employees.view"],
        editKeys: ["employees.add", "employees.edit", "employees.delete"],
      },
      {
        page: "Onboarding",
        accessKeys: ["onboarding.view"],
        editKeys: ["onboarding.add", "onboarding.edit", "onboarding.delete"],
      },
      { page: "Settings", accessKeys: ["settings.manage"], editKeys: [] },
      { page: "Users & Roles", accessKeys: ["users.manage"], editKeys: [] },
      { page: "Audit Log", accessKeys: ["audit_log.view"], editKeys: [] },
      { page: "Notifications", accessKeys: ["notifications.manage"], editKeys: [] },
      { page: "Employee Statuses", accessKeys: ["employee_statuses.manage"], editKeys: [] },
      { page: "Personal Views", accessKeys: ["gridviews.personal.manage"], editKeys: [] },
      { page: "Company Default Views", accessKeys: ["gridviews.manage"], editKeys: [] },
    ],
  },
]

interface RoleFormData {
  name: string
  description: string
  permissions: Record<string, string>
}

const emptyForm: RoleFormData = {
  name: "",
  description: "",
  permissions: {},
}

function hasAccess(perms: Record<string, string>, row: PageRow): boolean {
  return row.accessKeys.every((k) => k in perms)
}

function hasEdit(perms: Record<string, string>, row: PageRow): boolean {
  return row.editKeys.length > 0 && row.editKeys.every((k) => k in perms)
}

export default function RolesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null)
  const [form, setForm] = useState<RoleFormData>(emptyForm)
  const tabsListRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function checkScroll() {
    const el = tabsListRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    if (!dialogOpen) return
    const timer = setTimeout(checkScroll, 150)
    window.addEventListener("resize", checkScroll)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", checkScroll)
    }
  }, [dialogOpen])

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
    requestAnimationFrame(checkScroll)
  }

  function openEdit(role: RoleResponse) {
    setEditingRole(role)
    setForm({
      name: role.name,
      description: role.description ?? "",
      permissions: { ...role.permissions },
    })
    setDialogOpen(true)
    requestAnimationFrame(checkScroll)
  }

  function toggleAccess(row: PageRow, checked: boolean) {
    setForm((prev) => {
      const perms = { ...prev.permissions }
      if (checked) {
        for (const k of row.accessKeys) perms[k] = "all"
      } else {
        for (const k of [...row.accessKeys, ...row.editKeys]) delete perms[k]
      }
      return { ...prev, permissions: perms }
    })
  }

  function toggleEdit(row: PageRow, checked: boolean) {
    setForm((prev) => {
      const perms = { ...prev.permissions }
      if (checked) {
        for (const k of row.accessKeys) perms[k] = "all"
        for (const k of row.editKeys) perms[k] = "all"
      } else {
        for (const k of row.editKeys) delete perms[k]
      }
      return { ...prev, permissions: perms }
    })
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

  const permCount = (perms: Record<string, string>) => Object.keys(perms).length

  const filtered = useMemo(() => {
    if (!roles) return []
    const term = search.toLowerCase()
    if (!term) return roles
    return roles.filter((r) =>
      r.name.toLowerCase().includes(term) ||
      (r.description?.toLowerCase().includes(term) ?? false)
    )
  }, [roles, search])

  return (
    <ListPage
      loading={isLoading}
      itemCount={filtered.length}
      emptyMessage="No roles match your search."
      searchPlaceholder="Search..."
      searchValue={search}
      onSearchChange={setSearch}
      toolbar={
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add Role
        </Button>
      }
    >
      {filtered.map((role) => (
        <ListRow key={role.id}>
          <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{role.name}</span>
              {role.isSystem && (
                <Badge variant="secondary" className="text-xs">System</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              {role.description && <span>{role.description}</span>}
              <span>{permCount(role.permissions)} permissions</span>
              <span>{role.userCount} user{role.userCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
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
        </ListRow>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] h-[64vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <Label className="mb-2 block">Permissions</Label>

              <Tabs defaultValue={PERMISSION_TABS[0].label} className="flex flex-col">
                <div className="relative">
                  <TabsList
                    ref={tabsListRef}
                    className="w-full justify-start flex-nowrap h-auto gap-1 p-1 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: "none" }}
                    onScroll={checkScroll}
                  >
                    {PERMISSION_TABS.map((tab) => {
                      const granted = tab.pages.flatMap((p) => [...p.accessKeys, ...p.editKeys])
                        .filter((k) => k in form.permissions).length
                      return (
                        <TabsTrigger key={tab.label} value={tab.label} className="text-xs px-3 py-1.5 shrink-0">
                          {tab.label}
                          {granted > 0 && (
                            <span className="ml-1.5 text-[10px] bg-primary/15 text-primary rounded-full px-1.5">
                              {granted}
                            </span>
                          )}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                  {canScrollLeft && (
                    <button
                      type="button"
                      className="absolute left-0 top-0 bottom-0 flex items-center pl-1 pr-2 bg-gradient-to-r from-muted via-muted/60 to-transparent rounded-l-md"
                      onClick={() => tabsListRef.current?.scrollBy({ left: -120, behavior: "smooth" })}
                    >
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  {canScrollRight && (
                    <button
                      type="button"
                      className="absolute right-0 top-0 bottom-0 flex items-center pr-1 pl-2 bg-gradient-to-l from-muted via-muted/60 to-transparent rounded-r-md"
                      onClick={() => tabsListRef.current?.scrollBy({ left: 120, behavior: "smooth" })}
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {PERMISSION_TABS.map((tab) => (
                  <TabsContent key={tab.label} value={tab.label} className="mt-3">
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Page</th>
                            <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-24">Access</th>
                            {tab.pages.some((p) => p.editKeys.length > 0) && (
                              <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-24">Edit</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {tab.pages.map((row) => (
                            <tr key={row.page} className="border-t">
                              <td className="px-4 py-2.5">
                                <span className="text-sm font-medium">{row.page}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <Checkbox
                                  checked={hasAccess(form.permissions, row)}
                                  onCheckedChange={(checked) => toggleAccess(row, !!checked)}
                                />
                              </td>
                              {tab.pages.some((p) => p.editKeys.length > 0) && (
                                <td className="px-4 py-2.5 text-center">
                                  {row.editKeys.length > 0 ? (
                                    <Checkbox
                                      checked={hasEdit(form.permissions, row)}
                                      onCheckedChange={(checked) => toggleEdit(row, !!checked)}
                                    />
                                  ) : null}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => tab.pages.forEach((row) => {
                          toggleAccess(row, true)
                          if (row.editKeys.length > 0) toggleEdit(row, true)
                        })}
                      >
                        Grant All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => tab.pages.forEach((row) => toggleAccess(row, false))}
                      >
                        Revoke All
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
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
    </ListPage>
  )
}
