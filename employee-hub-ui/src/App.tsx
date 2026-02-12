import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/contexts/auth-context"
import AppLayout from "@/components/app-layout"
import DefaultRedirect from "@/components/default-redirect"
import LoginPage from "@/pages/login"
import DashboardPage from "@/pages/dashboard"
import EmployeesPage from "@/pages/employees"
import TrainingCoursesPage from "@/pages/training-courses"
import OnboardingItemsPage from "@/pages/onboarding-items"

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
import DayInLifePage from "@/pages/day-in-life"
import ReportIssuePage from "@/pages/report-issue"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
              {/* Tools */}
              <Route path="/day-in-life" element={<DayInLifePage />} />
              <Route path="/report-issue" element={<ReportIssuePage />} />
              {/* Administration pages */}
              <Route path="/onboarding-items" element={<OnboardingItemsPage />} />
              <Route path="/employee-statuses" element={<EmployeeStatusesPage />} />
              <Route path="/audit-log" element={<AuditLogPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/roles" element={<RolesPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
