import { Badge } from "@/components/ui/badge"

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
}

export function LeaveStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`text-xs ${statusStyles[status] ?? ""}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
