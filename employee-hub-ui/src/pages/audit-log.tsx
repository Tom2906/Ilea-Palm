import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { formatDateTime } from "@/lib/format"
import type { AuditLogEntry, NotificationLogEntry } from "@/lib/types"
import { useFilterToggle } from "@/hooks/use-filter-toggle"
import { Badge } from "@/components/ui/badge"
import { FilterBar } from "@/components/filter-bar"
import { DataTable } from "@/components/data-table"
import type { DataTableColumn } from "@/components/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// --- Audit Log helpers ---

const tableNames = [
  "employees",
  "training_courses",
  "training_records",
  "onboarding_items",
  "onboarding_records",
  "employee_statuses",
  "employee_references",
  "notification_log",
  "users",
] as const

const auditActions = ["INSERT", "UPDATE", "DELETE"] as const

function formatTableName(name: string) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function actionVariant(action: string) {
  switch (action.toUpperCase()) {
    case "INSERT":
      return "bg-emerald-100 text-emerald-800 border-emerald-300"
    case "UPDATE":
      return "bg-amber-100 text-amber-800 border-amber-300"
    case "DELETE":
      return "bg-red-100 text-red-800 border-red-300"
    default:
      return ""
  }
}

function JsonBlock({ label, json }: { label: string; json: string | null }) {
  if (!json) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    parsed = json
  }
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <pre className="text-xs bg-muted rounded p-2 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
        {typeof parsed === "object" ? JSON.stringify(parsed, null, 2) : String(parsed)}
      </pre>
    </div>
  )
}

const auditColumns: DataTableColumn<AuditLogEntry>[] = [
  {
    key: "timestamp",
    header: "Timestamp",
    className: "text-xs text-muted-foreground",
    render: (row) => new Date(row.createdAt).toLocaleString("en-GB"),
  },
  {
    key: "table",
    header: "Table",
    render: (row) => (
      <Badge variant="outline" className="text-xs">
        {formatTableName(row.tableName)}
      </Badge>
    ),
  },
  {
    key: "action",
    header: "Action",
    render: (row) => (
      <Badge variant="outline" className={`text-xs ${actionVariant(row.action)}`}>
        {row.action}
      </Badge>
    ),
  },
  {
    key: "recordId",
    header: "Record ID",
    className: "text-xs text-muted-foreground font-mono",
    render: (row) => `${row.recordId.substring(0, 8)}...`,
  },
  {
    key: "userId",
    header: "User ID",
    className: "text-xs text-muted-foreground font-mono",
    render: (row) => row.userId ? `${row.userId.substring(0, 8)}...` : "-",
  },
]

// --- Notification Log helpers ---

const notificationColumns: DataTableColumn<NotificationLogEntry>[] = [
  {
    key: "sentAt",
    header: "Sent",
    className: "text-xs text-muted-foreground",
    render: (row) => formatDateTime(row.sentAt),
  },
  {
    key: "employee",
    header: "Employee",
    className: "text-sm",
    render: (row) => row.employeeName ?? "-",
  },
  {
    key: "course",
    header: "Course",
    className: "text-sm",
    render: (row) => row.courseName ?? "-",
  },
  {
    key: "recipient",
    header: "Recipient",
    className: "text-xs text-muted-foreground",
    render: (row) => row.recipientEmail,
  },
  {
    key: "recipientType",
    header: "To",
    render: (row) => (
      <Badge variant="secondary" className="text-xs">
        {row.recipientType === "employee" ? "Employee" : "Admin"}
      </Badge>
    ),
  },
  {
    key: "type",
    header: "Type",
    render: (row) => (
      <Badge
        variant={row.notificationType === "expired" ? "destructive" : "default"}
        className={`text-xs ${
          row.notificationType === "expiry_warning"
            ? "bg-amber-100 text-amber-800 border-amber-300"
            : ""
        }`}
      >
        {row.notificationType === "expiry_warning" ? "Warning" : "Expired"}
      </Badge>
    ),
  },
]

// --- Page ---

function AuditLogTab() {
  const [search, setSearch] = useState("")
  const { hidden, toggle, toggleAll, clear } = useFilterToggle()

  const { data: entries, isLoading } = useQuery({
    queryKey: ["audit-log"],
    queryFn: () => api.get<AuditLogEntry[]>("/audit-log?limit=200"),
  })

  const filterGroups = useMemo(() => [
    { label: "Table", items: tableNames.map((t) => ({ id: `table:${t}`, label: formatTableName(t) })) },
    { label: "Action", items: auditActions.map((a) => ({ id: `action:${a}`, label: a })) },
  ], [])

  const filtered = useMemo(() => {
    if (!entries) return []
    return entries.filter((e) => {
      if (hidden.has(`table:${e.tableName}`)) return false
      if (hidden.has(`action:${e.action}`)) return false
      const term = search.toLowerCase()
      return (
        e.tableName.toLowerCase().includes(term) ||
        e.action.toLowerCase().includes(term) ||
        e.recordId.toLowerCase().includes(term) ||
        (e.userId?.toLowerCase().includes(term) ?? false)
      )
    })
  }, [entries, hidden, search])

  return (
    <DataTable
      columns={auditColumns}
      rows={filtered}
      getRowKey={(row) => row.id}
      renderDetail={(row) => (
        <div className="space-y-2 py-2">
          <div className="grid grid-cols-2 gap-4">
            <JsonBlock label="Previous Data" json={row.oldData} />
            <JsonBlock label="New Data" json={row.newData} />
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Full Record ID:</span>{" "}
            <span className="font-mono">{row.recordId}</span>
            {row.userId && (
              <>
                {" | "}
                <span className="font-medium">Full User ID:</span>{" "}
                <span className="font-mono">{row.userId}</span>
              </>
            )}
          </div>
        </div>
      )}
      searchPlaceholder="Search..."
      searchValue={search}
      onSearchChange={setSearch}
      toolbar={
        <FilterBar
          filters={filterGroups}
          hidden={hidden}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onClear={clear}
        />
      }
      loading={isLoading}
      emptyMessage="No audit log entries found."
    />
  )
}

function NotificationLogTab() {
  const [search, setSearch] = useState("")
  const { hidden, toggle, toggleAll, clear } = useFilterToggle()

  const { data: log, isLoading } = useQuery({
    queryKey: ["notifications-log"],
    queryFn: () => api.get<NotificationLogEntry[]>("/notifications/log?limit=100"),
  })

  const filterGroups = useMemo(() => [
    { label: "Type", items: [
      { id: "type:expiry_warning", label: "Warning" },
      { id: "type:expired", label: "Expired" },
    ]},
    { label: "Recipient", items: [
      { id: "to:employee", label: "Employee" },
      { id: "to:admin", label: "Admin" },
    ]},
  ], [])

  const filtered = useMemo(() => {
    if (!log) return []
    return log.filter((e) => {
      if (hidden.has(`type:${e.notificationType}`)) return false
      if (hidden.has(`to:${e.recipientType}`)) return false
      const term = search.toLowerCase()
      return (
        (e.employeeName?.toLowerCase().includes(term) ?? false) ||
        (e.courseName?.toLowerCase().includes(term) ?? false) ||
        e.recipientEmail.toLowerCase().includes(term)
      )
    })
  }, [log, hidden, search])

  return (
    <DataTable
      columns={notificationColumns}
      rows={filtered}
      getRowKey={(row) => row.id}
      searchPlaceholder="Search..."
      searchValue={search}
      onSearchChange={setSearch}
      toolbar={
        <FilterBar
          filters={filterGroups}
          hidden={hidden}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onClear={clear}
        />
      }
      loading={isLoading}
      emptyMessage="No notifications have been sent."
    />
  )
}

export default function AuditLogPage() {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="audit" className="h-full flex flex-col">
        <TabsList className="shrink-0">
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="audit" className="flex-1 min-h-0">
          <AuditLogTab />
        </TabsContent>
        <TabsContent value="notifications" className="flex-1 min-h-0">
          <NotificationLogTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
