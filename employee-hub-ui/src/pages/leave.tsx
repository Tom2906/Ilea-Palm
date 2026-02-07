import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { formatDate } from "@/lib/format"
import type { LeaveRequest } from "@/lib/types"
import { LeaveStatusBadge } from "@/components/leave/leave-status-badge"
import { LeaveRequestModal } from "@/components/leave/leave-request-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Check, X } from "lucide-react"

const tabs = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All" },
] as const

type TabKey = (typeof tabs)[number]["key"]

export default function LeavePage() {
  const { hasPermission, user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabKey>("pending")
  const [requestOpen, setRequestOpen] = useState(false)

  const statusParam = activeTab === "all" ? undefined : activeTab
  const { data: requests, isLoading } = useQuery({
    queryKey: ["leave-requests", statusParam],
    queryFn: () =>
      api.get<LeaveRequest[]>(
        `/leave/requests${statusParam ? `?status=${statusParam}` : ""}`,
      ),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/leave/requests/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] })
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] })
    },
  })

  const tabCounts: Record<string, number | undefined> = {}
  // We only show count for the active tab
  if (requests) tabCounts[activeTab] = requests.length

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Annual Leave</h1>
        <Button variant="outline" size="sm" onClick={() => setRequestOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Request Leave
        </Button>
      </div>

      {/* Tab filters */}
      <div className="flex gap-1.5">
        {tabs.map((tab) => (
          <Badge
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            className={`cursor-pointer text-xs ${activeTab === tab.key ? "" : "hover:bg-muted"}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tabCounts[tab.key] != null && ` (${tabCounts[tab.key]})`}
          </Badge>
        ))}
      </div>

      {/* Request list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !requests || requests.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No {activeTab === "all" ? "" : activeTab + " "}leave requests found.
        </p>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
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
            </div>
          ))}
        </div>
      )}

      <LeaveRequestModal open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  )
}
