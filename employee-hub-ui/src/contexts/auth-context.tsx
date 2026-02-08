import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { api } from "@/lib/api"
import { msalInstance, loginRequest } from "@/lib/msal-config"
import type { LoginResponse, UserInfo } from "@/lib/types"

interface AuthContextType {
  user: UserInfo | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithMicrosoft: (() => Promise<void>) | null
  logout: () => void
  hasPermission: (key: string) => boolean
  permissions: Record<string, string>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const initStarted = useRef(false)

  useEffect(() => {
    if (initStarted.current) return
    initStarted.current = true

    const init = async () => {
      // Handle Microsoft redirect response (if returning from Microsoft login)
      if (msalInstance) {
        try {
          const result = await msalInstance.handleRedirectPromise()
          if (result?.idToken) {
            const response = await api.post<LoginResponse>("/auth/microsoft", {
              idToken: result.idToken,
            })
            api.setToken(response.token)
            setUser(response.user)
            setLoading(false)
            return
          }
        } catch {
          // Redirect processing failed — fall through to normal token check
        }
      }

      // Normal JWT token validation
      const token = api.getToken()
      if (token) {
        try {
          setUser(await api.get<UserInfo>("/auth/me"))
        } catch {
          api.clearToken()
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    })
    api.setToken(response.token)
    setUser(response.user)
  }, [])

  const logout = useCallback(() => {
    api.clearToken()
    setUser(null)
  }, [])

  const permissions = user?.permissions ?? {}

  const hasPermission = useCallback(
    (key: string) => key in permissions,
    [permissions],
  )

  const loginWithMicrosoft = msalInstance
    ? async () => {
        await msalInstance.loginRedirect(loginRequest)
      }
    : null

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithMicrosoft, logout, hasPermission, permissions }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
