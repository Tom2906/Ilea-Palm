import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { SupervisionStatus, SupervisionException } from "@/lib/types"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { ClipboardCheck, Calendar, Thermometer, Ban, Trash2 } from "lucide-react"

interface CellContextMenuProps {
  children: React.ReactNode
  employee: SupervisionStatus
  period: string
  exception: SupervisionException | null
  onRecordSupervision: () => void
}

export function CellContextMenu({
  children,
  employee,
  period,
  exception,
  onRecordSupervision,
}: CellContextMenuProps) {
  const queryClient = useQueryClient()

  const createExceptionMutation = useMutation({
    mutationFn: (data: { employeeId: string; period: string; exceptionType: string; notes?: string }) =>
      api.post("/supervision-exceptions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervision-exceptions"] })
      queryClient.invalidateQueries({ queryKey: ["supervision-status"] })
    },
  })

  const deleteExceptionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/supervision-exceptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervision-exceptions"] })
      queryClient.invalidateQueries({ queryKey: ["supervision-status"] })
    },
  })

  const handleCreateException = (exceptionType: 'not_required' | 'annual_leave' | 'sick_leave') => {
    createExceptionMutation.mutate({
      employeeId: employee.employeeId,
      period,
      exceptionType,
    })
  }

  const handleRemoveException = () => {
    if (exception) {
      deleteExceptionMutation.mutate(exception.id)
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onRecordSupervision}>
          <ClipboardCheck className="size-4" />
          Add Supervision
        </ContextMenuItem>

        <ContextMenuSeparator />

        {exception ? (
          <ContextMenuItem onClick={handleRemoveException} variant="destructive">
            <Trash2 className="size-4" />
            Remove Exception
          </ContextMenuItem>
        ) : (
          <>
            <ContextMenuItem onClick={() => handleCreateException('not_required')}>
              <Ban className="size-4" />
              Mark as Not Required
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCreateException('annual_leave')}>
              <Calendar className="size-4" />
              Mark as Annual Leave
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleCreateException('sick_leave')}>
              <Thermometer className="size-4" />
              Mark as Sick Leave
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
