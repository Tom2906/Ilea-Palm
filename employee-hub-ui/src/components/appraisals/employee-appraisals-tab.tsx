interface EmployeeAppraisalsTabProps {
  employeeId: string
}

export function EmployeeAppraisalsTab({ employeeId: _employeeId }: EmployeeAppraisalsTabProps) {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">
        Appraisal history will be available here in a future update.
      </p>
    </div>
  )
}
