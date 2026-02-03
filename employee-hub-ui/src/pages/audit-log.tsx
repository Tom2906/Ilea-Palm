import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { AuditLogEntry } from "@/lib/types"
import { AuditLogTable } from "@/components/audit-log-table"

export default function AuditLogPage() {
  const [tableFilter, setTableFilter] = useState("all")

  const { data: entries, isLoading } = useQuery({
    queryKey: ["audit-log", tableFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "200" })
      if (tableFilter !== "all") params.set("tableName", tableFilter)
      return api.get<AuditLogEntry[]>(`/audit-log?${params}`)
    },
  })

  return (
    <AuditLogTable
      entries={entries ?? []}
      loading={isLoading}
      tableFilter={tableFilter}
      onTableFilterChange={setTableFilter}
    />
  )
}
