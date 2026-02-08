import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import type {
  Employee,
  TrainingStatus,
  SupervisionSummary,
  SupervisionStatus,
  AppraisalMatrixRow,
  LeaveRequest,
  AuditLogEntry,
} from "@/lib/types"
import { DashboardOverview } from "@/components/dashboard-overview"

interface AppraisalMatrixResponse {
  reviewsBack: number
  rows: AppraisalMatrixRow[]
}

export default function DashboardPage() {
  const { hasPermission } = useAuth()

  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  const { data: statuses, isLoading: loadingStatuses } = useQuery({
    queryKey: ["training-status"],
    queryFn: () => api.get<TrainingStatus[]>("/training-records/status"),
  })

  const { data: supervisionSummary } = useQuery({
    queryKey: ["supervision-summary"],
    queryFn: () => api.get<SupervisionSummary>("/supervisions/summary"),
    enabled: hasPermission("supervisions.view"),
  })

  const { data: supervisionStatuses } = useQuery({
    queryKey: ["supervision-status"],
    queryFn: () => api.get<SupervisionStatus[]>("/supervisions/status"),
    enabled: hasPermission("supervisions.view"),
  })

  const { data: appraisalData } = useQuery({
    queryKey: ["appraisals-matrix"],
    queryFn: () => api.get<AppraisalMatrixResponse>("/appraisals/matrix"),
    enabled: hasPermission("appraisals.view"),
  })

  const { data: leaveRequests } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: () => api.get<LeaveRequest[]>("/leave/requests"),
    enabled: hasPermission("leave.view"),
  })

  const { data: auditLog } = useQuery({
    queryKey: ["audit-log-dashboard"],
    queryFn: () => api.get<AuditLogEntry[]>("/audit-log?limit=30"),
    enabled: hasPermission("audit_log.view"),
  })

  return (
    <div className="flex flex-col">
      <DashboardOverview
        employees={employees ?? []}
        statuses={statuses ?? []}
        loading={loadingEmployees || loadingStatuses}
        supervisionSummary={supervisionSummary}
        supervisionStatuses={supervisionStatuses}
        appraisalRows={appraisalData?.rows}
        leaveRequests={leaveRequests}
        auditLog={auditLog}
      />
    </div>
  )
}
