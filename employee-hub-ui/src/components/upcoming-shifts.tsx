import type { Shift } from "@/lib/types"
import { shiftCellColorMap } from "@/lib/shift-colors"
import { cn } from "@/lib/utils"
import { ListPanel } from "@/components/list-panel"

interface UpcomingShiftsProps {
  shifts?: Record<string, Shift>
  leaveDates?: string[]
  className?: string
}

function getUpcomingShifts(
  shifts: Record<string, Shift>,
  leaveDates?: string[],
  maxItems = 7,
): { date: string; dayLabel: string; timeUntil: string; shift?: Shift; isLeave?: boolean }[] {
  const items: { date: string; dayLabel: string; timeUntil: string; shift?: Shift; isLeave?: boolean }[] = []
  const now = new Date()

  // Scan up to 60 days ahead to find upcoming shifts/leave
  for (let i = 0; i < 60 && items.length < maxItems; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

    const shift = shifts[dateStr]
    const isLeave = leaveDates?.includes(dateStr)

    if (!shift && !isLeave) continue

    const dayLabel = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    const timeUntil = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `In ${i} days`

    items.push({ date: dateStr, dayLabel, timeUntil, shift: shift || undefined, isLeave })
  }

  return items
}

export function UpcomingShifts({ shifts, leaveDates, className }: UpcomingShiftsProps) {
  if (!shifts) {
    return (
      <ListPanel title="Upcoming Shifts" className={className}>
        <p className="text-sm text-muted-foreground text-center py-6">
          No shift data available
        </p>
      </ListPanel>
    )
  }

  const items = getUpcomingShifts(shifts, leaveDates)

  return (
    <ListPanel title="Upcoming Shifts" count={items.length} className={className}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No upcoming shifts
        </p>
      ) : (
        items.map(({ date, dayLabel, timeUntil, shift, isLeave }) => (
          <div key={date} className="flex items-center gap-3 px-4 py-2.5 min-h-[52px]">
            <div className="w-24 shrink-0">
              <p className="text-sm font-medium">{dayLabel}</p>
              <p className="text-xs text-muted-foreground">{timeUntil}</p>
            </div>
            <div className="flex-1">
              {shift ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold border",
                    shiftCellColorMap[shift.shiftTypeCode] ?? "bg-gray-100 border-gray-200 text-gray-800",
                  )}
                >
                  {shift.shiftTypeCode}
                  <span className="font-normal opacity-70">{shift.hours}h</span>
                </span>
              ) : isLeave ? (
                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold border bg-green-50 border-green-200 text-green-700">
                  Annual Leave
                </span>
              ) : null}
            </div>
          </div>
        ))
      )}
    </ListPanel>
  )
}
