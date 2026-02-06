import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { Employee } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ListRow } from "@/components/list-row"
import { Plus, Search } from "lucide-react"

export default function EmployeesPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [search, setSearch] = useState("")
  const [showInactive, setShowInactive] = useState(false)

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees", showInactive],
    queryFn: () =>
      api.get<Employee[]>(`/employees${showInactive ? "?includeInactive=true" : ""}`),
  })

  const filtered = employees?.filter((e) => {
    const term = search.toLowerCase()
    return (
      e.firstName.toLowerCase().includes(term) ||
      e.lastName.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term) ||
      e.role.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showInactive ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? "Showing All" : "Active Only"}
          </Button>
          {hasPermission("employees.manage") && (
            <Button size="sm" onClick={() => navigate("/employees/new")}>
              <Plus className="h-4 w-4 mr-1" />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No employees found.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered?.map((e) => (
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
        </div>
      )}
    </div>
  )
}
