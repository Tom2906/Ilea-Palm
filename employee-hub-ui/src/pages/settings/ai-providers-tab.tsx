import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { AIProvider } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ListRow } from "@/components/list-row"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getProviderLabel } from "@/lib/constants"

export function AIProvidersTab() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null)
  const [formData, setFormData] = useState({
    provider: "anthropic",
    name: "",
    apiKey: "",
  })

  const { data: aiProviders } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => api.get<AIProvider[]>("/ai-providers"),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post("/ai-providers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] })
      setIsCreateOpen(false)
      setFormData({ provider: "anthropic", name: "", apiKey: "" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) =>
      api.put(`/ai-providers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] })
      setEditingProvider(null)
      setFormData({ provider: "anthropic", name: "", apiKey: "" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/ai-providers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] })
    },
  })

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider)
    setFormData({
      provider: provider.provider,
      name: provider.name,
      apiKey: "",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Providers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage AI provider configurations for Day in the Life and other features
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add AI Provider</DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel>Provider</FieldLabel>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                    <SelectItem value="gemini">Google (Gemini)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  placeholder="e.g., Production Claude, Test GPT"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>API Key</FieldLabel>
                <Input
                  type="password"
                  placeholder="Enter API key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {aiProviders?.map((provider) => (
          <ListRow key={provider.id}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{provider.name}</p>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span>{getProviderLabel(provider.provider)}</span>
                <span>Created {new Date(provider.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <Badge variant={provider.isActive ? "default" : "secondary"} className="shrink-0">
              {provider.isActive ? "Active" : "Inactive"}
            </Badge>
            <Dialog
              open={editingProvider?.id === provider.id}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingProvider(null)
                  setFormData({ provider: "anthropic", name: "", apiKey: "" })
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0" onClick={() => handleEdit(provider)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Provider</DialogTitle>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Provider</FieldLabel>
                    <Input value={getProviderLabel(formData.provider)} disabled />
                  </Field>
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>API Key</FieldLabel>
                    <Input
                      type="password"
                      placeholder="Leave empty to keep existing key"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Only enter a new key if you want to update it
                    </p>
                  </Field>
                </FieldGroup>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingProvider(null)
                      setFormData({ provider: "anthropic", name: "", apiKey: "" })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!editingProvider) return
                      updateMutation.mutate({
                        id: editingProvider.id,
                        data: {
                          name: formData.name,
                          apiKey: formData.apiKey || undefined,
                        },
                      })
                    }}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Updating..." : "Update"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => {
                if (confirm(`Delete provider "${provider.name}"?`)) {
                  deleteMutation.mutate(provider.id)
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </ListRow>
        ))}
        {aiProviders?.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No AI providers configured. Click "Add Provider" to get started.
          </div>
        )}
      </div>
    </div>
  )
}
