import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Leaves from "./pages/Leaves";
import LeaveCalendar from "./pages/LeaveCalendar";
import LeaveHistory from "./pages/LeaveHistory";
import Approvals from "./pages/Approvals";
import Employees from "./pages/Employees";
import EmployeeProfile from "./pages/EmployeeProfile";
import LeavePolicies from "./pages/LeavePolicies";
import Holidays from "./pages/Holidays";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import MyTeam from "./pages/MyTeam";
import NotFound from "./pages/NotFound";
import PayrollDashboard from "./modules/payroll/pages/PayrollDashboard";
import IMSDashboard from "./modules/ims/pages/IMSDashboard";
import TaskDashboard from "./modules/taskManagement/pages/taskDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/calendar" element={<LeaveCalendar />} />
            {/* <Route path="/leave-management" element={<LeaveCalendar />} /> */}
            <Route path="/leave-management" element={<LeaveHistory />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/profile/:employeeId" element={<EmployeeProfile />} />
            <Route path="/policies" element={<LeavePolicies />} />
            <Route path="/holidays" element={<Holidays />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/my-team" element={<MyTeam />} />
            {/* Modules */}
            <Route path="/payroll" element={<PayrollDashboard />} />
            <Route path="/ims" element={<IMSDashboard />} />
            <Route path="/task-management" element={<TaskDashboard />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
