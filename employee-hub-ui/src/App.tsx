import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/contexts/auth-context"
import AppLayout from "@/components/app-layout"
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
import AuditLogPage from "@/pages/audit-log"
import ChangePasswordPage from "@/pages/change-password"

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
              <Route path="/" element={<DashboardPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/new" element={<EmployeeFormPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
              <Route path="/training-courses" element={<TrainingCoursesPage />} />
              <Route path="/training-matrix" element={<TrainingMatrixPage />} />
              <Route path="/onboarding-items" element={<OnboardingItemsPage />} />
              <Route path="/employee-statuses" element={<EmployeeStatusesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/audit-log" element={<AuditLogPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
