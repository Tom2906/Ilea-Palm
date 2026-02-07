import { useState, useMemo, useCallback, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { Employee } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FilterBar } from "@/components/filter-bar"
import { ListPage } from "@/components/list-page"
import { ListRow } from "@/components/list-row"
import { Plus } from "lucide-react"

export default function EmployeesPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState("")
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [defaultsApplied, setDefaultsApplied] = useState(false)

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees", true],
    queryFn: () => api.get<Employee[]>("/employees?includeInactive=true"),
  })

  const statuses = useMemo(() => {
    if (!employees) return []
    return [...new Set(employees.map((e) => e.statusName ?? (e.active ? "Active" : "Inactive")))].sort()
  }, [employees])

  // Hide non-Active statuses by default
  useEffect(() => {
    if (statuses.length > 0 && !defaultsApplied) {
      const defaults = new Set<string>()
      statuses.forEach((s) => {
        if (s !== "Active") defaults.add(`status:${s}`)
      })
      if (defaults.size > 0) setHidden(defaults)
      setDefaultsApplied(true)
    }
  }, [statuses, defaultsApplied])

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

  const filterGroups = useMemo(() => [
    { label: "Status", items: statuses.map((s) => ({ id: `status:${s}`, label: s })) },
  ], [statuses])

  const filtered = useMemo(() => {
    if (!employees) return []
    return employees.filter((e) => {
      const status = e.statusName ?? (e.active ? "Active" : "Inactive")
      if (hidden.has(`status:${status}`)) return false
      const term = search.toLowerCase()
      return (
        e.firstName.toLowerCase().includes(term) ||
        e.lastName.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        e.role.toLowerCase().includes(term)
      )
    })
  }, [employees, hidden, search])

  return (
    <ListPage
      loading={isLoading}
      itemCount={filtered.length}
      emptyMessage="No employees found."
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
          {hasPermission("employees.add") && (
            <Button size="sm" onClick={() => navigate("/employees/new")}>
              <Plus className="h-4 w-4 mr-1" />
              Add Employee
            </Button>
          )}
        </>
      }
    >
      {filtered.map((e) => (
        <ListRow key={e.id} onClick={() => navigate(`/employees/${e.id}`)}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {e.firstName} {e.lastName}
            </p>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              <span>{e.email}</span>
              <span>{e.role}</span>
              <span>Started {formatDate(e.startDate)}</span>
            </div>
          </div>
          {e.statusName ? (
            <Badge
              variant={e.active ? "outline" : "secondary"}
              className={`text-xs shrink-0 ${
                e.statusName === "Active"
                  ? "border-emerald-300 text-emerald-700"
                  : e.statusName === "Suspended"
                    ? "border-red-300 text-red-700"
                    : ""
              }`}
            >
              {e.statusName}
            </Badge>
          ) : (
            <Badge variant={e.active ? "outline" : "secondary"} className="text-xs shrink-0">
              {e.active ? "Active" : "Inactive"}
            </Badge>
          )}
        </ListRow>
      ))}
    </ListPage>
  )
}
