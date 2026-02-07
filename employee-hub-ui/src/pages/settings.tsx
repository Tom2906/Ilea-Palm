import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { CompanySettings, Employee, EmployeeStatus, MonthlyHours } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function SaveBar({ dirty, pending, onReset }: { dirty: boolean; pending: boolean; onReset: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      {dirty && (
        <Button type="button" variant="outline" onClick={onReset} disabled={pending}>
          Reset
        </Button>
      )}
      <Button type="submit" disabled={pending || !dirty}>
        {pending ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => api.get<CompanySettings>("/companysettings"),
  })

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  const { data: employeeStatuses } = useQuery({
    queryKey: ["employee-statuses"],
    queryFn: () => api.get<EmployeeStatus[]>("/employee-statuses"),
  })

  // Get unique roles from employees
  const roles = useMemo(() => {
    if (!employees) return []
    return [...new Set(employees.map((e) => e.role).filter(Boolean))].sort()
  }, [employees])

  // Rota monthly hours state
  const [rotaYear, setRotaYear] = useState(new Date().getFullYear())
  const [rotaHours, setRotaHours] = useState<Record<number, string>>({})

  const { data: monthlyHours } = useQuery({
    queryKey: ["monthly-hours", rotaYear],
    queryFn: () => api.get<MonthlyHours[]>(`/rota/monthly-hours?year=${rotaYear}`),
  })

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  const getMonthHours = (month: number): string => {
    if (rotaHours[month] !== undefined) return rotaHours[month]
    const existing = monthlyHours?.find((h) => h.month === month)
    return existing ? String(existing.contractedHours) : ""
  }

  const rotaDirty = Object.keys(rotaHours).length > 0

  const [form, setForm] = useState<Partial<CompanySettings>>({})

  // Sync form with loaded settings
  const currentForm = {
    companyName: form.companyName ?? settings?.companyName ?? "",
    defaultExpiryWarningDays: form.defaultExpiryWarningDays ?? settings?.defaultExpiryWarningDays ?? 30,
    defaultNotificationDaysBefore: form.defaultNotificationDaysBefore ?? settings?.defaultNotificationDaysBefore ?? 0,
    defaultReminderFrequencyDays: form.defaultReminderFrequencyDays ?? settings?.defaultReminderFrequencyDays ?? 7,
    defaultNotifyEmployee: form.defaultNotifyEmployee ?? settings?.defaultNotifyEmployee ?? true,
    defaultNotifyAdmin: form.defaultNotifyAdmin ?? settings?.defaultNotifyAdmin ?? true,
    defaultSupervisionFrequencyMonths: form.defaultSupervisionFrequencyMonths ?? settings?.defaultSupervisionFrequencyMonths ?? 1,
    supervisionMonthsBack: form.supervisionMonthsBack ?? settings?.supervisionMonthsBack ?? 9,
    supervisionMonthsForward: form.supervisionMonthsForward ?? settings?.supervisionMonthsForward ?? 3,
    appraisalReviewsBack: form.appraisalReviewsBack ?? settings?.appraisalReviewsBack ?? 2,
    appraisalReviewsForward: form.appraisalReviewsForward ?? settings?.appraisalReviewsForward ?? 2,
    defaultHiddenRoles: form.defaultHiddenRoles ?? settings?.defaultHiddenRoles ?? [],
    defaultHiddenEmployeeStatuses: form.defaultHiddenEmployeeStatuses ?? settings?.defaultHiddenEmployeeStatuses ?? [],
    defaultHiddenRotaRoles: form.defaultHiddenRotaRoles ?? settings?.defaultHiddenRotaRoles ?? [],
    defaultHiddenRotaEmployeeStatuses: form.defaultHiddenRotaEmployeeStatuses ?? settings?.defaultHiddenRotaEmployeeStatuses ?? [],
  }

  const toggleHiddenRole = (role: string) => {
    const current = currentForm.defaultHiddenRoles
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role]
    setForm({ ...form, defaultHiddenRoles: next })
  }

  const toggleHiddenStatus = (status: string) => {
    const current = currentForm.defaultHiddenEmployeeStatuses
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    setForm({ ...form, defaultHiddenEmployeeStatuses: next })
  }

  const toggleHiddenRotaRole = (role: string) => {
    const current = currentForm.defaultHiddenRotaRoles
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role]
    setForm({ ...form, defaultHiddenRotaRoles: next })
  }

  const toggleHiddenRotaStatus = (status: string) => {
    const current = currentForm.defaultHiddenRotaEmployeeStatuses
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    setForm({ ...form, defaultHiddenRotaEmployeeStatuses: next })
  }

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CompanySettings>) =>
      api.put<CompanySettings>("/companysettings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] })
      setForm({})
      setSuccess(true)
      setError("")
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setError(err.message)
      setSuccess(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      // Save monthly hours if changed
      if (rotaDirty) {
        const changed = Object.keys(rotaHours).map(Number)
        for (const m of changed) {
          const val = rotaHours[m]
          if (val && !isNaN(parseFloat(val))) {
            await api.post("/rota/monthly-hours", {
              year: rotaYear,
              month: m,
              contractedHours: parseFloat(val),
            })
          }
        }
        queryClient.invalidateQueries({ queryKey: ["monthly-hours", rotaYear] })
        setRotaHours({})
      }
      // Save settings if changed
      if (Object.keys(form).length > 0) {
        updateMutation.mutate({
          companyName: currentForm.companyName,
          defaultExpiryWarningDays: currentForm.defaultExpiryWarningDays,
          defaultNotificationDaysBefore: currentForm.defaultNotificationDaysBefore,
          defaultReminderFrequencyDays: currentForm.defaultReminderFrequencyDays,
          defaultNotifyEmployee: currentForm.defaultNotifyEmployee,
          defaultNotifyAdmin: currentForm.defaultNotifyAdmin,
          defaultSupervisionFrequencyMonths: currentForm.defaultSupervisionFrequencyMonths,
          supervisionMonthsBack: currentForm.supervisionMonthsBack,
          supervisionMonthsForward: currentForm.supervisionMonthsForward,
          appraisalReviewsBack: currentForm.appraisalReviewsBack,
          appraisalReviewsForward: currentForm.appraisalReviewsForward,
          defaultHiddenRoles: currentForm.defaultHiddenRoles,
          defaultHiddenEmployeeStatuses: currentForm.defaultHiddenEmployeeStatuses,
          defaultHiddenRotaRoles: currentForm.defaultHiddenRotaRoles,
          defaultHiddenRotaEmployeeStatuses: currentForm.defaultHiddenRotaEmployeeStatuses,
        })
      } else if (rotaDirty) {
        // Only hours changed, show success manually
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const isDirty = Object.keys(form).length > 0 || rotaDirty

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Settings saved successfully
        </div>
      )}

      <Tabs defaultValue="company" className="w-full">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="supervision">Supervision</TabsTrigger>
          <TabsTrigger value="rota">Rota</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>General company details</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
                  <Input
                    id="companyName"
                    className="max-w-md"
                    value={currentForm.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    disabled={updateMutation.isPending}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Matrix Default Filters</CardTitle>
              <CardDescription>
                Hide these roles and statuses by default on Training and Supervision matrices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Hidden Roles</FieldLabel>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {roles.map((role) => (
                      <div key={role} className="flex items-center gap-2">
                        <Checkbox
                          id={`role-${role}`}
                          checked={currentForm.defaultHiddenRoles.includes(role)}
                          onCheckedChange={() => toggleHiddenRole(role)}
                          disabled={updateMutation.isPending}
                        />
                        <label htmlFor={`role-${role}`} className="text-sm">{role}</label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Employees with these roles will be hidden by default
                  </p>
                </Field>
                <Field>
                  <FieldLabel>Hidden Employee Statuses</FieldLabel>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {employeeStatuses?.map((status) => (
                      <div key={status.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`status-${status.id}`}
                          checked={currentForm.defaultHiddenEmployeeStatuses.includes(status.name)}
                          onCheckedChange={() => toggleHiddenStatus(status.name)}
                          disabled={updateMutation.isPending}
                        />
                        <label htmlFor={`status-${status.id}`} className="text-sm">{status.name}</label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Employees with these statuses will be hidden by default
                  </p>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <SaveBar dirty={isDirty} pending={updateMutation.isPending} onReset={() => setForm({})} />
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Course Defaults</CardTitle>
              <CardDescription>
                Default values when creating new training courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4 max-w-xl">
                  <Field>
                    <FieldLabel htmlFor="warningDays">Warning Days Before Expiry</FieldLabel>
                    <Input
                      id="warningDays"
                      type="number"
                      value={currentForm.defaultExpiryWarningDays}
                      onChange={(e) => setForm({ ...form, defaultExpiryWarningDays: parseInt(e.target.value) || 0 })}
                      disabled={updateMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Shows amber "Expiring Soon" status
                    </p>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="notifDays">Notification Days Before</FieldLabel>
                    <Input
                      id="notifDays"
                      type="number"
                      value={currentForm.defaultNotificationDaysBefore}
                      onChange={(e) => setForm({ ...form, defaultNotificationDaysBefore: parseInt(e.target.value) || 0 })}
                      disabled={updateMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      When to send email reminders
                    </p>
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="reminderFreq">Reminder Frequency (Days)</FieldLabel>
                  <Input
                    id="reminderFreq"
                    type="number"
                    className="w-32"
                    value={currentForm.defaultReminderFrequencyDays}
                    onChange={(e) => setForm({ ...form, defaultReminderFrequencyDays: parseInt(e.target.value) || 7 })}
                    disabled={updateMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Days between reminder emails
                  </p>
                </Field>
                <div className="flex gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="notifyEmp"
                      checked={currentForm.defaultNotifyEmployee}
                      onCheckedChange={(c) => setForm({ ...form, defaultNotifyEmployee: !!c })}
                      disabled={updateMutation.isPending}
                    />
                    <label htmlFor="notifyEmp" className="text-sm">Notify Employee</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="notifyAdm"
                      checked={currentForm.defaultNotifyAdmin}
                      onCheckedChange={(c) => setForm({ ...form, defaultNotifyAdmin: !!c })}
                      disabled={updateMutation.isPending}
                    />
                    <label htmlFor="notifyAdm" className="text-sm">Notify Admin</label>
                  </div>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <SaveBar dirty={isDirty} pending={updateMutation.isPending} onReset={() => setForm({})} />
        </TabsContent>

        <TabsContent value="supervision" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supervision Defaults</CardTitle>
              <CardDescription>
                Default values for employee supervision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="supFreq">Default Supervision Frequency (Months)</FieldLabel>
                  <Input
                    id="supFreq"
                    type="number"
                    className="w-32"
                    value={currentForm.defaultSupervisionFrequencyMonths}
                    onChange={(e) => setForm({ ...form, defaultSupervisionFrequencyMonths: parseInt(e.target.value) || 1 })}
                    disabled={updateMutation.isPending}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supervision Matrix</CardTitle>
              <CardDescription>
                Configure how many months to display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <Field>
                    <FieldLabel htmlFor="monthsBack">Months Back</FieldLabel>
                    <Input
                      id="monthsBack"
                      type="number"
                      value={currentForm.supervisionMonthsBack}
                      onChange={(e) => setForm({ ...form, supervisionMonthsBack: parseInt(e.target.value) || 9 })}
                      disabled={updateMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      History to show
                    </p>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="monthsForward">Months Forward</FieldLabel>
                    <Input
                      id="monthsForward"
                      type="number"
                      value={currentForm.supervisionMonthsForward}
                      onChange={(e) => setForm({ ...form, supervisionMonthsForward: parseInt(e.target.value) || 3 })}
                      disabled={updateMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Future to show
                    </p>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appraisal Grid</CardTitle>
              <CardDescription>
                Configure how many reviews to display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <Field>
                    <FieldLabel htmlFor="appraisalBack">Reviews Back</FieldLabel>
                    <Input
                      id="appraisalBack"
                      type="number"
                      value={currentForm.appraisalReviewsBack}
                      onChange={(e) => setForm({ ...form, appraisalReviewsBack: parseInt(e.target.value) || 2 })}
                      disabled={updateMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Completed reviews to show
                    </p>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="appraisalForward">Reviews Forward</FieldLabel>
                    <Input
                      id="appraisalForward"
                      type="number"
                      value={currentForm.appraisalReviewsForward}
                      onChange={(e) => setForm({ ...form, appraisalReviewsForward: parseInt(e.target.value) || 2 })}
                      disabled={updateMutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upcoming reviews to show
                    </p>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <SaveBar dirty={isDirty} pending={updateMutation.isPending} onReset={() => setForm({})} />
        </TabsContent>

        <TabsContent value="rota" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Contracted Hours</CardTitle>
              <CardDescription>
                Set contracted hours per month — used to calculate over/under on the rota grid
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setRotaYear(rotaYear - 1); setRotaHours({}) }}
                >
                  &larr;
                </Button>
                <span className="text-sm font-semibold min-w-[60px] text-center">{rotaYear}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setRotaYear(rotaYear + 1); setRotaHours({}) }}
                >
                  &rarr;
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-2xl">
                {monthNames.map((name, idx) => {
                  const month = idx + 1
                  return (
                    <div key={month} className="flex items-center gap-2">
                      <label className="text-sm w-20 shrink-0">{name.slice(0, 3)}</label>
                      <Input
                        type="number"
                        step="0.5"
                        className="w-24"
                        placeholder="—"
                        value={getMonthHours(month)}
                        onChange={(e) => setRotaHours({ ...rotaHours, [month]: e.target.value })}
                        disabled={updateMutation.isPending}
                      />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default Rota Filters</CardTitle>
              <CardDescription>
                Hide these roles and statuses by default on the Rota page (separate from Training/Supervision filters)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Hidden Roles</FieldLabel>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {roles.map((role) => (
                      <div key={role} className="flex items-center gap-2">
                        <Checkbox
                          id={`rota-role-${role}`}
                          checked={currentForm.defaultHiddenRotaRoles.includes(role)}
                          onCheckedChange={() => toggleHiddenRotaRole(role)}
                          disabled={updateMutation.isPending}
                        />
                        <label htmlFor={`rota-role-${role}`} className="text-sm">{role}</label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Employees with these roles will be hidden by default on the rota
                  </p>
                </Field>
                <Field>
                  <FieldLabel>Hidden Employee Statuses</FieldLabel>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {employeeStatuses?.map((status) => (
                      <div key={status.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`rota-status-${status.id}`}
                          checked={currentForm.defaultHiddenRotaEmployeeStatuses.includes(status.name)}
                          onCheckedChange={() => toggleHiddenRotaStatus(status.name)}
                          disabled={updateMutation.isPending}
                        />
                        <label htmlFor={`rota-status-${status.id}`} className="text-sm">{status.name}</label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Employees with these statuses will be hidden by default on the rota
                  </p>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <SaveBar dirty={isDirty} pending={updateMutation.isPending} onReset={() => { setForm({}); setRotaHours({}) }} />
        </TabsContent>
      </Tabs>
    </form>
  )
}
