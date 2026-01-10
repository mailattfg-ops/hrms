import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEmployee } from "./useEmployee";

export interface LeaveApplication {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  attachment_url: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  current_approver_role: string | null;
  is_lop: boolean;
  lop_days: number;
  created_at: string;
  leave_types?: {
    id: string;
    name: string;
    code: string;
    category: string;
  } | null;
  employees?: {
    id: string;
    employee_id: string;
    profiles: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  entitled_days: number;
  used_days: number;
  carried_forward_days: number;
  adjusted_days: number;
  leave_types?: {
    id: string;
    name: string;
    code: string;
    category: string;
  } | null;
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types-enabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_types")
        .select("*")
        .eq("is_enabled", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useMyLeaveBalances() {
  const { data: employee } = useEmployee();
  const currentYear = new Date().getFullYear();

  return useQuery({
    queryKey: ["my-leave-balances", employee?.id, currentYear],
    queryFn: async (): Promise<LeaveBalance[]> => {
      if (!employee) return [];

      const { data, error } = await supabase
        .from("leave_balances")
        .select(`
          *,
          leave_types (
            id,
            name,
            code,
            category
          )
        `)
        .eq("employee_id", employee.id)
        .eq("year", currentYear);

      if (error) throw error;
      return data as unknown as LeaveBalance[];
    },
    enabled: !!employee,
  });
}

export function useMyLeaveApplications() {
  const { data: employee } = useEmployee();

  return useQuery({
    queryKey: ["my-leave-applications", employee?.id],
    queryFn: async (): Promise<LeaveApplication[]> => {
      if (!employee) return [];

      const { data, error } = await supabase
        .from("leave_applications")
        .select(`
          *,
          leave_types (
            id,
            name,
            code,
            category
          )
        `)
        .eq("employee_id", employee.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as LeaveApplication[];
    },
    enabled: !!employee,
  });
}

export function usePendingApprovals() {
  const { role } = useAuth();
  const { data: employee } = useEmployee();

  return useQuery({
    queryKey: ["pending-approvals", employee?.id, role],
    queryFn: async (): Promise<LeaveApplication[]> => {
      if (!role) return [];

      // For managers, first get their team member IDs
      let teamMemberIds: string[] = [];
      if (role === "manager") {
        if (!employee) return [];
        
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
          *,
          leave_types (
            id,
            name,
            code,
            category
          ),
          employees!leave_applications_employee_id_fkey (
            id,
            employee_id,
            profiles:profiles!employees_user_id_profiles_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      // Filter based on role
      if (role === "manager") {
        // For managers, only show leave requests from their direct reports
        query = query.in("employee_id", teamMemberIds);
      }
      // HR and Admin can see ALL pending leave applications - no filter needed

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as LeaveApplication[];
    },
    // HR and Admin don't need an employee record to view pending approvals
    enabled: !!role && ["manager", "hr", "admin"].includes(role) && (role !== "manager" || !!employee),
  });
}

export function useAllLeaveApplications() {
  return useQuery({
    queryKey: ["all-leave-applications"],
    queryFn: async (): Promise<LeaveApplication[]> => {
      const { data, error } = await supabase
        .from("leave_applications")
        .select(`
          *,
          leave_types (
            id,
            name,
            code,
            category
          ),
          employees!leave_applications_employee_id_fkey (
            id,
            employee_id,
            profiles:profiles!employees_user_id_profiles_fkey (
              first_name,
              last_name
            )
          )
        `)
        .in("status", ["approved", "pending"])
        .gte("end_date", new Date().toISOString().split("T")[0])
        .order("start_date");

      if (error) throw error;
      return data as unknown as LeaveApplication[];
    },
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();
  const { data: employee } = useEmployee();
  const { role } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      leave_type_id: string;
      start_date: string;
      end_date: string;
      days_count: number;
      reason: string;
    }) => {
      if (!employee) throw new Error("Employee not found");

      // All leaves go to reporting manager for approval
      // Managers' own leaves go to HR/Admin
      const currentApproverRole: "admin" | "hr" | "finance" | "manager" | "team_member" = 
        role === "manager" ? "hr" : "manager";

      const { data: application, error } = await supabase
        .from("leave_applications")
        .insert([{
          employee_id: employee.id,
          leave_type_id: data.leave_type_id,
          start_date: data.start_date,
          end_date: data.end_date,
          days_count: data.days_count,
          reason: data.reason,
          status: "pending" as const,
          current_approver_role: currentApproverRole,
        }])
        .select()
        .single();

      if (error) throw error;
      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["all-leave-applications"] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  const { role } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      applicationId, 
      action, 
      remarks 
    }: { 
      applicationId: string; 
      action: "approve" | "reject" | "cancel"; 
      remarks?: string;
    }) => {
      const { data: application, error: fetchError } = await supabase
        .from("leave_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

      if (fetchError) throw fetchError;

      let newStatus: "pending" | "approved" | "cancelled" | "rejected" = "pending";
      let nextApproverRole: "admin" | "hr" | "finance" | "manager" | "team_member" | null = null;
        console.log("action1",action);

      if (action === "reject") {
        newStatus = "rejected";
      } else if (action === "approve") {
        // Manager approval is final - no HR escalation needed
        newStatus = "approved";
        nextApproverRole = null;
      }else if (action === "cancel") {
        console.log("action",action);
        newStatus = "cancelled";
      } 

      const { error } = await supabase
        .from("leave_applications")
        .update({
          status: newStatus,
          current_approver_role: nextApproverRole,
        })
        .eq("id", applicationId);
      console.log("error",error);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["all-leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["team-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["team-stats"] });
      queryClient.invalidateQueries({ queryKey: ["team-member-stats"] });
    },
  });
}
