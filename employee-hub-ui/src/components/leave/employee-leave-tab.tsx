import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { formatDate } from "@/lib/format"
import type { LeaveRequest } from "@/lib/types"
import { LeaveBalanceCard } from "./leave-balance-card"
import { LeaveStatusBadge } from "./leave-status-badge"
import { LeaveRequestModal } from "./leave-request-modal"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Check, X } from "lucide-react"

interface EmployeeLeaveTabProps {
  employeeId: string
  employeeName: string
}

export function EmployeeLeaveTab({ employeeId, employeeName }: EmployeeLeaveTabProps) {
  const { hasPermission, canManageEmployee, dataScope } = useAuth()
  const queryClient = useQueryClient()
  const [requestOpen, setRequestOpen] = useState(false)
  const currentYear = new Date().getFullYear()

  const { data: requests, isLoading } = useQuery({
    queryKey: ["leave-requests", employeeId],
    queryFn: () => api.get<LeaveRequest[]>(`/leave/requests?employeeId=${employeeId}`),
    enabled: !!employeeId,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/leave/requests/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] })
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] })
    },
  })

  const canApprove = canManageEmployee(employeeId)

  return (
    <div className="space-y-4">
      <LeaveBalanceCard employeeId={employeeId} year={currentYear} />

      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Leave Requests</h4>
        {(dataScope === "all" || employeeId) && (
          <Button variant="outline" size="sm" onClick={() => setRequestOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Request Leave
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !requests || requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No leave requests.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <div key={req.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatDate(req.startDate)} — {formatDate(req.endDate)}
                  </span>
                  <LeaveStatusBadge status={req.status} />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {req.totalDays} day{req.totalDays !== 1 ? "s" : ""}
                  {req.notes && <> &mdash; {req.notes}</>}
                </div>
              </div>
              {req.status === "pending" && canApprove && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => statusMutation.mutate({ id: req.id, status: "approved" })}
                    disabled={statusMutation.isPending}
                    title="Approve"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => statusMutation.mutate({ id: req.id, status: "rejected" })}
                    disabled={statusMutation.isPending}
                    title="Reject"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <LeaveRequestModal
        open={requestOpen}
        onOpenChange={setRequestOpen}
        employeeId={employeeId}
        employeeName={employeeName}
      />
    </div>
  )
}
