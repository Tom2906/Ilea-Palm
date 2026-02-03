import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import type {
  Employee,
  TrainingStatus,
  OnboardingRecord,
  EmployeeReference,
} from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Pencil } from "lucide-react"

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Expired":
      return <Badge variant="destructive">Expired</Badge>
    case "Expiring Soon":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">
          Expiring Soon
        </Badge>
      )
    case "Valid":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100">
          Valid
        </Badge>
      )
    case "Completed":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100">
          Completed
        </Badge>
      )
    default:
      return <Badge variant="secondary">Not Completed</Badge>
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-GB")
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()

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
    mutationFn: ({
      recordId,
      status,
    }: {
      recordId: string
      status: "complete" | "pending"
    }) =>
      api.put(`/onboarding/employee/${id}/records/${recordId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-records", id] })
    },
  })

  const employeeTraining = trainingStatuses?.filter((s) => s.employeeId === id) ?? []
  const onlineMandatory = employeeTraining.filter((s) => s.category === "Online Mandatory")
  const f2fMandatory = employeeTraining.filter((s) => s.category === "F2F Mandatory")
  const additional = employeeTraining.filter((s) => s.category === "Additional")

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/employees")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold">
            {employee.firstName} {employee.lastName}
          </h2>
          <p className="text-sm text-muted-foreground">{employee.role}</p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/employees/${id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Email</span>
              <p className="font-medium">{employee.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Department</span>
              <p className="font-medium">{employee.department ?? "-"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Start Date</span>
              <p className="font-medium">{formatDate(employee.startDate)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="font-medium">
                {employee.statusName ? (
                  <Badge
                    variant="outline"
                    className={
                      employee.statusName === "Active"
                        ? "border-emerald-300 text-emerald-700"
                        : employee.statusName === "Suspended"
                          ? "border-red-300 text-red-700"
                          : ""
                    }
                  >
                    {employee.statusName}
                  </Badge>
                ) : (
                  employee.active ? "Active" : "Inactive"
                )}
              </p>
            </div>
            {employee.notes && (
              <div className="col-span-2 md:col-span-4">
                <span className="text-muted-foreground">Notes</span>
                <p className="font-medium">{employee.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="training">
        <TabsList>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          {loadingTraining ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <>
              {[
                { title: "Online Mandatory", items: onlineMandatory },
                { title: "F2F Mandatory", items: f2fMandatory },
                { title: "Additional", items: additional },
              ].map(({ title, items }) =>
                items.length > 0 ? (
                  <Card key={title}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>Completed</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Days</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((s) => (
                            <TableRow key={s.courseId}>
                              <TableCell className="font-medium">
                                {s.courseName}
                              </TableCell>
                              <TableCell>{formatDate(s.completionDate)}</TableCell>
                              <TableCell>{formatDate(s.expiryDate)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {s.daysUntilExpiry !== null
                                  ? s.daysUntilExpiry < 0
                                    ? `${Math.abs(s.daysUntilExpiry)}d overdue`
                                    : `${s.daysUntilExpiry}d`
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={s.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : null
              )}
              {employeeTraining.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No training records for this employee.
                </p>
              )}
            </>
          )}
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding">
          <Card>
            <CardContent className="pt-6">
              {loadingOnboarding ? (
                <Skeleton className="h-48 w-full" />
              ) : !onboardingRecords || onboardingRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No onboarding items for this employee.
                </p>
              ) : (
                <div className="space-y-3">
                  {onboardingRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={record.status === "complete"}
                        disabled={!isAdmin || updateOnboarding.isPending}
                        onCheckedChange={(checked) => {
                          updateOnboarding.mutate({
                            recordId: record.id,
                            status: checked ? "complete" : "pending",
                          })
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{record.itemName}</div>
                        {record.itemDescription && (
                          <div className="text-xs text-muted-foreground">
                            {record.itemDescription}
                          </div>
                        )}
                      </div>
                      {record.completedDate && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(record.completedDate)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* References Tab */}
        <TabsContent value="references">
          <Card>
            <CardContent className="p-0">
              {loadingRefs ? (
                <div className="p-6">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : !references || references.length === 0 ? (
                <div className="p-6">
                  <p className="text-sm text-muted-foreground">
                    No references recorded for this employee.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Verbal</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Received Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {references.map((ref) => (
                      <TableRow key={ref.id}>
                        <TableCell>{ref.referenceNumber}</TableCell>
                        <TableCell className="font-medium">
                          {ref.contactName ?? "-"}
                        </TableCell>
                        <TableCell>{ref.contactCompany ?? "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={ref.received ? "default" : "secondary"}
                            className={
                              ref.received
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : ""
                            }
                          >
                            {ref.received ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={ref.verbalRef ? "default" : "secondary"}
                            className={
                              ref.verbalRef
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : ""
                            }
                          >
                            {ref.verbalRef ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(ref.dateRequested)}</TableCell>
                        <TableCell>{formatDate(ref.dateReceived)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
