import { formatDate } from "@/lib/format"
import type { EmployeeReference } from "@/lib/types"
import { ListRow } from "@/components/list-row"
import { Badge } from "@/components/ui/badge"

export function ReferenceCard({ data: r }: { data: EmployeeReference }) {
  return (
    <ListRow>
      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-medium">
        {r.referenceNumber}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{r.contactName || "No contact details"}</p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          {r.contactCompany && <span>{r.contactCompany}</span>}
          {r.dateRequested && <span>Requested: {formatDate(r.dateRequested)}</span>}
          {r.dateReceived && <span>Received: {formatDate(r.dateReceived)}</span>}
        </div>
      </div>
      <div className="flex gap-1.5">
        <Badge
          variant={r.received ? "default" : "secondary"}
          className={
            r.received
              ? "bg-emerald-100 text-emerald-800 border-emerald-300 text-xs"
              : "text-xs"
          }
        >
          {r.received ? "Received" : "Pending"}
        </Badge>
        <Badge
          variant={r.verbalRef ? "default" : "secondary"}
          className={
            r.verbalRef
              ? "bg-emerald-100 text-emerald-800 border-emerald-300 text-xs"
              : "text-xs"
          }
        >
          {r.verbalRef ? "Verbal" : "No Verbal"}
        </Badge>
      </div>
    </ListRow>
  )
}
