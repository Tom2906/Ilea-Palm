export interface UserInfo {
  id: string
  email: string
  displayName: string
  role: "admin" | "user"
  employeeId: string | null
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
  notificationDaysBefore: number
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
