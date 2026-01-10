import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEmployee } from "./useEmployee";

export interface DashboardLeaveBalance {
  id: string;
  name: string;
  code: string;
  available: number;
  total: number;
}

export interface RecentLeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
}

export interface PendingApproval {
  id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  created_at: string;
}

export function useDashboardStats() {
  const { data: employee } = useEmployee();
  const currentYear = new Date().getFullYear();

  return useQuery({
    queryKey: ["dashboard-stats", employee?.id, currentYear],
    queryFn: async () => {
      if (!employee) return null;

      // Fetch leave balances
      const { data: balances, error: balancesError } = await supabase
        .from("leave_balances")
        .select(`
          *,
          leave_types (
            id,
            name,
            code
          )
        `)
        .eq("employee_id", employee.id)
        .eq("year", currentYear);

      if (balancesError) throw balancesError;

      // Calculate totals from balances
      const totalAvailable = balances?.reduce((sum, b) => {
        const available = Number(b.entitled_days) + Number(b.carried_forward_days) + Number(b.adjusted_days) - Number(b.used_days);
        return sum + Math.max(0, available);
      }, 0) || 0;

      const totalUsed = balances?.reduce((sum, b) => sum + Number(b.used_days), 0) || 0;

      // Count pending requests
      const { count: pendingCount, error: pendingError } = await supabase
        .from("leave_applications")
        .select("*", { count: "exact", head: true })
        .eq("employee_id", employee.id)
        .eq("status", "pending");

      if (pendingError) throw pendingError;

      // Count LOP days
      const { data: lopData, error: lopError } = await supabase
        .from("leave_applications")
        .select("lop_days")
        .eq("employee_id", employee.id)
        .eq("status", "approved")
        .eq("is_lop", true)
        .gte("start_date", `${currentYear}-01-01`)
        .lte("end_date", `${currentYear}-12-31`);

      if (lopError) throw lopError;

      const totalLopDays = lopData?.reduce((sum, app) => sum + (Number(app.lop_days) || 0), 0) || 0;

      // Transform balances for display
      const leaveBalances: DashboardLeaveBalance[] = (balances || []).map(b => ({
        id: b.id,
        name: b.leave_types?.name || "Unknown",
        code: b.leave_types?.code || "??",
        available: Math.max(0, Number(b.entitled_days) + Number(b.carried_forward_days) + Number(b.adjusted_days) - Number(b.used_days)),
        total: Number(b.entitled_days) + Number(b.carried_forward_days) + Number(b.adjusted_days),
      }));

      return {
        totalAvailable: Math.round(totalAvailable),
        pendingRequests: pendingCount || 0,
        usedThisYear: Math.round(totalUsed),
        lopDays: Math.round(totalLopDays),
        leaveBalances,
      };
    },
    enabled: !!employee,
  });
}

export function useRecentLeaveRequests(limit: number = 5) {
  const { data: employee } = useEmployee();

  return useQuery({
    queryKey: ["recent-leave-requests", employee?.id, limit],
    queryFn: async (): Promise<RecentLeaveRequest[]> => {
      if (!employee) return [];

      const { data, error } = await supabase
        .from("leave_applications")
        .select(`
          id,
          start_date,
          end_date,
          days_count,
          status,
          created_at,
          leave_types (
            name
          )
        `)
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(app => ({
        id: app.id,
        leave_type: (app.leave_types as { name: string } | null)?.name || "Unknown",
        start_date: app.start_date,
        end_date: app.end_date,
        days_count: Number(app.days_count),
        status: app.status as RecentLeaveRequest["status"],
        created_at: app.created_at,
      }));
    },
    enabled: !!employee,
  });
}

export function useDashboardPendingApprovals(limit: number = 5) {
  const { role } = useAuth();
  const { data: employee } = useEmployee();

  return useQuery({
    queryKey: ["dashboard-pending-approvals", employee?.id, role, limit],
    queryFn: async (): Promise<PendingApproval[]> => {
      if ((!employee && role !== "admin") || !role) return [];

      // For managers, first get their team member IDs
      let teamMemberIds: string[] = [];
      if (role === "manager") {
        const { data: teamMembers, error: teamError } = await supabase
          .from("employees")
          .select("id")
          .eq("reporting_manager_id", employee.id)
          .eq("is_active", true);

        if (teamError) throw teamError;
        teamMemberIds = (teamMembers || []).map(e => e.id);

        // If no team members, return empty
        if (teamMemberIds.length === 0) return [];
      }

      let query = supabase
        .from("leave_applications")
        .select(`
          id,
          start_date,
          end_date,
          days_count,
          created_at,
          current_approver_role,
          employee_id,
          leave_types (
            name
          ),
          employees!leave_applications_employee_id_fkey (
            id,
            user_id
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(limit);

      console.log("hr or admin test",role);

      // Filter based on role
      if (role === "manager") {
         if (!employee) return []; // Explicitly handle missing employee for manager
         
        // For managers, only show leave requests from their direct reports
        query = query.in("employee_id", teamMemberIds);
      } else if (role === "hr") {
        query = query.in("current_approver_role", ["manager"]);
      }else if (role === "admin") {
        query = query.in("current_approver_role", ["hr", "manager"]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles separately for the employee user_ids
      const userIds = (data || [])
        .map(app => (app.employees as { user_id: string | null } | null)?.user_id)
        .filter((id): id is string => !!id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(app => {
        const employees = app.employees as { user_id: string | null } | null;
        const leaveTypes = app.leave_types as { name: string } | null;
        const profile = employees?.user_id ? profileMap.get(employees.user_id) : null;
        
        return {
          id: app.id,
          employee_name: profile 
            ? `${profile.first_name} ${profile.last_name}`
            : "Unknown",
          leave_type: leaveTypes?.name || "Unknown",
          start_date: app.start_date,
          end_date: app.end_date,
          days_count: Number(app.days_count),
          created_at: app.created_at,
        };
      });
    },
    enabled: (!!employee || role === "admin") && !!role && ["manager", "hr", "admin"].includes(role),
  });
}
