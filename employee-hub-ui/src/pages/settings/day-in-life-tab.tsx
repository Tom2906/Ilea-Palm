import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { AIProvider, AIModel } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DEFAULT_DAY_IN_LIFE_PROMPT } from "@/lib/constants"
import { SaveBar } from "./save-bar"
import type { SettingsTabProps } from "./types"

export function DayInLifeTab({ currentForm, form, setForm, isDirty, isPending, onReset }: SettingsTabProps) {
  const { data: aiProviders } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => api.get<AIProvider[]>("/ai-providers"),
  })

  const { data: availableModels } = useQuery({
    queryKey: ["ai-models", currentForm.dayInLifeProviderId],
    queryFn: () => api.get<AIModel[]>(`/ai-providers/${currentForm.dayInLifeProviderId}/models`),
    enabled: !!currentForm.dayInLifeProviderId,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Day in the Life Configuration</CardTitle>
          <CardDescription>
            Configure which AI provider and model to use for Day in the Life document generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dayInLifeProvider">AI Provider</FieldLabel>
              <Select
                value={currentForm.dayInLifeProviderId || ""}
                onValueChange={(value) => {
                  setForm({ ...form, dayInLifeProviderId: value, dayInLifeModel: "" })
                }}
                disabled={isPending}
              >
                <SelectTrigger id="dayInLifeProvider" className="max-w-md">
                  <SelectValue placeholder="Select AI provider" />
                </SelectTrigger>
                <SelectContent>
                  {aiProviders?.filter(p => p.isActive).map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Choose which AI provider to use. Manage providers in the AI Providers page.
              </p>
            </Field>
            <Field>
              <FieldLabel htmlFor="dayInLifeModel">Model</FieldLabel>
              <Select
                value={currentForm.dayInLifeModel || ""}
                onValueChange={(value) => setForm({ ...form, dayInLifeModel: value })}
                disabled={isPending || !currentForm.dayInLifeProviderId}
              >
                <SelectTrigger id="dayInLifeModel" className="max-w-md">
                  <SelectValue placeholder={currentForm.dayInLifeProviderId ? "Select model" : "Select a provider first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableModels?.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} {model.description && `- ${model.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Choose which model to use for generating documents
              </p>
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="dayInLifePrompt">System Prompt</FieldLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm({ ...form, dayInLifeSystemPrompt: DEFAULT_DAY_IN_LIFE_PROMPT })}
                  disabled={isPending}
                >
                  Reset to Default
                </Button>
              </div>
              <Textarea
                id="dayInLifePrompt"
                className="font-mono text-xs min-h-[300px]"
                value={currentForm.dayInLifeSystemPrompt ?? ""}
                onChange={(e) => setForm({ ...form, dayInLifeSystemPrompt: e.target.value })}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Customize the AI behavior for Day in the Life documents. Click "Reset to Default" to restore the original prompt.
              </p>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <SaveBar dirty={isDirty} pending={isPending} onReset={onReset} />
    </div>
  )
}
