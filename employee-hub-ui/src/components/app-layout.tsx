import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { useLocation } from "react-router-dom"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/my-dashboard": "Dashboard",
  "/my-training": "My Training",
  "/my-rota": "My Rota",
  "/my-leave": "My Leave",
  "/employees": "Employees",
  "/employees/new": "Add Employee",
  "/training-courses": "Training Courses",
  "/training-matrix": "Training Matrix",
  "/supervision-matrix": "Supervision Matrix",
  "/appraisals": "Appraisals",
  "/rotas": "Rotas",
  "/leave": "Leave",
  "/onboarding-items": "Onboarding Items",
  "/employee-statuses": "Employee Statuses",
  "/notifications": "Notifications",
  "/audit-log": "Audit Log",
  "/settings": "Settings",
  "/roles": "Roles",
  "/users": "Users",
  "/change-password": "Change Password",
}

export default function AppLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const pageTitle =
    pageTitles[location.pathname] ??
    (location.pathname.startsWith("/employees/") && location.pathname.endsWith("/edit")
      ? "Edit Employee"
      : location.pathname.startsWith("/employees/")
        ? "Employee Detail"
        : "Page")

  return (
    <SidebarProvider className="h-svh">
      <AppSidebar />
      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 min-h-0 overflow-hidden p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
