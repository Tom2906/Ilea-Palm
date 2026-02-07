import { useAuth } from "@/contexts/auth-context"
import { EmployeeLeaveTab } from "@/components/leave/employee-leave-tab"

export default function MyLeavePage() {
  const { user } = useAuth()

  if (!user?.employeeId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Your account is not linked to an employee record. Contact an administrator to link your account.
        </p>
      </div>
    )
  }

  return (
    <EmployeeLeaveTab
      employeeId={user.employeeId}
      employeeName={user.displayName}
    />
  )
}
