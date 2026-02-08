import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { CompanySettings, Employee, EmployeeStatus, MonthlyHours } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

const DEFAULT_DAY_IN_LIFE_PROMPT = `You are a professional writer assisting residential care workers in transforming their rough notes
into polished "Day in the Life" observations for children and young people. These observations
focus on relationship dynamics, emotional wellbeing, and how adults support the young person.

**Your role:** Take basic information provided by the adult and expand it into a rich, detailed
narrative that captures the quality of relationships, emotional states, and PACE-informed practice.

**Essential rules:**
- Always use "adult" (never "staff" or "care worker")
- Preserve any speech marks/direct quotes exactly as provided
- Use PACE language (Playfulness, Acceptance, Curiosity, Empathy) throughout
- Write in third person, natural voice (as if the adult wrote it themselves, not robotic)
- Use reflective language: "appeared", "seemed", "demonstrated"
- Focus on relationship quality, not just events
- NO MARKDOWN FORMATTING: Do not use bold (**), italics (_), headers (#), or any other markdown. Plain text only.

**When the adult provides basic information, intelligently expand it by:**
1. Adding observational detail about how the young person presented
2. Describing how adults built/maintained relationships
3. Showing PACE principles in action (validation, curiosity, empathy, playfulness)
4. Noting transitions and how the young person managed them
5. Capturing emotional states with behavioral evidence
6. Describing adult responses that supported co-regulation
7. Weaving relationship observations throughout (not as separate sections)

**Structure the narrative chronologically:**
- Flow naturally through the day
- Each paragraph covers a period/activity
- Relationship dynamics and emotional states woven into events
- Specific adult names and their responses included
- Direct quotes preserved in speech marks
- Significant moments (disclosures, breakthroughs, struggles) given appropriate weight

**Expand basic input intelligently:**
- If they say "Blake had breakfast" → describe how he engaged, who was with him, mood indicators
- If they say "went to park" → add how adults supported, what he enjoyed, emotional responses
- If they mention an incident → describe repair strategies, relationship impact, adult responses
- If quotes are provided → preserve exactly and add context about tone/body language

**First response:** Greet the adult warmly and ask them to share the young person's name and
any notes they have about the day (can be rough bullet points, brief descriptions, or detailed
narrative). Let them know you'll transform it into a professional observation.

**After receiving their input:** Produce a complete, polished narrative matching professional
care observation standards. Output plain text only with no markdown formatting whatsoever.
Mark it with "--- FINAL DOCUMENT ---" at the top. If critical information is missing
(e.g., no adult names, no sense of mood), ask one focused question before generating the final document.`

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
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

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
    aiProvider: form.aiProvider ?? settings?.aiProvider ?? "",
    aiModel: form.aiModel ?? settings?.aiModel ?? "",
    aiApiKey: form.aiApiKey ?? settings?.aiApiKey ?? "",
    dayInLifeSystemPrompt: form.dayInLifeSystemPrompt ?? settings?.dayInLifeSystemPrompt ?? DEFAULT_DAY_IN_LIFE_PROMPT,
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

  const testConnectionMutation = useMutation({
    mutationFn: () => api.post<{ success: boolean; message: string; response?: string }>("/day-in-life/test", {}),
    onSuccess: (data) => {
      setTestResult(data)
      setTimeout(() => setTestResult(null), 5000)
    },
    onError: (err: Error) => {
      setTestResult({ success: false, message: err.message })
      setTimeout(() => setTestResult(null), 5000)
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
          aiProvider: currentForm.aiProvider || null,
          aiModel: currentForm.aiModel || null,
          aiApiKey: currentForm.aiApiKey || null,
          dayInLifeSystemPrompt: currentForm.dayInLifeSystemPrompt || null,
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
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
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

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Configure AI provider for Day in the Life document generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="aiProvider">AI Provider</FieldLabel>
                  <Select
                    value={currentForm.aiProvider || ""}
                    onValueChange={(value) => setForm({ ...form, aiProvider: value })}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger id="aiProvider" className="max-w-md">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                      <SelectItem value="gemini">Google (Gemini)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose which AI service to use
                  </p>
                </Field>
                <Field>
                  <FieldLabel htmlFor="aiModel">Model Name</FieldLabel>
                  <Input
                    id="aiModel"
                    className="max-w-md"
                    placeholder="e.g., claude-haiku-4-5-20250929, gpt-4o-mini, gemini-2.0-flash"
                    value={currentForm.aiModel || ""}
                    onChange={(e) => setForm({ ...form, aiModel: e.target.value })}
                    disabled={updateMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Specific model ID for the selected provider
                  </p>
                </Field>
                <Field>
                  <FieldLabel htmlFor="aiApiKey">API Key</FieldLabel>
                  <Input
                    id="aiApiKey"
                    type="password"
                    className="max-w-md font-mono"
                    placeholder="Enter API key"
                    value={currentForm.aiApiKey || ""}
                    onChange={(e) => setForm({ ...form, aiApiKey: e.target.value })}
                    disabled={updateMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    API key will be stored securely. Use a password manager to store it separately.
                  </p>
                </Field>
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="dayInLifePrompt">Day in the Life System Prompt</FieldLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm({ ...form, dayInLifeSystemPrompt: DEFAULT_DAY_IN_LIFE_PROMPT })}
                      disabled={updateMutation.isPending}
                    >
                      Reset to Default
                    </Button>
                  </div>
                  <Textarea
                    id="dayInLifePrompt"
                    className="font-mono text-xs min-h-[300px]"
                    value={currentForm.dayInLifeSystemPrompt}
                    onChange={(e) => setForm({ ...form, dayInLifeSystemPrompt: e.target.value })}
                    disabled={updateMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Customize the AI behavior for Day in the Life documents. Click "Reset to Default" to restore the original prompt.
                  </p>
                </Field>
              </FieldGroup>

              {testResult && (
                <div className={`mt-4 rounded-md px-3 py-2 text-sm flex items-center gap-2 ${
                  testResult.success
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {testResult.message}
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => testConnectionMutation.mutate()}
                  disabled={testConnectionMutation.isPending || !currentForm.aiProvider || !currentForm.aiModel || !currentForm.aiApiKey}
                >
                  {testConnectionMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Save your changes first, then test the connection to verify it works
                </p>
              </div>
            </CardContent>
          </Card>

          <SaveBar dirty={isDirty} pending={updateMutation.isPending} onReset={() => setForm({})} />
        </TabsContent>
      </Tabs>
    </form>
  )
}
