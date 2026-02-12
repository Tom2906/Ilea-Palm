import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, AlertCircle } from "lucide-react"

const TRIAGE_API = "http://localhost:3100/api"
// Employee Hub project ID — set after registering the project in the triage engine.
// For POC, this is fetched dynamically from the triage engine's project list.

export default function ReportIssuePage() {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<"success" | "error" | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)

    try {
      // Find the Employee Hub project in the triage engine
      const projectsRes = await fetch(`${TRIAGE_API}/projects`)
      if (!projectsRes.ok) throw new Error("Cannot connect to Triage Engine")
      const projects = await projectsRes.json()
      const project = projects.find((p: { name: string }) =>
        p.name.toLowerCase().includes("employee hub")
      )
      if (!project) throw new Error("Employee Hub project not registered in Triage Engine")

      // Submit the ticket
      const res = await fetch(`${TRIAGE_API}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          title,
          description,
          pageUrl: window.location.href,
          browserInfo: navigator.userAgent,
          submittedBy: user?.displayName || user?.email || "unknown",
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to submit ticket")
      }

      setResult("success")
      setTitle("")
      setDescription("")
    } catch (err) {
      setResult("error")
      setErrorMessage(err instanceof Error ? err.message : "Failed to submit issue")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Report an Issue</h2>
        <p className="text-muted-foreground">
          Describe the problem you're experiencing. An AI agent will analyse the codebase and provide a diagnosis.
        </p>
      </div>

      {result === "success" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="size-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Issue submitted successfully</p>
              <p className="text-xs text-green-700">
                Your ticket is being analysed. You can check the status in the Triage Engine dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {result === "error" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="size-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to submit issue</p>
              <p className="text-xs text-red-700">{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Issue Details</CardTitle>
          <CardDescription>
            Provide as much detail as possible to help with diagnosis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issue-title">Title</Label>
              <Input
                id="issue-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-desc">Description</Label>
              <Textarea
                id="issue-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What happened? What did you expect to happen? Steps to reproduce..."
                className="min-h-32"
                required
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Page URL and browser info will be captured automatically.
              </p>
              <Button type="submit" disabled={submitting || !title || !description}>
                {submitting ? "Submitting..." : "Submit Issue"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
