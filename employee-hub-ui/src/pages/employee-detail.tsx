import { useState, useMemo } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { useAuth } from "@/contexts/auth-context"
import type {
  Employee,
  TrainingStatus,
  OnboardingRecord,
  EmployeeReference,
} from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { CollapsibleSection } from "@/components/collapsible-section"
import { ListRow } from "@/components/list-row"
import { TrainingCard } from "@/components/training-card"
import { ReferenceCard } from "@/components/reference-card"
import { EmployeeEditModal } from "@/components/employee-edit-modal"
import { EmployeeOverview } from "@/components/employee-overview"
import { RecordTrainingModal } from "@/components/record-training-modal"
import { SupervisionTimeline } from "@/components/supervision/supervision-timeline"
import { EmployeeAppraisalsTab } from "@/components/appraisals/employee-appraisals-tab"
import { EmployeeLeaveTab } from "@/components/leave/employee-leave-tab"
import { ArrowLeft, Settings, GraduationCap } from "lucide-react"

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [recordTrainingOpen, setRecordTrainingOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const initialTab = useMemo(() => {
    const validTabs = ["overview", "training", "onboarding", "references", "supervision", "appraisals", "leave"]
    const tabParam = searchParams.get("tab")
    return tabParam && validTabs.includes(tabParam) ? tabParam : "overview"
  }, [searchParams])
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => api.get<Employee>(`/employees/${id}`),
    enabled: !!id,
  })

  const { data: trainingStatuses, isLoading: loadingTraining } = useQuery({
    queryKey: ["training-status"],
    queryFn: () => api.get<TrainingStatus[]>("/training-records/status"),
  })

  const { data: onboardingRecords, isLoading: loadingOnboarding } = useQuery({
    queryKey: ["onboarding-records", id],
    queryFn: () => api.get<OnboardingRecord[]>(`/onboarding/employee/${id}/records`),
    enabled: !!id,
  })

  const { data: references, isLoading: loadingRefs } = useQuery({
    queryKey: ["employee-references", id],
    queryFn: () => api.get<EmployeeReference[]>(`/employees/${id}/references`),
    enabled: !!id,
  })

  const updateOnboarding = useMutation({
    mutationFn: ({ recordId, status }: { recordId: string; status: "complete" | "pending" }) =>
      api.put(`/onboarding/employee/${id}/records/${recordId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-records", id] })
    },
  })

  const employeeTraining = trainingStatuses?.filter((s) => s.employeeId === id) ?? []
  const filtered = statusFilter === "all"
    ? employeeTraining
    : employeeTraining.filter((s) => s.status === statusFilter)
  const onlineMandatory = filtered.filter((s) => s.category === "Online Mandatory")
  const f2fMandatory = filtered.filter((s) => s.category === "F2F Mandatory")
  const additional = filtered.filter((s) => s.category === "Additional")

  const statusCounts: Record<string, number> = {
    all: employeeTraining.length,
    Valid: employeeTraining.filter((s) => s.status === "Valid").length,
    "Expiring Soon": employeeTraining.filter((s) => s.status === "Expiring Soon").length,
    Expired: employeeTraining.filter((s) => s.status === "Expired").length,
    "Not Completed": employeeTraining.filter((s) => s.status === "Not Completed").length,
    Completed: employeeTraining.filter((s) => s.status === "Completed").length,
  }

  if (loadingEmployee) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Employee not found.</p>
        <Button variant="link" onClick={() => navigate("/employees")}>
          Back to Employees
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-xl border p-5">
        <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navigate("/employees")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold leading-tight">
              {employee.firstName} {employee.lastName}
            </h2>
            {employee.statusName && (
              <Badge
                variant="outline"
                className={`text-xs ${
                  employee.statusName === "Active"
                    ? "border-emerald-300 text-emerald-700"
                    : employee.statusName === "Suspended"
                      ? "border-red-300 text-red-700"
                      : ""
                }`}
              >
                {employee.statusName}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-tight">{employee.role}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{employee.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-1 shrink-0">
          {hasPermission("training_records.record") && (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Record training" onClick={() => setRecordTrainingOpen(true)}>
              <GraduationCap className="h-4 w-4" />
            </Button>
          )}
          {hasPermission("employees.edit") && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)} title="Edit employee details">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
          <TabsTrigger value="supervision">Supervision</TabsTrigger>
          <TabsTrigger value="appraisals">Appraisals</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 flex flex-col min-h-0">
          <EmployeeOverview
            employee={employee}
            training={employeeTraining}
            onboarding={onboardingRecords}
            references={references}
            loadingTraining={loadingTraining}
            statusCounts={statusCounts}
          />
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          {loadingTraining ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <>
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
                  {statusFilter === "all" ? "No training records for this employee." : "No training records match this filter."}
                </p>
              )}
            </>
          )}
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding">
          {loadingOnboarding ? (
            <Skeleton className="h-48 w-full" />
          ) : !onboardingRecords || onboardingRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">No onboarding items for this employee.</p>
          ) : (
            <div className="space-y-2">
              {onboardingRecords.map((record) => (
                <ListRow key={record.id} className="gap-3">
                  <Checkbox
                    checked={record.status === "complete"}
                    disabled={!hasPermission("onboarding.edit") || updateOnboarding.isPending}
                    onCheckedChange={(checked) => {
                      updateOnboarding.mutate({ recordId: record.id, status: checked ? "complete" : "pending" })
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{record.itemName}</p>
                    {record.itemDescription && (
                      <p className="text-xs text-muted-foreground">{record.itemDescription}</p>
                    )}
                  </div>
                  {record.completedDate && (
                    <span className="text-xs text-muted-foreground">{formatDate(record.completedDate)}</span>
                  )}
                </ListRow>
              ))}
            </div>
          )}
        </TabsContent>

        {/* References Tab */}
        <TabsContent value="references">
          {loadingRefs ? (
            <Skeleton className="h-48 w-full" />
          ) : !references || references.length === 0 ? (
            <p className="text-sm text-muted-foreground">No references recorded for this employee.</p>
          ) : (
            <div className="space-y-2">
              {references.map((r) => (
                <ReferenceCard key={r.id} data={r} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Supervision Tab */}
        <TabsContent value="supervision">
          <SupervisionTimeline
            employeeId={employee.id}
            employeeName={`${employee.firstName} ${employee.lastName}`}
            reportsTo={employee.reportsTo}
            startDate={employee.startDate}
          />
        </TabsContent>

        {/* Appraisals Tab */}
        <TabsContent value="appraisals">
          <EmployeeAppraisalsTab employeeId={employee.id} />
        </TabsContent>

        {/* Leave Tab */}
        <TabsContent value="leave">
          <EmployeeLeaveTab
            employeeId={employee.id}
            employeeName={`${employee.firstName} ${employee.lastName}`}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <EmployeeEditModal employee={employee} open={editOpen} onOpenChange={setEditOpen} />
      <RecordTrainingModal
        employeeId={employee.id}
        employeeName={`${employee.firstName} ${employee.lastName}`}
        open={recordTrainingOpen}
        onOpenChange={setRecordTrainingOpen}
      />
    </div>
  )
}
