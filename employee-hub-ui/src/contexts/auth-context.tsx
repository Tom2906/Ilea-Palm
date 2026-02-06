import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useMsal } from "@azure/msal-react"
import { api } from "@/lib/api"
import { msalEnabled, loginRequest } from "@/lib/msal-config"
import type { LoginResponse, UserInfo } from "@/lib/types"

interface AuthContextType {
  user: UserInfo | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithMicrosoft: (() => Promise<void>) | null
  logout: () => void
  hasPermission: (key: string) => boolean
  canManageEmployee: (employeeId: string) => boolean
  permissions: string[]
  dataScope: "all" | "reports" | "own"
}

const AuthContext = createContext<AuthContextType | null>(null)

function useAuthState() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = api.getToken()
    if (token) {
      api
        .get<UserInfo>("/auth/me")
        .then(setUser)
        .catch(() => {
          api.clearToken()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
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

  const permissions = user?.permissions ?? []
  const dataScope = user?.dataScope ?? "own"
  const directReportIds = user?.directReportIds ?? []

  const permissionSet = useMemo(() => new Set(permissions), [permissions])

  const hasPermission = useCallback(
    (key: string) => permissionSet.has(key),
    [permissionSet],
  )

  const canManageEmployee = useCallback(
    (employeeId: string) => {
      if (dataScope === "all") return true
      if (dataScope === "reports") return directReportIds.includes(employeeId)
      return user?.employeeId === employeeId
    },
    [dataScope, directReportIds, user?.employeeId],
  )

  return {
    user,
    setUser,
    loading,
    login,
    logout,
    hasPermission,
    canManageEmployee,
    permissions,
    dataScope,
  }
}

/** Provider used when MSAL is enabled — calls useMsal() hook */
function MsalAuthProvider({ children }: { children: ReactNode }) {
  const { setUser, ...state } = useAuthState()
  const { instance } = useMsal()

  const loginWithMicrosoft = useCallback(async () => {
    const result = await instance.loginPopup(loginRequest)
    const response = await api.post<LoginResponse>("/auth/microsoft", {
      idToken: result.idToken,
    })
    api.setToken(response.token)
    setUser(response.user)
  }, [instance, setUser])

  return (
    <AuthContext.Provider value={{ ...state, loginWithMicrosoft }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Provider used when MSAL is not configured */
function BasicAuthProvider({ children }: { children: ReactNode }) {
  const { setUser: _, ...state } = useAuthState()

  return (
    <AuthContext.Provider value={{ ...state, loginWithMicrosoft: null }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (msalEnabled) {
    return <MsalAuthProvider>{children}</MsalAuthProvider>
  }
  return <BasicAuthProvider>{children}</BasicAuthProvider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
