import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { CompanySettings, Employee, EmployeeStatus, MonthlyHours } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DEFAULT_DAY_IN_LIFE_PROMPT } from "@/lib/constants"
import { CompanyTab } from "./settings/company-tab"
import { TrainingTab } from "./settings/training-tab"
import { SupervisionTab } from "./settings/supervision-tab"
import { RotaTab } from "./settings/rota-tab"
import { AIProvidersTab } from "./settings/ai-providers-tab"
import { DayInLifeTab } from "./settings/day-in-life-tab"

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

  const getMonthHours = (month: number): string => {
    if (rotaHours[month] !== undefined) return rotaHours[month]
    const existing = monthlyHours?.find((h) => h.month === month)
    return existing ? String(existing.contractedHours) : ""
  }

  const rotaDirty = Object.keys(rotaHours).length > 0

  const [form, setForm] = useState<Partial<CompanySettings>>({})

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
    aiApiKey: null as null,
    anthropicApiKey: null as null,
    openaiApiKey: null as null,
    geminiApiKey: null as null,
    dayInLifeProviderId: form.dayInLifeProviderId ?? settings?.dayInLifeProviderId ?? null,
    dayInLifeModel: form.dayInLifeModel ?? settings?.dayInLifeModel ?? "",
    dayInLifeSystemPrompt: form.dayInLifeSystemPrompt ?? settings?.dayInLifeSystemPrompt ?? DEFAULT_DAY_IN_LIFE_PROMPT,
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
          aiApiKey: null,
          anthropicApiKey: null,
          openaiApiKey: null,
          geminiApiKey: null,
          dayInLifeProviderId: currentForm.dayInLifeProviderId || null,
          dayInLifeModel: currentForm.dayInLifeModel || null,
          dayInLifeSystemPrompt: currentForm.dayInLifeSystemPrompt || null,
        })
      } else if (rotaDirty) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const isDirty = Object.keys(form).length > 0 || rotaDirty
  const onReset = () => setForm({})

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  const tabProps = { currentForm, form, setForm, isDirty, isPending: updateMutation.isPending, onReset }

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
          <TabsTrigger value="ai-providers">AI Providers</TabsTrigger>
          <TabsTrigger value="day-in-life">Day in the Life</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CompanyTab {...tabProps} roles={roles} employeeStatuses={employeeStatuses} />
        </TabsContent>

        <TabsContent value="training">
          <TrainingTab {...tabProps} />
        </TabsContent>

        <TabsContent value="supervision">
          <SupervisionTab {...tabProps} />
        </TabsContent>

        <TabsContent value="rota">
          <RotaTab
            {...tabProps}
            roles={roles}
            employeeStatuses={employeeStatuses}
            rotaYear={rotaYear}
            setRotaYear={setRotaYear}
            rotaHours={rotaHours}
            setRotaHours={setRotaHours}
            getMonthHours={getMonthHours}
            rotaDirty={rotaDirty}
          />
        </TabsContent>

        <TabsContent value="ai-providers">
          <AIProvidersTab />
        </TabsContent>

        <TabsContent value="day-in-life">
          <DayInLifeTab {...tabProps} />
        </TabsContent>
      </Tabs>
    </form>
  )
}
