import { useState, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import type { RotaMonth } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { shiftCellColorMap } from "@/lib/shift-colors"

const dayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface CalendarDay {
  day: number
  date: string
  dayOfWeek: number // 0=Mon ... 6=Sun (ISO)
}

function buildCalendarWeeks(year: number, month: number, daysInMonth: number): CalendarDay[][] {
  const weeks: CalendarDay[][] = []
  let currentWeek: CalendarDay[] = []

  // First day of month — getDay() returns 0=Sun, convert to ISO: Mon=0
  const firstDow = new Date(year, month - 1, 1).getDay()
  const isoFirstDow = firstDow === 0 ? 6 : firstDow - 1

  // Pad start of first week with empty cells
  for (let i = 0; i < isoFirstDow; i++) {
    currentWeek.push({ day: 0, date: "", dayOfWeek: i })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const jsDate = new Date(year, month - 1, d)
    const dow = jsDate.getDay()
    const isoDow = dow === 0 ? 6 : dow - 1
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`

    currentWeek.push({ day: d, date: dateStr, dayOfWeek: isoDow })

    if (isoDow === 6 || d === daysInMonth) {
      // Pad end of last week
      while (currentWeek.length < 7) {
        currentWeek.push({ day: 0, date: "", dayOfWeek: currentWeek.length })
      }
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  return weeks
}

export default function MyRotaPage() {
  const { user } = useAuth()
  const employeeId = user?.employeeId

  const [searchParams] = useSearchParams()
  const now = new Date()
  const [year, setYear] = useState(() => {
    const p = searchParams.get("year")
    return p ? Number(p) : now.getFullYear()
  })
  const [month, setMonth] = useState(() => {
    const p = searchParams.get("month")
    return p ? Number(p) : now.getMonth() + 1
  })

  const { data: rota, isLoading } = useQuery({
    queryKey: ["rota", year, month],
    queryFn: () => api.get<RotaMonth>(`/rota?year=${year}&month=${month}`),
    enabled: !!employeeId,
  })

  const myData = useMemo(
    () => rota?.staff.find((s) => s.employeeId === employeeId),
    [rota, employeeId],
  )

  const weeks = useMemo(
    () => buildCalendarWeeks(year, month, rota?.daysInMonth ?? new Date(year, month, 0).getDate()),
    [year, month, rota?.daysInMonth],
  )

  const goToPreviousMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else setMonth(month - 1)
  }

  const goToNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const goToCurrentMonth = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
  }

  const monthName = new Date(year, month - 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

  if (!employeeId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Your account is not linked to an employee record. Contact an administrator to link your account.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Month navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold min-w-[140px] text-center">
          {monthName}
        </span>
        <Button variant="outline" size="sm" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isCurrentMonth && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={goToCurrentMonth}>
            Today
          </Button>
        )}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
            {/* Day headers */}
            {dayHeaders.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "text-center text-xs font-medium py-2",
                  i >= 5 ? "bg-gray-100 text-muted-foreground" : "bg-muted/50",
                )}
              >
                {d}
              </div>
            ))}

            {/* Calendar cells */}
            {weeks.map((week, wi) =>
              week.map((cell) => {
                if (cell.day === 0) {
                  return <div key={`empty-${wi}-${cell.dayOfWeek}`} className="bg-background min-h-[80px]" />
                }

                const shift = myData?.shifts[cell.date]
                const isLeave = myData?.leaveDates?.includes(cell.date)
                const isToday = cell.date === todayStr
                const isWeekend = cell.dayOfWeek >= 5
                const shiftColor = shift ? shiftCellColorMap[shift.shiftTypeCode] : undefined

                return (
                  <div
                    key={cell.date}
                    className={cn(
                      "min-h-[80px] p-1.5 flex flex-col gap-0.5",
                      isWeekend ? "bg-gray-50" : "bg-background",
                      isToday && "ring-2 ring-inset ring-primary/40",
                    )}
                  >
                    <span className={cn(
                      "text-xs",
                      isToday ? "font-bold text-primary" : "text-muted-foreground",
                    )}>
                      {cell.day}
                    </span>
                    {shift && (
                      <div className={cn(
                        "rounded px-1.5 py-1 text-center border",
                        shiftColor ?? "bg-gray-100 border-gray-200 text-gray-800",
                      )}>
                        <div className="text-sm font-semibold">{shift.shiftTypeCode}</div>
                        <div className="text-[10px]">{shift.hours}h</div>
                      </div>
                    )}
                    {isLeave && !shift && (
                      <div className="rounded px-1.5 py-1 text-center border bg-green-50 border-green-200 text-green-700">
                        <div className="text-sm font-semibold">AL</div>
                      </div>
                    )}
                  </div>
                )
              }),
            )}
          </div>

          {/* Summary */}
          {myData && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="rounded-lg border px-4 py-2">
                <span className="text-muted-foreground">Total Hours</span>
                <span className="ml-2 font-semibold">{myData.summary.totalHours.toFixed(1)}</span>
              </div>
              {myData.summary.totalSleeps > 0 && (
                <div className="rounded-lg border px-4 py-2">
                  <span className="text-muted-foreground">Sleeps</span>
                  <span className="ml-2 font-semibold">{myData.summary.totalSleeps}</span>
                </div>
              )}
              {myData.summary.overUnder != null && (
                <div className="rounded-lg border px-4 py-2">
                  <span className="text-muted-foreground">Over/Under</span>
                  <span className={cn(
                    "ml-2 font-semibold",
                    myData.summary.overUnder > 0 ? "text-green-600" : myData.summary.overUnder < 0 ? "text-red-600" : "",
                  )}>
                    {myData.summary.overUnder > 0 ? "+" : ""}{myData.summary.overUnder.toFixed(1)}
                  </span>
                </div>
              )}
              {myData.summary.annualLeaveDays > 0 && (
                <div className="rounded-lg border px-4 py-2">
                  <span className="text-muted-foreground">AL Days</span>
                  <span className="ml-2 font-semibold">{myData.summary.annualLeaveDays}</span>
                </div>
              )}
            </div>
          )}

          {!myData && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No rota data found for this month.
            </p>
          )}

          {/* Legend */}
          {rota?.shiftTypes && (
            <div className="mt-3 flex flex-wrap gap-2">
              {rota.shiftTypes.map((st) => (
                <div key={st.code} className="flex items-center gap-1.5 text-xs">
                  <div className={cn(
                    "h-3 w-3 rounded-sm border",
                    shiftCellColorMap[st.code] ?? "bg-gray-100 border-gray-200",
                  )} />
                  <span className="text-muted-foreground">{st.code} - {st.name} ({st.defaultHours}h)</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-xs">
                <div className="h-3 w-3 rounded-sm border bg-green-50 border-green-200" />
                <span className="text-muted-foreground">AL - Annual Leave</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
