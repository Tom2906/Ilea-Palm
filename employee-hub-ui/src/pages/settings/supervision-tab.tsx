import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SaveBar } from "./save-bar"
import type { SettingsTabProps } from "./types"

export function SupervisionTab({ currentForm, form, setForm, isDirty, isPending, onReset }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supervision Defaults</CardTitle>
          <CardDescription>
            Default values for employee supervision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="supFreq">Default Supervision Frequency (Months)</FieldLabel>
              <Input
                id="supFreq"
                type="number"
                className="w-32"
                value={currentForm.defaultSupervisionFrequencyMonths}
                onChange={(e) => setForm({ ...form, defaultSupervisionFrequencyMonths: parseInt(e.target.value) || 1 })}
                disabled={isPending}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supervision Matrix</CardTitle>
          <CardDescription>
            Configure how many months to display
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <Field>
                <FieldLabel htmlFor="monthsBack">Months Back</FieldLabel>
                <Input
                  id="monthsBack"
                  type="number"
                  value={currentForm.supervisionMonthsBack}
                  onChange={(e) => setForm({ ...form, supervisionMonthsBack: parseInt(e.target.value) || 9 })}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  History to show
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="monthsForward">Months Forward</FieldLabel>
                <Input
                  id="monthsForward"
                  type="number"
                  value={currentForm.supervisionMonthsForward}
                  onChange={(e) => setForm({ ...form, supervisionMonthsForward: parseInt(e.target.value) || 3 })}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Future to show
                </p>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appraisal Grid</CardTitle>
          <CardDescription>
            Configure how many reviews to display
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <Field>
                <FieldLabel htmlFor="appraisalBack">Reviews Back</FieldLabel>
                <Input
                  id="appraisalBack"
                  type="number"
                  value={currentForm.appraisalReviewsBack}
                  onChange={(e) => setForm({ ...form, appraisalReviewsBack: parseInt(e.target.value) || 2 })}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Completed reviews to show
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="appraisalForward">Reviews Forward</FieldLabel>
                <Input
                  id="appraisalForward"
                  type="number"
                  value={currentForm.appraisalReviewsForward}
                  onChange={(e) => setForm({ ...form, appraisalReviewsForward: parseInt(e.target.value) || 2 })}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upcoming reviews to show
                </p>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <SaveBar dirty={isDirty} pending={isPending} onReset={onReset} />
    </div>
  )
}
