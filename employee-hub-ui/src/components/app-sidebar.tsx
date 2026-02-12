import {
  BookOpen,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Home,
  Users,
  FileText,
  Grid3X3,
  Tag,
  UserCheck,
  Settings,
  Shield,
  UserCog,
  LayoutDashboard,
  MessageSquare,
  Bug,
  type LucideIcon,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  permission?: string
}

const homeNav: NavItem[] = [
  { title: "Dashboard", url: "/my-dashboard", icon: Home },
  { title: "My Training", url: "/my-training", icon: Grid3X3 },
  { title: "My Rota", url: "/my-rota", icon: Calendar },
  { title: "My Leave", url: "/my-leave", icon: CalendarDays },
]

const managementNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { title: "Employees", url: "/employees", icon: Users, permission: "employees.view" },
  { title: "Training Matrix", url: "/training-matrix", icon: Grid3X3, permission: "training_matrix.view" },
  { title: "Supervision", url: "/supervision-matrix", icon: UserCheck, permission: "supervisions.view" },
  { title: "Appraisals", url: "/appraisals", icon: ClipboardList, permission: "appraisals.view" },
  { title: "Rotas", url: "/rotas", icon: Calendar, permission: "rotas.view" },
  { title: "Leave", url: "/leave", icon: CalendarDays, permission: "leave.view" },
]

const toolsNav: NavItem[] = [
  { title: "Day in the Life", url: "/day-in-life", icon: MessageSquare, permission: "day_in_life.use" },
  { title: "Report Issue", url: "/report-issue", icon: Bug },
]

const adminNav: NavItem[] = [
  { title: "Training Courses", url: "/training-courses", icon: BookOpen, permission: "training_courses.view" },
  { title: "Onboarding Items", url: "/onboarding-items", icon: ClipboardCheck, permission: "onboarding.view" },
  { title: "Employee Statuses", url: "/employee-statuses", icon: Tag, permission: "employee_statuses.manage" },
  { title: "Audit Log", url: "/audit-log", icon: FileText, permission: "audit_log.view" },
  { title: "Roles", url: "/roles", icon: Shield, permission: "users.manage" },
  { title: "Users", url: "/users", icon: UserCog, permission: "users.manage" },
  { title: "Settings", url: "/settings", icon: Settings, permission: "settings.manage" },
]

export function AppSidebar() {
  const { user, logout, hasPermission } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const initials = user?.displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "?"

  const hasEmployeeId = !!user?.employeeId

  const visibleManagementNav = managementNav.filter(
    (item) => !item.permission || hasPermission(item.permission),
  )

  const visibleToolsNav = toolsNav.filter(
    (item) => !item.permission || hasPermission(item.permission),
  )

  const visibleAdminNav = adminNav.filter(
    (item) => !item.permission || hasPermission(item.permission),
  )

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Ilea Palm" className="h-8 w-auto" />
          <span className="font-semibold text-sm text-sidebar-foreground">
            Employee Hub
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {hasEmployeeId && (
          <SidebarGroup>
            <SidebarGroupLabel>Home</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {homeNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.url}
                      onClick={() => navigate(item.url)}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleManagementNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleManagementNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.url}
                      onClick={() => navigate(item.url)}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleToolsNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleToolsNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.url}
                      onClick={() => navigate(item.url)}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleAdminNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.url}
                      onClick={() => navigate(item.url)}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left text-xs leading-tight">
                    <span className="font-medium">{user?.displayName}</span>
                    <span className="text-sidebar-foreground/60">
                      {user?.roleName}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/change-password")}>
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
