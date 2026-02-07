import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MsalProvider } from "@azure/msal-react"
import { PublicClientApplication } from "@azure/msal-browser"
import { AuthProvider } from "@/contexts/auth-context"
import { msalConfig, msalEnabled } from "@/lib/msal-config"
import AppLayout from "@/components/app-layout"
import DefaultRedirect from "@/components/default-redirect"
import LoginPage from "@/pages/login"
import DashboardPage from "@/pages/dashboard"
import EmployeesPage from "@/pages/employees"
import TrainingCoursesPage from "@/pages/training-courses"
import OnboardingItemsPage from "@/pages/onboarding-items"
import NotificationsPage from "@/pages/notifications"
import EmployeeDetailPage from "@/pages/employee-detail"
import EmployeeFormPage from "@/pages/employee-form"
import EmployeeStatusesPage from "@/pages/employee-statuses"
import TrainingMatrixPage from "@/pages/training-matrix"
import SupervisionMatrixPage from "@/pages/supervision-matrix"
import AppraisalsPage from "@/pages/appraisals"
import AuditLogPage from "@/pages/audit-log"
import SettingsPage from "@/pages/settings"
import ChangePasswordPage from "@/pages/change-password"
import RotasPage from "@/pages/rotas"
import LeavePage from "@/pages/leave"
import RolesPage from "@/pages/roles"
import UsersPage from "@/pages/users"
import MyDashboardPage from "@/pages/my-dashboard"
import MyTrainingPage from "@/pages/my-training"
import MyRotaPage from "@/pages/my-rota"
import MyLeavePage from "@/pages/my-leave"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

const msalInstance = msalEnabled
  ? new PublicClientApplication(msalConfig)
  : null

function AppContent() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<DefaultRedirect />} />
          {/* Personal pages */}
          <Route path="/my-dashboard" element={<MyDashboardPage />} />
          <Route path="/my-training" element={<MyTrainingPage />} />
          <Route path="/my-rota" element={<MyRotaPage />} />
          <Route path="/my-leave" element={<MyLeavePage />} />
          {/* Management pages */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/new" element={<EmployeeFormPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
          <Route path="/training-courses" element={<TrainingCoursesPage />} />
          <Route path="/training-matrix" element={<TrainingMatrixPage />} />
          <Route path="/supervision-matrix" element={<SupervisionMatrixPage />} />
          <Route path="/appraisals" element={<AppraisalsPage />} />
          <Route path="/rotas" element={<RotasPage />} />
          <Route path="/leave" element={<LeavePage />} />
          {/* Administration pages */}
          <Route path="/onboarding-items" element={<OnboardingItemsPage />} />
          <Route path="/employee-statuses" element={<EmployeeStatusesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/audit-log" element={<AuditLogPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {msalInstance ? (
          <MsalProvider instance={msalInstance}>
            <AppContent />
          </MsalProvider>
        ) : (
          <AppContent />
        )}
      </BrowserRouter>
    </QueryClientProvider>
  )
}
