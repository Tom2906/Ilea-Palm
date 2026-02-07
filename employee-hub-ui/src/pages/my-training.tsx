import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import type { TrainingStatus } from "@/lib/types"
import { RecordTrainingModal } from "@/components/record-training-modal"
import { CollapsibleSection } from "@/components/collapsible-section"
import { TrainingCard } from "@/components/training-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { GraduationCap } from "lucide-react"

export default function MyTrainingPage() {
  const { user } = useAuth()
  const employeeId = user?.employeeId
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [recordOpen, setRecordOpen] = useState(false)

  const { data: trainingStatuses, isLoading } = useQuery({
    queryKey: ["training-status"],
    queryFn: () => api.get<TrainingStatus[]>("/training-records/status"),
    enabled: !!employeeId,
  })

  if (!employeeId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Your account is not linked to an employee record. Contact an administrator to link your account.
        </p>
      </div>
    )
  }

  const myTraining = trainingStatuses?.filter((s) => s.employeeId === employeeId) ?? []
  const filtered = statusFilter === "all"
    ? myTraining
    : myTraining.filter((s) => s.status === statusFilter)
  const onlineMandatory = filtered.filter((s) => s.category === "Online Mandatory")
  const f2fMandatory = filtered.filter((s) => s.category === "F2F Mandatory")
  const additional = filtered.filter((s) => s.category === "Additional")

  const statusCounts: Record<string, number> = {
    all: myTraining.length,
    Valid: myTraining.filter((s) => s.status === "Valid").length,
    "Expiring Soon": myTraining.filter((s) => s.status === "Expiring Soon").length,
    Expired: myTraining.filter((s) => s.status === "Expired").length,
    "Not Completed": myTraining.filter((s) => s.status === "Not Completed").length,
    Completed: myTraining.filter((s) => s.status === "Completed").length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: "all", label: "All" },
              { key: "Valid", label: "Valid" },
              { key: "Expiring Soon", label: "Expiring Soon" },
              { key: "Expired", label: "Expired" },
              { key: "Not Completed", label: "Not Completed" },
              { key: "Completed", label: "Completed" },
            ] as const
          )
            .filter(({ key }) => key === "all" || statusCounts[key] > 0)
            .map(({ key, label }) => (
              <Badge
                key={key}
                variant={statusFilter === key ? "default" : "outline"}
                className={`cursor-pointer text-xs ${statusFilter === key ? "" : "hover:bg-muted"}`}
                onClick={() => setStatusFilter(key)}
              >
                {label} ({statusCounts[key]})
              </Badge>
            ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setRecordOpen(true)}>
          <GraduationCap className="h-3.5 w-3.5 mr-1" />
          Record Training
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          {[
            { title: "Online Mandatory", items: onlineMandatory },
            { title: "F2F Mandatory", items: f2fMandatory },
            { title: "Additional", items: additional },
          ].map(({ title, items }) =>
            items.length > 0 ? (
              <CollapsibleSection key={title} title={title} count={items.length} countLabel={items.length === 1 ? "course" : "courses"}>
                <div className="space-y-2">
                  {items.map((s) => (
                    <TrainingCard key={s.courseId} data={s} />
                  ))}
                </div>
              </CollapsibleSection>
            ) : null
          )}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {statusFilter === "all" ? "No training assigned." : "No training records match this filter."}
            </p>
          )}
        </>
      )}

      <RecordTrainingModal
        employeeId={employeeId}
        employeeName={user.displayName}
        open={recordOpen}
        onOpenChange={setRecordOpen}
      />
    </div>
  )
}
