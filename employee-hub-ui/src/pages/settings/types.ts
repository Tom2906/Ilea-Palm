import type { CompanySettings, EmployeeStatus } from "@/lib/types"

export interface SettingsTabProps {
  currentForm: Omit<CompanySettings, "id" | "createdAt" | "updatedAt"> & { aiApiKey: null; anthropicApiKey: null; openaiApiKey: null; geminiApiKey: null }
  form: Partial<CompanySettings>
  setForm: (form: Partial<CompanySettings>) => void
  isDirty: boolean
  isPending: boolean
  onReset: () => void
}

export interface CompanyTabProps extends SettingsTabProps {
  roles: string[]
  employeeStatuses: EmployeeStatus[] | undefined
}

export interface RotaTabProps extends SettingsTabProps {
  roles: string[]
  employeeStatuses: EmployeeStatus[] | undefined
  rotaYear: number
  setRotaYear: (year: number) => void
  rotaHours: Record<number, string>
  setRotaHours: (hours: Record<number, string>) => void
  getMonthHours: (month: number) => string
  rotaDirty: boolean
}
