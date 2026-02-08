import type { AuditLogEntry } from "@/lib/types"

export interface ActivityFeedItem {
  id: string
  icon: "training" | "supervision" | "appraisal" | "leave" | "rota" | "employee" | "general"
  message: string
  detail: string | null
  timestamp: string
  dotColor: "teal" | "blue" | "amber" | "red" | "slate"
}

function tryParseName(json: string | null): string | null {
  if (!json) return null
  try {
    const data = JSON.parse(json)
    if (data.firstName && data.lastName) return `${data.firstName} ${data.lastName}`
    if (data.employeeName) return data.employeeName
    if (data.name) return data.name
    return null
  } catch {
    return null
  }
}

function tryParseField(json: string | null, field: string): string | null {
  if (!json) return null
  try {
    const data = JSON.parse(json)
    return data[field] ?? null
  } catch {
    return null
  }
}

export function auditToActivityItems(entries: AuditLogEntry[]): ActivityFeedItem[] {
  return entries.map((entry) => {
    const name = tryParseName(entry.newData) ?? tryParseName(entry.oldData)
    const item: ActivityFeedItem = {
      id: entry.id,
      icon: "general",
      message: `Record updated in ${entry.tableName}`,
      detail: null,
      timestamp: entry.createdAt,
      dotColor: "slate",
    }

    switch (entry.tableName) {
      case "training_records": {
        const courseName = tryParseField(entry.newData, "courseName")
        item.icon = "training"
        item.dotColor = "teal"
        if (entry.action === "INSERT") {
          item.message = courseName ? `Training recorded: ${courseName}` : "Training recorded"
          item.detail = name
        } else if (entry.action === "UPDATE") {
          item.message = courseName ? `Training updated: ${courseName}` : "Training updated"
          item.detail = name
        } else if (entry.action === "DELETE") {
          item.message = "Training record removed"
          item.detail = name
        }
        break
      }
      case "supervision_records": {
        item.icon = "supervision"
        item.dotColor = "blue"
        if (entry.action === "INSERT") {
          item.message = name ? `Supervision completed for ${name}` : "Supervision completed"
        } else {
          item.message = name ? `Supervision updated for ${name}` : "Supervision updated"
        }
        break
      }
      case "appraisal_milestones": {
        item.icon = "appraisal"
        item.dotColor = "teal"
        const completedDate = tryParseField(entry.newData, "completedDate")
        if (entry.action === "UPDATE" && completedDate) {
          item.message = name ? `Appraisal completed for ${name}` : "Appraisal completed"
        } else if (entry.action === "INSERT") {
          item.message = name ? `Appraisal scheduled for ${name}` : "Appraisal scheduled"
        } else {
          item.message = name ? `Appraisal updated for ${name}` : "Appraisal updated"
        }
        break
      }
      case "leave_requests": {
        item.icon = "leave"
        const status = tryParseField(entry.newData, "status")
        if (entry.action === "INSERT") {
          item.message = name ? `Leave requested by ${name}` : "Leave requested"
          item.dotColor = "amber"
        } else if (entry.action === "UPDATE" && status === "approved") {
          item.message = name ? `Leave approved for ${name}` : "Leave approved"
          item.dotColor = "teal"
        } else if (entry.action === "UPDATE" && status === "rejected") {
          item.message = name ? `Leave rejected for ${name}` : "Leave rejected"
          item.dotColor = "red"
        } else {
          item.message = name ? `Leave updated for ${name}` : "Leave updated"
          item.dotColor = "amber"
        }
        break
      }
      case "shifts": {
        item.icon = "rota"
        item.dotColor = "blue"
        const code = tryParseField(entry.newData, "shiftTypeCode")
        if (entry.action === "INSERT" || entry.action === "UPDATE") {
          item.message = name ? `Shift updated for ${name}` : "Shift updated"
          item.detail = code
        } else {
          item.message = name ? `Shift removed for ${name}` : "Shift removed"
        }
        break
      }
      case "employees": {
        item.icon = "employee"
        item.dotColor = "teal"
        if (entry.action === "INSERT") {
          item.message = name ? `New employee: ${name}` : "New employee added"
        } else if (entry.action === "UPDATE") {
          item.message = name ? `Employee updated: ${name}` : "Employee updated"
        }
        break
      }
    }

    return item
  })
}
