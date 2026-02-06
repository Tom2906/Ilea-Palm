import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/login-form"
import { useEffect } from "react"

export default function LoginPage() {
  const { login, loginWithMicrosoft, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate("/", { replace: true })
  }, [user, navigate])

  const handleLogin = async (email: string, password: string) => {
    await login(email, password)
    navigate("/", { replace: true })
  }

  const handleMicrosoftLogin = loginWithMicrosoft
    ? async () => {
        await loginWithMicrosoft()
        navigate("/", { replace: true })
      }
    : null

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-white p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm onLogin={handleLogin} onMicrosoftLogin={handleMicrosoftLogin} />
      </div>
    </div>
  )
}
