import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SaveBar } from "./save-bar"
import type { SettingsTabProps } from "./types"

export function TrainingTab({ currentForm, form, setForm, isDirty, isPending, onReset }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Training Course Defaults</CardTitle>
          <CardDescription>
            Default values when creating new training courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4 max-w-xl">
              <Field>
                <FieldLabel htmlFor="warningDays">Warning Days Before Expiry</FieldLabel>
                <Input
                  id="warningDays"
                  type="number"
                  value={currentForm.defaultExpiryWarningDays}
                  onChange={(e) => setForm({ ...form, defaultExpiryWarningDays: parseInt(e.target.value) || 0 })}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Shows amber "Expiring Soon" status
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="notifDays">Notification Days Before</FieldLabel>
                <Input
                  id="notifDays"
                  type="number"
                  value={currentForm.defaultNotificationDaysBefore}
                  onChange={(e) => setForm({ ...form, defaultNotificationDaysBefore: parseInt(e.target.value) || 0 })}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  When to send email reminders
                </p>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="reminderFreq">Reminder Frequency (Days)</FieldLabel>
              <Input
                id="reminderFreq"
                type="number"
                className="w-32"
                value={currentForm.defaultReminderFrequencyDays}
                onChange={(e) => setForm({ ...form, defaultReminderFrequencyDays: parseInt(e.target.value) || 7 })}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Days between reminder emails
              </p>
            </Field>
            <div className="flex gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notifyEmp"
                  checked={currentForm.defaultNotifyEmployee}
                  onCheckedChange={(c) => setForm({ ...form, defaultNotifyEmployee: !!c })}
                  disabled={isPending}
                />
                <label htmlFor="notifyEmp" className="text-sm">Notify Employee</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notifyAdm"
                  checked={currentForm.defaultNotifyAdmin}
                  onCheckedChange={(c) => setForm({ ...form, defaultNotifyAdmin: !!c })}
                  disabled={isPending}
                />
                <label htmlFor="notifyAdm" className="text-sm">Notify Admin</label>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <SaveBar dirty={isDirty} pending={isPending} onReset={onReset} />
    </div>
  )
}
