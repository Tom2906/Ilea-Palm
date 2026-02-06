import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { useAuth } from "@/contexts/auth-context"
import type { AppraisalMilestone, Employee } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, FieldLabel } from "@/components/ui/field"
import { Check, Circle, Loader2 } from "lucide-react"

interface EmployeeAppraisalsTabProps {
  employeeId: string
}

export function EmployeeAppraisalsTab({ employeeId }: EmployeeAppraisalsTabProps) {
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const [selectedMilestone, setSelectedMilestone] = useState<AppraisalMilestone | null>(null)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["appraisals", "employee", employeeId],
    queryFn: () => api.get<AppraisalMilestone[]>(`/appraisals/employee/${employeeId}`),
    enabled: !!employeeId,
  })

  const generateMutation = useMutation({
    mutationFn: () => api.post(`/appraisals/generate/${employeeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appraisals", "employee", employeeId] })
    },
  })

  const handleMarkComplete = (milestone: AppraisalMilestone) => {
    setSelectedMilestone(milestone)
    setCompleteModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  // No milestones - show generate button
  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          No appraisal milestones have been generated for this employee yet.
        </p>
        {hasPermission("appraisals.manage") && (
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Milestones"
            )}
          </Button>
        )}
      </div>
    )
  }

  // Sort milestones by due date
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Appraisal Milestones</h3>

      <div className="space-y-3">
        {sortedMilestones.map((milestone) => (
          <MilestoneItem
            key={milestone.id}
            milestone={milestone}
            onMarkComplete={handleMarkComplete}
            canManage={hasPermission("appraisals.manage")}
          />
        ))}
      </div>

      <CompleteAppraisalModal
        open={completeModalOpen}
        onOpenChange={setCompleteModalOpen}
        milestone={selectedMilestone}
        employeeId={employeeId}
      />
    </div>
  )
}

interface MilestoneItemProps {
  milestone: AppraisalMilestone
  onMarkComplete: (milestone: AppraisalMilestone) => void
  canManage: boolean
}

function MilestoneItem({ milestone, onMarkComplete, canManage }: MilestoneItemProps) {
  const isCompleted = milestone.status === "completed"

  // Status-based styling
  const getStatusColor = () => {
    switch (milestone.status) {
      case "completed":
        return "text-emerald-600"
      case "due_soon":
        return "text-amber-600"
      case "overdue":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusLabel = () => {
    if (isCompleted) {
      return `Completed ${formatDate(milestone.completedDate)}`
    }
    if (milestone.status === "overdue") {
      return `Overdue - Was due ${formatDate(milestone.dueDate)}`
    }
    if (milestone.status === "due_soon") {
      return `Due ${formatDate(milestone.dueDate)}`
    }
    return `Due ${formatDate(milestone.dueDate)}`
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      {/* Status icon */}
      <div className={`mt-0.5 ${getStatusColor()}`}>
        {isCompleted ? (
          <Check className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isCompleted ? "text-foreground" : getStatusColor()}`}>
            {milestone.milestoneLabel}
          </span>
        </div>
        <p className={`text-sm ${getStatusColor()}`}>
          {getStatusLabel()}
        </p>
        {milestone.conductedByName && (
          <p className="text-xs text-muted-foreground mt-1">
            Conducted by: {milestone.conductedByName}
          </p>
        )}
        {milestone.notes && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            {milestone.notes}
          </p>
        )}
      </div>

      {/* Action button */}
      {!isCompleted && canManage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMarkComplete(milestone)}
        >
          Mark Complete
        </Button>
      )}
    </div>
  )
}

interface CompleteAppraisalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  milestone: AppraisalMilestone | null
  employeeId: string
}

function CompleteAppraisalModal({
  open,
  onOpenChange,
  milestone,
  employeeId,
}: CompleteAppraisalModalProps) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    completedDate: new Date().toISOString().split("T")[0],
    conductedById: "",
    notes: "",
  })
  const [error, setError] = useState("")

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/employees"),
  })

  const updateMutation = useMutation({
    mutationFn: (data: { completedDate: string; conductedById: string | null; notes: string | null }) =>
      api.put(`/appraisals/${milestone?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appraisals", "employee", employeeId] })
      queryClient.invalidateQueries({ queryKey: ["appraisals"] })
      onOpenChange(false)
      setForm({
        completedDate: new Date().toISOString().split("T")[0],
        conductedById: "",
        notes: "",
      })
      setError("")
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to update appraisal")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!milestone) return

    updateMutation.mutate({
      completedDate: form.completedDate,
      conductedById: form.conductedById || null,
      notes: form.notes || null,
    })
  }

  if (!milestone) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Appraisal Complete</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Completing: <strong>{milestone.milestoneLabel}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <FieldLabel>Date Completed</FieldLabel>
            <Input
              type="date"
              value={form.completedDate}
              onChange={(e) => setForm({ ...form, completedDate: e.target.value })}
              required
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Conducted By (optional)</FieldLabel>
            <Select
              value={form.conductedById}
              onValueChange={(value) => setForm({ ...form, conductedById: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select person who conducted" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Notes (optional)</FieldLabel>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional notes about this appraisal..."
              rows={3}
            />
          </FieldGroup>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Mark Complete"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
