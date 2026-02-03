import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Employee, TrainingStatus } from "@/lib/types"
import { DashboardOverview } from "@/components/dashboard-overview"

export default function DashboardPage() {
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  const { data: statuses, isLoading: loadingStatuses } = useQuery({
    queryKey: ["training-status"],
    queryFn: () => api.get<TrainingStatus[]>("/training-records/status"),
  })

  return (
    <div className="h-full flex flex-col">
      <DashboardOverview
        employees={employees ?? []}
        statuses={statuses ?? []}
        loading={loadingEmployees || loadingStatuses}
      />
    </div>
  )
}
