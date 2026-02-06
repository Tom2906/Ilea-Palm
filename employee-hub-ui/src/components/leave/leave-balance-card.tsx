import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { LeaveBalance } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

interface LeaveBalanceCardProps {
  employeeId: string
  year: number
}

export function LeaveBalanceCard({ employeeId, year }: LeaveBalanceCardProps) {
  const { data: balance, isLoading } = useQuery({
    queryKey: ["leave-balance", employeeId, year],
    queryFn: () => api.get<LeaveBalance>(`/leave/balance/${employeeId}/${year}`),
    enabled: !!employeeId,
  })

  if (isLoading) return <Skeleton className="h-24 w-full" />
  if (!balance) return null

  const remainingColor =
    balance.remaining > 5
      ? "text-green-600"
      : balance.remaining > 0
        ? "text-amber-600"
        : "text-red-600"

  return (
    <div className="rounded-lg border p-4">
      <h4 className="text-sm font-medium mb-3">Leave Balance — {year}</h4>
      <div className="grid grid-cols-5 gap-3 text-center">
        <div>
          <div className="text-lg font-semibold">{balance.totalEntitlement}</div>
          <div className="text-xs text-muted-foreground">Entitlement</div>
        </div>
        <div>
          <div className="text-lg font-semibold">{balance.carriedOver}</div>
          <div className="text-xs text-muted-foreground">Carried Over</div>
        </div>
        <div>
          <div className="text-lg font-semibold">{balance.approvedDaysTaken}</div>
          <div className="text-xs text-muted-foreground">Taken</div>
        </div>
        <div>
          <div className="text-lg font-semibold">{balance.pendingDays}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div>
          <div className={`text-lg font-semibold ${remainingColor}`}>
            {balance.remaining}
          </div>
          <div className="text-xs text-muted-foreground">Remaining</div>
        </div>
      </div>
    </div>
  )
}
