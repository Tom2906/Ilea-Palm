export interface UserInfo {
  id: string
  email: string
  displayName: string
  roleName: string
  permissions: Record<string, string>
  employeeId: string | null
}

export interface RoleResponse {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: Record<string, string>
  userCount: number
  createdAt: string
  updatedAt: string
}

export interface UserListResponse {
  id: string
  email: string
  displayName: string
  roleId: string
  roleName: string
  employeeId: string | null
  employeeName: string | null
  active: boolean
  lastLogin: string | null
  createdAt: string
  authMethod: "password" | "microsoft" | "both"
}

export interface LoginResponse {
  token: string
  user: UserInfo
}

export interface Employee {
  id: string
  email: string
  firstName: string
  lastName: string
  department: string | null
  role: string
  startDate: string
  active: boolean
  statusId: string | null
  statusName: string | null
  notes: string | null
  reportsTo: string | null
  supervisorName: string | null
  supervisionFrequency: number
  appraisalFrequencyMonths: number
  createdAt: string
  updatedAt: string
}

export interface EmployeeStatus {
  id: string
  name: string
  displayOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface EmployeeReference {
  id: string
  employeeId: string
  referenceNumber: number
  contactName: string | null
  contactCompany: string | null
  contactEmail: string | null
  contactPhone: string | null
  received: boolean
  verbalRef: boolean
  dateRequested: string | null
  dateReceived: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface TrainingCourse {
  id: string
  name: string
  description: string | null
  category: "Online Mandatory" | "F2F Mandatory" | "Additional"
  validityMonths: number | null
  expiryWarningDaysBefore: number
  notificationDaysBefore: number
  reminderFrequencyDays: number
  notifyEmployee: boolean
  notifyAdmin: boolean
  mandatoryForRoles: string[] | null
  createdAt: string
  updatedAt: string
}

export interface TrainingRecord {
  id: string
  employeeId: string
  employeeName: string | null
  courseId: string
  courseName: string | null
  completionDate: string
  expiryDate: string | null
  certificateUrl: string | null
  notes: string | null
  recordedBy: string
  createdAt: string
}

export interface TrainingStatus {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  department: string | null
  courseId: string
  courseName: string
  category: string
  validityMonths: number | null
  trainingRecordId: string | null
  completionDate: string | null
  expiryDate: string | null
  status: "Valid" | "Expiring Soon" | "Expired" | "Not Completed" | "Completed"
  daysUntilExpiry: number | null
}

export interface OnboardingItem {
  id: string
  name: string
  description: string | null
  displayOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface OnboardingRecord {
  id: string
  employeeId: string
  itemId: string
  itemName: string
  itemDescription: string | null
  displayOrder: number
  status: "pending" | "complete" | "not_required"
  completedDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationLogEntry {
  id: string
  trainingRecordId: string
  employeeId: string
  employeeName: string | null
  courseId: string
  courseName: string | null
  recipientEmail: string
  recipientType: "employee" | "admin"
  notificationType: "expiry_warning" | "expired"
  sentAt: string
  daysUntilExpiry: number | null
}

export interface PendingNotification {
  employeeId: string
  employeeName: string
  employeeEmail: string
  courseId: string
  courseName: string
  category: string
  trainingRecordId: string | null
  expiryDate: string | null
  daysUntilExpiry: number | null
  status: string
  notifyEmployee: boolean
  notifyAdmin: boolean
}

export interface SendNotificationsResult {
  emailsSent: number
  skipped: number
  errors: string[]
}

export interface AuditLogEntry {
  id: string
  tableName: string
  recordId: string
  action: string
  userId: string | null
  oldData: string | null
  newData: string | null
  createdAt: string
}

export interface Supervision {
  id: string
  employeeId: string
  employeeName: string
  conductedById: string
  conductedByName: string
  supervisionDate: string
  period: string
  notes: string | null
  isCompleted: boolean
  requiredCount: number
  createdAt: string
}

export interface SupervisionStatus {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  role: string
  department: string | null
  reportsTo: string | null
  supervisionFrequency: number
  supervisorName: string | null
  lastSupervisionDate: string | null
  daysSinceLastSupervision: number | null
  status: "Never" | "OK" | "Due Soon" | "Overdue"
  startDate: string
  employeeStatus: string | null
}

export interface SupervisionSummary {
  totalEmployees: number
  neverSupervised: number
  ok: number
  dueSoon: number
  overdue: number
}

export interface SupervisionException {
  id: string
  employeeId: string
  employeeName: string
  period: string
  exceptionType: 'not_required' | 'annual_leave' | 'sick_leave'
  notes: string | null
  createdBy: string | null
  createdByName: string | null
  createdAt: string
}

export interface AppraisalMilestone {
  id: string
  employeeId: string
  reviewNumber: number
  dueDate: string
  completedDate: string | null
  conductedById: string | null
  conductedByName: string | null
  notes: string | null
  status: 'completed' | 'due_soon' | 'overdue' | 'not_yet_due'
  daysUntilDue: number | null
}

export interface AppraisalCellData {
  id: string | null
  reviewNumber: number
  dueDate: string
  completedDate: string | null
  conductedById: string | null
  conductedByName: string | null
  notes: string | null
  status: 'completed' | 'due_soon' | 'overdue' | 'not_yet_due'
  daysUntilDue: number | null
}

export interface AppraisalMatrixRow {
  employeeId: string
  firstName: string
  lastName: string
  role: string
  department: string | null
  employeeStatus: string | null
  startDate: string
  appraisalFrequencyMonths: number
  reviews: (AppraisalCellData | null)[]
}

export interface SupervisionRequirement {
  id: string
  employeeId: string
  effectiveFrom: string
  requiredCount: number
  createdAt: string
}

export interface CompanySettings {
  id: string
  companyName: string
  defaultExpiryWarningDays: number
  defaultNotificationDaysBefore: number
  defaultReminderFrequencyDays: number
  defaultNotifyEmployee: boolean
  defaultNotifyAdmin: boolean
  defaultSupervisionFrequencyMonths: number
  supervisionMonthsBack: number
  supervisionMonthsForward: number
  defaultHiddenRoles: string[]
  defaultHiddenEmployeeStatuses: string[]
  defaultHiddenRotaRoles: string[]
  defaultHiddenRotaEmployeeStatuses: string[]
  appraisalReviewsBack: number
  appraisalReviewsForward: number
  aiProvider: string | null
  aiModel: string | null
  aiApiKey: string | null
  dayInLifeSystemPrompt: string | null
  createdAt: string
  updatedAt: string
}

export interface ShiftType {
  id: string
  code: string
  name: string
  defaultHours: number
  includesSleep: boolean
  displayColor: string | null
  sortOrder: number
}

export interface Shift {
  id: string
  employeeId: string
  date: string
  shiftTypeId: string
  shiftTypeCode: string
  hours: number
  includesSleep: boolean
  displayColor: string | null
  notes: string | null
}

export interface RotaEmployee {
  employeeId: string
  firstName: string
  lastName: string
  role: string
  shifts: Record<string, Shift>
  leaveDates: string[]
  summary: {
    totalHours: number
    totalSleeps: number
    overUnder: number | null
    annualLeaveDays: number
  }
}

export interface RotaMonth {
  month: number
  year: number
  daysInMonth: number
  contractedHours: number | null
  staff: RotaEmployee[]
  shiftTypes: ShiftType[]
}

export interface MonthlyHours {
  id: string
  year: number
  month: number
  contractedHours: number
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  startDate: string
  endDate: string
  totalDays: number
  status: "pending" | "approved" | "rejected" | "cancelled"
  requestedBy: string
  requestedByName: string
  approvedBy: string | null
  approvedByName: string | null
  approvedAt: string | null
  notes: string | null
  createdAt: string
}

export interface LeaveBalance {
  totalEntitlement: number
  carriedOver: number
  approvedDaysTaken: number
  pendingDays: number
  remaining: number
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface LeaveEntitlement {
  id: string
  employeeId: string
  employeeName: string
  year: number
  totalDays: number
  carriedOver: number
  approvedDays: number
  remainingDays: number
  notes: string | null
}
