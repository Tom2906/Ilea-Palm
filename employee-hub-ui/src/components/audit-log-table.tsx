import { useState } from "react"
import type { AuditLogEntry } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown, ChevronRight } from "lucide-react"

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

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB")
}

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

interface AuditLogTableProps {
  entries: AuditLogEntry[]
  loading: boolean
  tableFilter: string
  onTableFilterChange: (value: string) => void
}

export function AuditLogTable({
  entries,
  loading,
  tableFilter,
  onTableFilterChange,
}: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={tableFilter} onValueChange={onTableFilterChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {tableNames.map((t) => (
              <SelectItem key={t} value={t}>
                {formatTableName(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Showing latest {entries.length} entries
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Timestamp</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Record ID</TableHead>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No audit log entries found.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const isExpanded = expandedId === entry.id
                  const hasData = entry.oldData || entry.newData
                  return (
                    <>
                      <TableRow
                        key={entry.id}
                        className={hasData ? "cursor-pointer" : ""}
                        onClick={() => {
                          if (hasData) {
                            setExpandedId(isExpanded ? null : entry.id)
                          }
                        }}
                      >
                        <TableCell className="w-8 px-2">
                          {hasData &&
                            (isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            ))}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(entry.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {formatTableName(entry.tableName)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${actionVariant(entry.action)}`}
                          >
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {entry.recordId.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {entry.userId
                            ? `${entry.userId.substring(0, 8)}...`
                            : "-"}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${entry.id}-detail`}>
                          <TableCell />
                          <TableCell colSpan={5}>
                            <div className="space-y-2 py-2">
                              <div className="grid grid-cols-2 gap-4">
                                <JsonBlock
                                  label="Previous Data"
                                  json={entry.oldData}
                                />
                                <JsonBlock
                                  label="New Data"
                                  json={entry.newData}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Full Record ID:</span>{" "}
                                <span className="font-mono">{entry.recordId}</span>
                                {entry.userId && (
                                  <>
                                    {" | "}
                                    <span className="font-medium">Full User ID:</span>{" "}
                                    <span className="font-mono">{entry.userId}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
