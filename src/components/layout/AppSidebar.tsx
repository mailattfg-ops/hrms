import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  CalendarPlus,
  CheckCircle,
  Users,
  FileText,
  Settings,
  BarChart3,
  UsersRound,
  UserCircle,
  History,
  DollarSign,
  Package,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEmployee } from "@/hooks/useEmployee";
import { useIsReportingManager } from "@/hooks/useTeamData";
import { getNavigationItems, APP_NAME } from "@/lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const iconMap = {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  CalendarPlus,
  CheckCircle,
  Users,
  FileText,
  Settings,
  BarChart3,
  UsersRound,
  UserCircle,
  History,
  DollarSign,
  Package,
};

export function AppSidebar() {
  const { role, user } = useAuth();
  const location = useLocation();
  const { data: employee } = useEmployee();
  const { data: isReportingManager } = useIsReportingManager();

  const navItems = role ? getNavigationItems(role) : [];

  // Add "My Team" link for reporting managers (non-admin/HR)
  const showMyTeam = isReportingManager && role && !["admin", "hr"].includes(role);
  
  // Build navigation with My Profile at the top
  const allNavItems = [
    { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
    { label: "My Profile", path: `/profile/${employee?.id || user?.id}`, icon: "UserCircle" },
    { label: "Task", path: "/task-management", icon: "Package" },
    { label: "Payroll", path: "/payroll", icon: "DollarSign" },
    { label: "IMS", path: "/ims", icon: "Package" },
    ...navItems.filter(item => item.path !== "/dashboard"), // exclude dashboard since we added it first
    ...(showMyTeam ? [{ label: "My Team", path: "/my-team", icon: "UsersRound" }] : []),
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">MG</span>
          </div>
          <span className="font-semibold text-sidebar-foreground">{APP_NAME}</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allNavItems.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                const isActive = location.pathname === item.path || 
                  (item.path.startsWith('/profile/') && location.pathname.startsWith('/profile/'));

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.path}>
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
