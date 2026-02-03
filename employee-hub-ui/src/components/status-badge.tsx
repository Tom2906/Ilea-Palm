import { Badge } from "@/components/ui/badge"

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Expired":
      return <Badge variant="destructive">Expired</Badge>
    case "Expiring Soon":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100">
          Expiring Soon
        </Badge>
      )
    case "Valid":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100">
          Valid
        </Badge>
      )
    case "Completed":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100">
          Completed
        </Badge>
      )
    case "Not Completed":
      return <Badge variant="secondary">Not Completed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
