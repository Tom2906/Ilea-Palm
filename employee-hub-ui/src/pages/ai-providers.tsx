import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { AIProvider } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getProviderLabel } from "@/lib/constants"

interface ProviderFormData {
  provider: string
  name: string
  apiKey: string
}

export default function AIProvidersPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null)
  const [formData, setFormData] = useState<ProviderFormData>({
    provider: "anthropic",
    name: "",
    apiKey: "",
  })

  const { data: providers, isLoading } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => api.get<AIProvider[]>("/ai-providers"),
  })

  const createMutation = useMutation({
    mutationFn: (data: ProviderFormData) => api.post("/ai-providers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] })
      setIsCreateOpen(false)
      setFormData({ provider: "anthropic", name: "", apiKey: "" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProviderFormData> }) =>
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

  const handleCreate = () => {
    createMutation.mutate(formData)
  }

  const handleUpdate = () => {
    if (!editingProvider) return
    updateMutation.mutate({
      id: editingProvider.id,
      data: {
        name: formData.name,
        apiKey: formData.apiKey || undefined,
      },
    })
  }

  const handleEdit = (provider: AIProvider) => {
    setEditingProvider(provider)
    setFormData({
      provider: provider.provider,
      name: provider.name,
      apiKey: "", // Don't populate API key for security
    })
  }


  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Providers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage AI provider configurations for Day in the Life and other features
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
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
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {providers?.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{provider.name}</CardTitle>
                  <Badge variant={provider.isActive ? "default" : "secondary"}>
                    {provider.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getProviderLabel(provider.provider)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
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
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(provider)}>
                        <Pencil className="h-4 w-4" />
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
                        <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? "Updating..." : "Update"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete provider "${provider.name}"?`)) {
                        deleteMutation.mutate(provider.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Created {new Date(provider.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
        {providers?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No AI providers configured. Click "Add Provider" to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
