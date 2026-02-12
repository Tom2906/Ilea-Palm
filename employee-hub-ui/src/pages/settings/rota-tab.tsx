import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SaveBar } from "./save-bar"
import type { RotaTabProps } from "./types"

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function RotaTab({
  currentForm, form, setForm, isDirty, isPending, onReset,
  roles, employeeStatuses,
  rotaYear, setRotaYear, rotaHours, setRotaHours, getMonthHours,
}: RotaTabProps) {
  const toggleHiddenRotaRole = (role: string) => {
    const current = currentForm.defaultHiddenRotaRoles
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role]
    setForm({ ...form, defaultHiddenRotaRoles: next })
  }

  const toggleHiddenRotaStatus = (status: string) => {
    const current = currentForm.defaultHiddenRotaEmployeeStatuses
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    setForm({ ...form, defaultHiddenRotaEmployeeStatuses: next })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Contracted Hours</CardTitle>
          <CardDescription>
            Set contracted hours per month — used to calculate over/under on the rota grid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setRotaYear(rotaYear - 1); setRotaHours({}) }}
            >
              &larr;
            </Button>
            <span className="text-sm font-semibold min-w-[60px] text-center">{rotaYear}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setRotaYear(rotaYear + 1); setRotaHours({}) }}
            >
              &rarr;
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-2xl">
            {monthNames.map((name, idx) => {
              const month = idx + 1
              return (
                <div key={month} className="flex items-center gap-2">
                  <label className="text-sm w-20 shrink-0">{name.slice(0, 3)}</label>
                  <Input
                    type="number"
                    step="0.5"
                    className="w-24"
                    placeholder="—"
                    value={getMonthHours(month)}
                    onChange={(e) => setRotaHours({ ...rotaHours, [month]: e.target.value })}
                    disabled={isPending}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Rota Filters</CardTitle>
          <CardDescription>
            Hide these roles and statuses by default on the Rota page (separate from Training/Supervision filters)
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
                      id={`rota-role-${role}`}
                      checked={currentForm.defaultHiddenRotaRoles.includes(role)}
                      onCheckedChange={() => toggleHiddenRotaRole(role)}
                      disabled={isPending}
                    />
                    <label htmlFor={`rota-role-${role}`} className="text-sm">{role}</label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Employees with these roles will be hidden by default on the rota
              </p>
            </Field>
            <Field>
              <FieldLabel>Hidden Employee Statuses</FieldLabel>
              <div className="flex flex-wrap gap-4 mt-2">
                {employeeStatuses?.map((status) => (
                  <div key={status.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`rota-status-${status.id}`}
                      checked={currentForm.defaultHiddenRotaEmployeeStatuses.includes(status.name)}
                      onCheckedChange={() => toggleHiddenRotaStatus(status.name)}
                      disabled={isPending}
                    />
                    <label htmlFor={`rota-status-${status.id}`} className="text-sm">{status.name}</label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Employees with these statuses will be hidden by default on the rota
              </p>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <SaveBar dirty={isDirty} pending={isPending} onReset={() => { onReset(); setRotaHours({}) }} />
    </div>
  )
}
