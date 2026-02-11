import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/login-form"
import { useEffect } from "react"

const MS_REDIRECT_FLAG = "ms_auth_redirect_in_progress"

export default function LoginPage() {
  const { login, loginWithMicrosoft, user } = useAuth()
  const navigate = useNavigate()
  const [showPostRedirectDelay, setShowPostRedirectDelay] = useState(() => {
    if (typeof window === "undefined") return false
    const hash = window.location.hash
    const query = window.location.search
    const hasMicrosoftCallback = hash.includes("code=") || hash.includes("state=") || query.includes("code=") || query.includes("state=")
    const wasRedirecting = window.sessionStorage.getItem(MS_REDIRECT_FLAG) === "1"
    return hasMicrosoftCallback || wasRedirecting
  })

  useEffect(() => {
    if (user && !showPostRedirectDelay) navigate("/", { replace: true })
  }, [user, showPostRedirectDelay, navigate])

  useEffect(() => {
    if (!showPostRedirectDelay) return

    const timer = window.setTimeout(() => {
      window.sessionStorage.removeItem(MS_REDIRECT_FLAG)
      setShowPostRedirectDelay(false)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [showPostRedirectDelay])

  const handleLogin = async (email: string, password: string) => {
    await login(email, password)
    navigate("/", { replace: true })
  }

  const handleMicrosoftLogin = loginWithMicrosoft
    ? async () => {
        window.sessionStorage.setItem(MS_REDIRECT_FLAG, "1")
        await loginWithMicrosoft()
      }
    : null

  if (showPostRedirectDelay) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-white p-6 md:p-10">
        <div className="w-full max-w-xl p-10 text-center">
          <div className="mx-auto mb-6 h-72 w-72 overflow-hidden rounded-lg">
            <video
              className="h-full w-full scale-[1.9] object-cover"
              src="/signing-in.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />
          </div>
          <h1 className="text-2xl font-semibold text-muted-foreground/80">Signing you in</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm onLogin={handleLogin} onMicrosoftLogin={handleMicrosoftLogin} />
      </div>
    </div>
  )
}
