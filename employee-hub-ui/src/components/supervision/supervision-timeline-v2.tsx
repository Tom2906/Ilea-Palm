import { useState, useMemo, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Supervision, SupervisionException } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Settings, Plus, ChevronLeft, ChevronRight, Calendar, FileText, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Import Swiper
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Keyboard, EffectCoverflow } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
// @ts-expect-error - Swiper CSS imports
import "swiper/css"
// @ts-expect-error - Swiper CSS imports
import "swiper/css/navigation"
// @ts-expect-error - Swiper CSS imports
import "swiper/css/effect-coverflow"

interface SupervisionTimelineV2Props {
  employeeId: string
  employeeName?: string
  startDate: string
  reportsTo?: string | null
}

interface MonthData {
  period: string // "YYYY-MM"
  label: string // "Jan 2026"
  shortLabel: string // "Jan"
  year: string
  supervisions: Supervision[]
  exceptions: SupervisionException[]
  isCurrentMonth: boolean
  isFuture: boolean
  isBeforeStart: boolean
}

const EXCEPTION_LABELS: Record<string, string> = {
  annual_leave: "Annual Leave",
  sick_leave: "Sick Leave",
  not_required: "Not Required",
}

const EXCEPTION_COLORS: Record<string, string> = {
  annual_leave: "bg-teal-100 text-teal-700 border-teal-300",
  sick_leave: "bg-purple-100 text-purple-700 border-purple-300",
  not_required: "bg-gray-100 text-gray-600 border-gray-300",
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function generateMonthRange(startDate: string): MonthData[] {
  const months: MonthData[] = []
  const start = new Date(startDate)
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  // Start from employee start date, go to 3 months in future
  const rangeStart = new Date(start.getFullYear(), start.getMonth(), 1)
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 3, 1)

  const cursor = new Date(rangeStart)
  while (cursor <= rangeEnd) {
    const period = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
    const label = cursor.toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    const shortLabel = cursor.toLocaleDateString("en-GB", { month: "short" })
    const year = cursor.getFullYear().toString()

    months.push({
      period,
      label,
      shortLabel,
      year,
      supervisions: [],
      exceptions: [],
      isCurrentMonth: period === currentPeriod,
      isFuture: cursor > now,
      isBeforeStart: cursor < rangeStart,
    })

    cursor.setMonth(cursor.getMonth() + 1)
  }

  return months
}

export function SupervisionTimelineV2({
  employeeId,
  startDate,
}: SupervisionTimelineV2Props) {
  const swiperRef = useRef<SwiperType | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)

  // Fetch supervisions
  const { data: supervisions, isLoading: loadingSupervisions } = useQuery({
    queryKey: ["supervisions", "employee", employeeId],
    queryFn: () => api.get<Supervision[]>(`/supervisions/employee/${employeeId}`),
    enabled: !!employeeId,
  })

  // Fetch exceptions
  const { data: exceptions, isLoading: loadingExceptions } = useQuery({
    queryKey: ["supervision-exceptions", "employee", employeeId],
    queryFn: () => api.get<SupervisionException[]>(`/supervision-exceptions/employee/${employeeId}`),
    enabled: !!employeeId,
  })

  const isLoading = loadingSupervisions || loadingExceptions

  // Build months with data
  const months = useMemo(() => {
    const monthList = generateMonthRange(startDate)

    // Assign supervisions to months
    supervisions?.forEach((s) => {
      const month = monthList.find((m) => m.period === s.period)
      if (month) {
        month.supervisions.push(s)
      }
    })

    // Assign exceptions to months
    exceptions?.forEach((e) => {
      const month = monthList.find((m) => m.period === e.period)
      if (month) {
        month.exceptions.push(e)
      }
    })

    return monthList
  }, [startDate, supervisions, exceptions])

  // Find current month index for initial slide
  const currentMonthIndex = useMemo(() => {
    const idx = months.findIndex((m) => m.isCurrentMonth)
    return idx >= 0 ? idx : months.length - 1
  }, [months])

  // Set initial selected period to current month
  useEffect(() => {
    if (!selectedPeriod && months.length > 0) {
      const current = months.find((m) => m.isCurrentMonth)
      setSelectedPeriod(current?.period ?? months[months.length - 1].period)
    }
  }, [months, selectedPeriod])

  const selectedMonth = months.find((m) => m.period === selectedPeriod)

  // Get status color for month card (matches heatmap)
  const getMonthStatus = (month: MonthData) => {
    if (month.exceptions.some((e) => e.exceptionType === "annual_leave")) return "teal"
    if (month.exceptions.some((e) => e.exceptionType === "sick_leave")) return "purple"
    if (month.exceptions.some((e) => e.exceptionType === "not_required")) return "gray"
    if (month.isFuture) {
      if (month.supervisions.length > 0) return "blue"
      return "neutral"
    }
    if (month.supervisions.filter((s) => s.isCompleted).length >= 1) return "green"
    if (month.supervisions.length > 0) return "amber"
    if (!month.isFuture && !month.isCurrentMonth) return "red"
    return "neutral"
  }

  const statusBgColors: Record<string, string> = {
    green: "bg-emerald-100",
    amber: "bg-amber-100",
    red: "bg-red-100",
    blue: "bg-blue-100",
    teal: "bg-teal-100",
    purple: "bg-purple-100",
    gray: "bg-gray-100",
    neutral: "bg-white",
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8 overflow-hidden">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
            Record Supervision
          </Button>
        </div>
        <Button size="sm" variant="ghost">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Timeline carousel */}
      <div className="mt-2 overflow-hidden">
        <div className="flex items-center gap-2">
          {/* Left navigation arrow */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => swiperRef.current?.slidePrev()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Swiper container */}
          <div className="flex-1 min-w-0 max-w-full w-full relative overflow-hidden">

            <Swiper
              modules={[Navigation, Keyboard, EffectCoverflow]}
              effect="coverflow"
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 50,
                modifier: 1,
                slideShadows: false,
              }}
              spaceBetween={20}
              slidesPerView="auto"
              centeredSlides={true}
              initialSlide={currentMonthIndex}
              keyboard={{ enabled: true }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper
              }}
              onSlideChange={(swiper) => {
                const month = months[swiper.activeIndex]
                if (month) setSelectedPeriod(month.period)
              }}
              className="h-40"
            >
            {months.map((month, index) => {
              const status = getMonthStatus(month)
              const isSelected = month.period === selectedPeriod

              return (
                <SwiperSlide
                  key={month.period}
                  className="!w-auto"
                  onClick={() => {
                    setSelectedPeriod(month.period)
                    swiperRef.current?.slideTo(index)
                  }}
                >
                  <div
                    className={cn(
                      "relative flex flex-col items-center cursor-pointer transition-all",
                      isSelected && "scale-110"
                    )}
                  >
                    {/* Year label (show on Jan or first visible) */}
                    {(month.shortLabel === "Jan" || index === 0) && (
                      <span className="text-sm text-muted-foreground mb-3">
                        {month.year}
                      </span>
                    )}
                    {!(month.shortLabel === "Jan" || index === 0) && (
                      <span className="text-sm text-transparent mb-3">.</span>
                    )}

                    {/* Month card */}
                    <div
                      className={cn(
                        "px-6 py-4 rounded-xl border min-w-[90px] text-center transition-all duration-200",
                        statusBgColors[status],
                        isSelected
                          ? "border-primary border-2 shadow-lg"
                          : "border-border"
                      )}
                    >
                      <span className={cn(
                        "text-lg font-medium",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {month.shortLabel}
                      </span>

                      {/* Activity indicator - fixed height for consistency */}
                      <div className="flex justify-center gap-1.5 mt-3 h-3">
                        {month.supervisions.map((s) => (
                          <div
                            key={s.id}
                            className={cn(
                              "w-3 h-3 rounded-full",
                              s.isCompleted ? "bg-emerald-500" : "bg-amber-500"
                            )}
                          />
                        ))}
                        {month.exceptions.map((e) => (
                          <div
                            key={e.id}
                            className={cn(
                              "w-3 h-3 rounded-full",
                              e.exceptionType === "annual_leave" ? "bg-teal-500" :
                              e.exceptionType === "sick_leave" ? "bg-purple-500" :
                              "bg-gray-400"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              )
            })}
          </Swiper>
          </div>

          {/* Right navigation arrow */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => swiperRef.current?.slideNext()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selected month details */}
      {selectedMonth && (
        <div className="border rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{selectedMonth.label}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Required: 1</span>
              <span>Completed: {selectedMonth.supervisions.filter(s => s.isCompleted).length}</span>
            </div>
          </div>

          {/* Supervisions */}
          {selectedMonth.supervisions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Supervisions</h4>
              <div className="grid gap-2">
                {selectedMonth.supervisions.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "p-3 rounded-lg border flex items-start gap-3",
                      s.isCompleted
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-amber-50 border-amber-200"
                    )}
                  >
                    <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {formatDate(s.supervisionDate)}
                        </span>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded",
                          s.isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        )}>
                          {s.isCompleted ? "Completed" : "Planned"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Conducted by: {s.conductedByName}
                      </p>
                      {s.notes && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                          <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                          {s.notes}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exceptions */}
          {selectedMonth.exceptions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Exceptions</h4>
              <div className="grid gap-2">
                {selectedMonth.exceptions.map((e) => (
                  <div
                    key={e.id}
                    className={cn(
                      "p-3 rounded-lg border flex items-start gap-3",
                      EXCEPTION_COLORS[e.exceptionType]
                    )}
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">
                        {EXCEPTION_LABELS[e.exceptionType]}
                      </span>
                      {e.notes && (
                        <p className="text-sm opacity-80 mt-0.5">{e.notes}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {selectedMonth.supervisions.length === 0 && selectedMonth.exceptions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No supervisions or exceptions recorded for this month.</p>
              <Button variant="link" size="sm" className="mt-2">
                <Plus className="h-4 w-4" />
                Record Supervision
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
