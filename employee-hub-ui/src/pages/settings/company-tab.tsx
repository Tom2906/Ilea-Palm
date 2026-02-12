import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SaveBar } from "./save-bar"
import type { CompanyTabProps } from "./types"

export function CompanyTab({ currentForm, form, setForm, isDirty, isPending, onReset, roles, employeeStatuses }: CompanyTabProps) {
  const toggleHiddenRole = (role: string) => {
    const current = currentForm.defaultHiddenRoles
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role]
    setForm({ ...form, defaultHiddenRoles: next })
  }

  const toggleHiddenStatus = (status: string) => {
    const current = currentForm.defaultHiddenEmployeeStatuses
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    setForm({ ...form, defaultHiddenEmployeeStatuses: next })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>General company details</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
              <Input
                id="companyName"
                className="max-w-md"
                value={currentForm.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                disabled={isPending}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matrix Default Filters</CardTitle>
          <CardDescription>
            Hide these roles and statuses by default on Training and Supervision matrices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Hidden Roles</FieldLabel>
              <div className="flex flex-wrap gap-4 mt-2">
                {roles.map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={currentForm.defaultHiddenRoles.includes(role)}
                      onCheckedChange={() => toggleHiddenRole(role)}
                      disabled={isPending}
                    />
                    <label htmlFor={`role-${role}`} className="text-sm">{role}</label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Employees with these roles will be hidden by default
              </p>
            </Field>
            <Field>
              <FieldLabel>Hidden Employee Statuses</FieldLabel>
              <div className="flex flex-wrap gap-4 mt-2">
                {employeeStatuses?.map((status) => (
                  <div key={status.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`status-${status.id}`}
                      checked={currentForm.defaultHiddenEmployeeStatuses.includes(status.name)}
                      onCheckedChange={() => toggleHiddenStatus(status.name)}
                      disabled={isPending}
                    />
                    <label htmlFor={`status-${status.id}`} className="text-sm">{status.name}</label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Employees with these statuses will be hidden by default
              </p>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <SaveBar dirty={isDirty} pending={isPending} onReset={onReset} />
    </div>
  )
}
