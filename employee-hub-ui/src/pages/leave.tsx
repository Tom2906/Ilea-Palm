import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { formatDate } from "@/lib/format"
import type { LeaveRequest } from "@/lib/types"
import { useFilterToggle } from "@/hooks/use-filter-toggle"
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge"
import { LeaveRequestModal } from "@/components/leave/leave-request-modal"
import { ListPage } from "@/components/list-page"
import { ListRow } from "@/components/list-row"
import { FilterBar } from "@/components/filter-bar"
import { Button } from "@/components/ui/button"
import { Plus, Check, X } from "lucide-react"

const allStatuses = ["pending", "approved", "rejected", "cancelled"] as const

function formatStatus(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function LeavePage() {
  const { hasPermission, user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const { hidden, toggle, toggleAll, clear } = useFilterToggle()
  const [requestOpen, setRequestOpen] = useState(false)

  const { data: requests, isLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: () => api.get<LeaveRequest[]>("/leave/requests"),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/leave/requests/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] })
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] })
    },
  })

  const filterGroups = useMemo(() => [
    { label: "Status", items: allStatuses.map((s) => ({ id: `status:${s}`, label: formatStatus(s) })) },
  ], [])

  const filtered = useMemo(() => {
    if (!requests) return []
    return requests.filter((req) => {
      if (hidden.has(`status:${req.status}`)) return false
      const term = search.toLowerCase()
      return (
        req.employeeName.toLowerCase().includes(term) ||
        (req.notes?.toLowerCase().includes(term) ?? false)
      )
    })
  }, [requests, hidden, search])

  return (
    <ListPage
      loading={isLoading}
      itemCount={filtered.length}
      emptyMessage="No leave requests match your filters."
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
            onClear={clear}
          />
          <Button variant="outline" size="sm" onClick={() => setRequestOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Request Leave
          </Button>
        </>
      }
    >
      {filtered.map((req) => (
        <ListRow key={req.id}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{req.employeeName}</span>
              <LeaveStatusBadge status={req.status} />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatDate(req.startDate)} — {formatDate(req.endDate)}
              {" "}({req.totalDays} day{req.totalDays !== 1 ? "s" : ""})
              {req.notes && <> &mdash; {req.notes}</>}
            </div>
            {req.approvedByName && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {req.status === "approved" ? "Approved" : req.status === "rejected" ? "Rejected" : "Reviewed"} by {req.approvedByName}
              </div>
            )}
          </div>
          {req.status === "pending" && hasPermission("leave.approve") && (
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() =>
                  statusMutation.mutate({ id: req.id, status: "approved" })
                }
                disabled={statusMutation.isPending}
                title="Approve"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() =>
                  statusMutation.mutate({ id: req.id, status: "rejected" })
                }
                disabled={statusMutation.isPending}
                title="Reject"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {req.status === "approved" && req.employeeId === user?.employeeId && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground shrink-0"
              onClick={() =>
                statusMutation.mutate({ id: req.id, status: "cancelled" })
              }
              disabled={statusMutation.isPending}
            >
              Cancel
            </Button>
          )}
        </ListRow>
      ))}

      <LeaveRequestModal open={requestOpen} onOpenChange={setRequestOpen} />
    </ListPage>
  )
}
