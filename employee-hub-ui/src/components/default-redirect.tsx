import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"

export default function DefaultRedirect() {
  const { user } = useAuth()

  if (user?.employeeId) {
    return <Navigate to="/my-dashboard" replace />
  }

  return <Navigate to="/dashboard" replace />
}
