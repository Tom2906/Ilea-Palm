import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { TrainingStatus, TrainingCourse, Employee } from "@/lib/types"
import { TrainingMatrixView } from "@/components/training-matrix-view"

export default function TrainingMatrixPage() {
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ["training-courses"],
    queryFn: () => api.get<TrainingCourse[]>("/training-courses"),
  })

  const { data: statuses, isLoading: loadingStatuses } = useQuery({
    queryKey: ["training-status"],
    queryFn: () => api.get<TrainingStatus[]>("/training-records/status"),
  })

  return (
    <TrainingMatrixView
      employees={employees ?? []}
      courses={courses ?? []}
      statuses={statuses ?? []}
      loading={loadingEmployees || loadingCourses || loadingStatuses}
    />
  )
}
