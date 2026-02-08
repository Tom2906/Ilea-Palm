import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import type { TrainingStatus } from "@/lib/types"
import { RecordTrainingModal } from "@/components/record-training-modal"
import { TrainingCard } from "@/components/training-card"
import { Button } from "@/components/ui/button"
import { FilterBar } from "@/components/filter-bar"
import { GroupBy } from "@/components/group-by"
import type { GroupByOption } from "@/components/group-by"
import { ListPage } from "@/components/list-page"
import type { ListPageGroup } from "@/components/list-page"
import { GraduationCap } from "lucide-react"

const categoryOrder = ["Online Mandatory", "F2F Mandatory", "Additional"] as const

const groupByOptions: GroupByOption[] = [
  { id: "category", label: "Category" },
  { id: "status", label: "Status" },
]

export default function MyTrainingPage() {
  const { user } = useAuth()
  const employeeId = user?.employeeId
  const [searchParams] = useSearchParams()
  const appliedFilter = useRef(false)
  const [search, setSearch] = useState("")
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [recordOpen, setRecordOpen] = useState(false)
  const [groupBy, setGroupBy] = useState<string | null>("category")

  const { data: trainingStatuses, isLoading } = useQuery({
    queryKey: ["training-status"],
    queryFn: () => api.get<TrainingStatus[]>("/training-records/status"),
    enabled: !!employeeId,
  })

  const toggle = useCallback((id: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
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

  const myTraining = useMemo(() =>
    trainingStatuses?.filter((s) => s.employeeId === employeeId) ?? [],
    [trainingStatuses, employeeId],
  )

  const statuses = useMemo(() => {
    const unique = [...new Set(myTraining.map((s) => s.status))]
    return unique.sort()
  }, [myTraining])

  // Apply URL ?status= and ?category= filters once when data loads
  useEffect(() => {
    const filterStatus = searchParams.get("status")
    const filterCategory = searchParams.get("category")
    if ((filterStatus || filterCategory) && statuses.length > 0 && !appliedFilter.current) {
      appliedFilter.current = true
      const toHide = new Set<string>()
      if (filterStatus) {
        statuses.filter((s) => s !== filterStatus).forEach((s) => toHide.add(`status:${s}`))
      }
      if (filterCategory) {
        categoryOrder.filter((c) => c !== filterCategory).forEach((c) => toHide.add(`cat:${c}`))
      }
      setHidden(toHide)
    }
  }, [searchParams, statuses])

  const filterGroups = useMemo(() => [
    { label: "Status", items: statuses.map((s) => ({ id: `status:${s}`, label: s })) },
    { label: "Category", items: categoryOrder.map((c) => ({ id: `cat:${c}`, label: c })) },
  ], [statuses])

  const filtered = useMemo(() => {
    return myTraining.filter((s) => {
      if (hidden.has(`status:${s.status}`)) return false
      if (hidden.has(`cat:${s.category}`)) return false
      const term = search.toLowerCase()
      return s.courseName.toLowerCase().includes(term)
    })
  }, [myTraining, hidden, search])

  const groups: ListPageGroup[] | undefined = useMemo(() => {
    if (!groupBy) return undefined

    if (groupBy === "category") {
      return categoryOrder.map((cat) => {
        const items = filtered.filter((s) => s.category === cat)
        return {
          key: cat,
          label: cat,
          itemCount: items.length,
          content: items.map((s) => (
            <TrainingCard key={s.courseId} data={s} />
          )),
        }
      })
    }

    if (groupBy === "status") {
      const statusOrder = [...new Set(filtered.map((s) => s.status))].sort()
      return statusOrder.map((status) => {
        const items = filtered.filter((s) => s.status === status)
        return {
          key: status,
          label: status,
          itemCount: items.length,
          content: items.map((s) => (
            <TrainingCard key={s.courseId} data={s} />
          )),
        }
      })
    }

    return undefined
  }, [groupBy, filtered])

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
    <>
      <ListPage
        loading={isLoading}
        groups={groups}
        itemCount={filtered.length}
        emptyMessage="No training records match your filters."
        searchPlaceholder="Search..."
        searchValue={search}
        onSearchChange={setSearch}
        toolbar={
          <>
            <GroupBy options={groupByOptions} value={groupBy} onChange={setGroupBy} />
            <FilterBar
              filters={filterGroups}
              hidden={hidden}
              onToggle={toggle}
              onToggleAll={toggleAll}
              onClear={() => setHidden(new Set())}
            />
            <Button variant="outline" size="sm" onClick={() => setRecordOpen(true)}>
              <GraduationCap className="h-3.5 w-3.5 mr-1" />
              Record Training
            </Button>
          </>
        }
      >
        {filtered.map((s) => (
          <TrainingCard key={s.courseId} data={s} />
        ))}
      </ListPage>
      <RecordTrainingModal
        employeeId={employeeId}
        employeeName={user.displayName}
        open={recordOpen}
        onOpenChange={setRecordOpen}
      />
    </>
  )
}
