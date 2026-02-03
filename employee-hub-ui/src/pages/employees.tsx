import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import type { Employee } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search } from "lucide-react"

export default function EmployeesPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
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
          {isAdmin && (
            <Button size="sm" onClick={() => navigate("/employees/new")}>
              <Plus className="h-4 w-4 mr-1" />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(5)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered?.map((e) => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/employees/${e.id}`)}
                  >
                    <TableCell className="font-medium">
                      {e.firstName} {e.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.email}</TableCell>
                    <TableCell>{e.role}</TableCell>
                    <TableCell>
                      {e.statusName ? (
                        <Badge
                          variant={e.active ? "outline" : "secondary"}
                          className={
                            e.statusName === "Active"
                              ? "border-emerald-300 text-emerald-700"
                              : e.statusName === "Suspended"
                                ? "border-red-300 text-red-700"
                                : ""
                          }
                        >
                          {e.statusName}
                        </Badge>
                      ) : (
                        <Badge variant={e.active ? "outline" : "secondary"}>
                          {e.active ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(e.startDate).toLocaleDateString("en-GB")}
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
