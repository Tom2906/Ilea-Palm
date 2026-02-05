import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SupervisionStatus, Supervision, SupervisionException } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, User, FileText, CheckCircle, Clock, ChevronRight } from "lucide-react"
import { RecordSupervisionModal } from "./record-supervision-modal"
import { EditSupervisionModal } from "./edit-supervision-modal"

const exceptionFullLabels: Record<SupervisionException['exceptionType'], string> = {
  not_required: 'Not Required',
  annual_leave: 'Annual Leave',
  sick_leave: 'Sick Leave',
}

interface MonthDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: SupervisionStatus | null
  period: string | null
  supervisions: Supervision[]
  exception: SupervisionException | null
}

export function MonthDetailsModal({
  open,
  onOpenChange,
  employee,
  period,
  supervisions,
  exception,
}: MonthDetailsModalProps) {
  const queryClient = useQueryClient()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingSupervision, setEditingSupervision] = useState<Supervision | null>(null)
  const [localRequiredCount, setLocalRequiredCount] = useState<number | null>(null)

  const updateRequiredMutation = useMutation({
    mutationFn: (data: { employeeId: string; period: string; requiredCount: number }) =>
      api.put(`/supervisions/required-count`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervisions"] })
    },
  })

  // Calculate the required count from data
  const dataRequiredCount = supervisions.length > 0 ? supervisions[0].requiredCount : employee?.supervisionFrequency || 1

  // Initialize local state when data changes
  useEffect(() => {
    setLocalRequiredCount(dataRequiredCount)
  }, [dataRequiredCount])

  if (!employee || !period) return null

  const [year, month] = period.split("-").map(Number)
  const monthDate = new Date(year, month - 1, 1)
  const monthLabel = monthDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  const completedSups = supervisions.filter(s => s.isCompleted)
  const plannedSups = supervisions.filter(s => !s.isCompleted)
  const displayRequiredCount = localRequiredCount ?? dataRequiredCount

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  }

  const getStatusBadge = () => {
    if (exception) {
      return <Badge variant="secondary">{exceptionFullLabels[exception.exceptionType]}</Badge>
    }
    if (completedSups.length >= displayRequiredCount) {
      return <Badge className="bg-green-500">Complete</Badge>
    }
    if (completedSups.length > 0) {
      return <Badge className="bg-amber-500">Partial ({completedSups.length}/{displayRequiredCount})</Badge>
    }
    if (plannedSups.length > 0) {
      return <Badge variant="outline" className="border-blue-300 text-blue-700">Planned</Badge>
    }
    return <Badge variant="destructive">Missing</Badge>
  }

  const handleRequiredCountBlur = () => {
    if (supervisions.length > 0 && localRequiredCount && localRequiredCount !== dataRequiredCount) {
      updateRequiredMutation.mutate({
        employeeId: employee.employeeId,
        period,
        requiredCount: localRequiredCount,
      })
    }
  }

  const SupervisionCard = ({ sup, isPlanned }: { sup: Supervision; isPlanned?: boolean }) => (
    <button
      onClick={() => setEditingSupervision(sup)}
      className={`w-full text-left p-3 rounded-lg space-y-1 transition-colors hover:bg-muted/50 ${
        isPlanned ? "border border-blue-200 bg-blue-50" : "border"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {formatDate(sup.supervisionDate)}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
        {sup.conductedByName}
      </div>
      {sup.notes && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-1">{sup.notes}</span>
        </div>
      )}
    </button>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pr-8">
            <div className="flex items-center gap-2">
              <DialogTitle>{employee.firstName} {employee.lastName}</DialogTitle>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground">{monthLabel}</p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Required count - editable */}
            <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
              <span>Required this month:</span>
              <input
                type="number"
                min="1"
                max="10"
                value={localRequiredCount ?? displayRequiredCount}
                onChange={(e) => setLocalRequiredCount(parseInt(e.target.value) || 1)}
                onBlur={handleRequiredCountBlur}
                disabled={updateRequiredMutation.isPending || supervisions.length === 0}
                className="w-16 h-8 text-center border rounded-md text-sm"
              />
            </div>

            {/* Exception */}
            {exception && (
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="font-medium text-sm">{exceptionFullLabels[exception.exceptionType]}</p>
                {exception.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{exception.notes}</p>
                )}
                {exception.createdByName && (
                  <p className="text-xs text-muted-foreground mt-1">Set by {exception.createdByName}</p>
                )}
              </div>
            )}

            {/* Completed Supervisions */}
            {completedSups.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Completed ({completedSups.length})
                </h4>
                {completedSups.map((sup) => (
                  <SupervisionCard key={sup.id} sup={sup} />
                ))}
              </div>
            )}

            {/* Planned Supervisions */}
            {plannedSups.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Planned ({plannedSups.length})
                </h4>
                {plannedSups.map((sup) => (
                  <SupervisionCard key={sup.id} sup={sup} isPlanned />
                ))}
              </div>
            )}

            {/* No supervisions message */}
            {supervisions.length === 0 && !exception && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No supervisions recorded for this month
              </p>
            )}

            {/* Add button */}
            <Button
              className="w-full"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Supervision
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RecordSupervisionModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        employee={employee}
        period={period}
      />

      <EditSupervisionModal
        open={!!editingSupervision}
        onOpenChange={(open) => !open && setEditingSupervision(null)}
        supervision={editingSupervision}
      />
    </>
  )
}
