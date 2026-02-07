import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { AppraisalMatrixRow, CompanySettings } from "@/lib/types"
import { AppraisalsGrid } from "@/components/appraisals/appraisals-grid"

interface MatrixResponse {
  reviewsBack: number
  rows: AppraisalMatrixRow[]
}

export default function AppraisalsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["appraisals-matrix"],
    queryFn: () => api.get<MatrixResponse>("/appraisals/matrix"),
  })

  const { data: settings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => api.get<CompanySettings>("/companysettings"),
  })

  return (
    <AppraisalsGrid
      rows={data?.rows ?? []}
      reviewsBack={data?.reviewsBack ?? 2}
      loading={isLoading}
      settings={settings}
    />
  )
}
