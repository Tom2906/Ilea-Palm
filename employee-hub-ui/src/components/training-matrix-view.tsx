import { useState, useMemo, useCallback } from "react"
import type { TrainingStatus, TrainingCourse, Employee } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TrainingHeatmap } from "@/components/training-heatmap"
import { FilterDropdown } from "@/components/filter-dropdown"
import { X } from "lucide-react"

const categories = ["Online Mandatory", "F2F Mandatory", "Additional"] as const
const allStatuses = ["Valid", "Completed", "Expiring Soon", "Expired"] as const

interface TrainingMatrixViewProps {
  employees: Employee[]
  courses: TrainingCourse[]
  statuses: TrainingStatus[]
  loading: boolean
}

export function TrainingMatrixView({
  employees,
  courses,
  statuses,
  loading,
}: TrainingMatrixViewProps) {
  const [activeTab, setActiveTab] = useState<string>(categories[0])
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const coursesByCategory = useMemo(() => {
    const map = new Map<string, TrainingCourse[]>()
    for (const cat of categories) {
      const filtered = courses.filter((c) => c.category === cat)
      if (filtered.length > 0) map.set(cat, filtered)
    }
    return map
  }, [courses])

  const hasStatusFilter = allStatuses.some((s) => hidden.has(`status:${s}`))

  const statusMap = useMemo(() => {
    const map = new Map<string, TrainingStatus>()
    statuses.forEach((s) => {
      if (!hidden.has(`status:${s.status}`)) {
        map.set(`${s.employeeId}-${s.courseId}`, s)
      }
    })
    return map
  }, [statuses, hidden])

  const activeTabCourses = coursesByCategory.get(activeTab) ?? []

  const filteredEmployees = useMemo(() => {
    const byId = employees.filter((e) => !hidden.has(`emp:${e.id}`))
    if (!hasStatusFilter) return byId
    return byId.filter((e) =>
      activeTabCourses.some((c) => !hidden.has(`course:${c.id}`) && statusMap.has(`${e.id}-${c.id}`)),
    )
  }, [employees, hidden, hasStatusFilter, activeTabCourses, statusMap])

  const filteredCourses = useMemo(() => {
    const byId = activeTabCourses.filter((c) => !hidden.has(`course:${c.id}`))
    if (!hasStatusFilter) return byId
    return byId.filter((c) =>
      filteredEmployees.some((e) => statusMap.has(`${e.id}-${c.id}`)),
    )
  }, [activeTabCourses, hidden, hasStatusFilter, filteredEmployees, statusMap])

  const toggle = useCallback((id: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback((ids: string[], hide: boolean) => {
    setHidden((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (hide ? next.add(id) : next.delete(id)))
      return next
    })
  }, [])

  const employeeItems = useMemo(
    () => employees.map((e) => ({
      id: `emp:${e.id}`,
      label: `${e.firstName} ${e.lastName}`,
    })),
    [employees],
  )

  const courseItems = useMemo(
    () => activeTabCourses.map((c) => ({
      id: `course:${c.id}`,
      label: c.name,
    })),
    [activeTabCourses],
  )

  const statusItems = useMemo(
    () => allStatuses.map((s) => ({
      id: `status:${s}`,
      label: s,
    })),
    [],
  )

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-4">
        <div className="flex gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-200 border border-emerald-300" />
          <span>Valid / Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-200 border border-amber-300" />
          <span>Expiring Soon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-200 border border-red-300" />
          <span>Expired</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
          <span>Not Completed</span>
        </div>
      </div>

      {/* Tabs + Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2">
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="ml-auto flex items-center gap-1.5">
            <FilterDropdown
              label="Employees"
              items={employeeItems}
              hidden={hidden}
              onToggle={toggle}
              onToggleAll={toggleAll}
            />
            <FilterDropdown
              label="Courses"
              items={courseItems}
              hidden={hidden}
              onToggle={toggle}
              onToggleAll={toggleAll}
            />
            <FilterDropdown
              label="Status"
              items={statusItems}
              hidden={hidden}
              onToggle={toggle}
              onToggleAll={toggleAll}
            />
            {hidden.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground"
                onClick={() => setHidden(new Set())}
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="flex-1 flex flex-col min-h-0">
            <TrainingHeatmap
              employees={filteredEmployees}
              courses={cat === activeTab ? filteredCourses : (coursesByCategory.get(cat) ?? []).filter((c) => !hidden.has(`course:${c.id}`))}
              statusMap={statusMap}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
