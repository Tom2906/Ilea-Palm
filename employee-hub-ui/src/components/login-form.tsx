import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface LoginFormProps extends React.ComponentProps<"div"> {
  onLogin: (email: string, password: string) => Promise<void>
  onMicrosoftLogin?: (() => Promise<void>) | null
}

export function LoginForm({
  className,
  onLogin,
  onMicrosoftLogin,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [msLoading, setMsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleMicrosoftLogin = async () => {
    if (!onMicrosoftLogin) return
    setError("")
    setMsLoading(true)
    try {
      await onMicrosoftLogin()
    } catch (err: unknown) {
      // Silently ignore user cancellation
      const error = err as { errorCode?: string }
      if (error?.errorCode === "user_cancelled") return
      if (error?.errorCode === "popup_window_error") {
        setError("Please allow popups for this site")
        return
      }
      setError(err instanceof Error ? err.message : "Microsoft sign-in failed")
    } finally {
      setMsLoading(false)
    }
  }

  const anyLoading = loading || msLoading

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-primary/20 shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Sign in to Employee Hub
                </p>
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              {onMicrosoftLogin && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={anyLoading}
                    onClick={handleMicrosoftLogin}
                  >
                    {msLoading ? (
                      "Signing in..."
                    ) : (
                      <>
                        <svg
                          className="mr-2 h-4 w-4"
                          viewBox="0 0 21 21"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                          <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                          <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                          <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                        </svg>
                        Sign in with Microsoft
                      </>
                    )}
                  </Button>
                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-muted-foreground/20" />
                    <span className="mx-3 text-xs text-muted-foreground">
                      or continue with email
                    </span>
                    <div className="flex-grow border-t border-muted-foreground/20" />
                  </div>
                </>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@ileapalm.co.uk"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={anyLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={anyLoading}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={anyLoading} className="w-full">
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          <div className="relative hidden md:flex md:items-center md:justify-center border-l border-primary/10">
            <img
              src="/logo.jpg"
              alt="Ilea Palm"
              className="max-h-64 w-auto object-contain p-8"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
