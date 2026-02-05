import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { AppraisalMatrixRow } from "@/lib/types"
import { AppraisalsMatrix } from "@/components/appraisals/appraisals-matrix"

export default function AppraisalsPage() {
  const { data: matrixRows, isLoading } = useQuery({
    queryKey: ["appraisals-matrix"],
    queryFn: () => api.get<AppraisalMatrixRow[]>("/appraisals/matrix"),
  })

  return (
    <AppraisalsMatrix
      rows={matrixRows ?? []}
      loading={isLoading}
    />
  )
}
