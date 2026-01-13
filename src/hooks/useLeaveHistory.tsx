import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEmployee } from "./useEmployee";

export interface LeaveHistoryItem {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  is_lop: boolean;
  lop_days: number | null;
  created_at: string;
  updated_at: string;
  leave_types: {
    id: string;
    name: string;
    code: string;
  } | null;
  employees: {
    id: string;
    employee_id: string;
    department_id: string | null;
    departments: {
      id: string;
      name: string;
    } | null;
    profiles: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

export function useLeaveHistory(
  filters?: {
    year?: number;
    status?: any;
    departmentId?: string;
    employeeId?: string;
  },
  page: number = 1,
  pageSize: number = 10
) {

  const { role } = useAuth();
  const { data: employee } = useEmployee();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ["leave-history", role, employee?.id, filters, page, pageSize],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: [], count: 0 };

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      const currentRole = userRole?.role;

      let query = supabase
        .from("leave_applications")
        .select(
          `
          id,
          employee_id,
          leave_type_id,
          start_date,
          end_date,
          days_count,
          reason,
          status,
          is_lop,
          lop_days,
          created_at,
          leave_types (
            id,
            name,
            code
          ),
          employees (
            id,
            employee_id,
            department_id,
            departments (id, name),
            profiles (
              first_name,
              last_name
            )
          )
        `,
          { count: "exact" } // 🔥 IMPORTANT
        )
        .order("created_at", { ascending: false });

      /* ---------- role filters (unchanged) ---------- */
      if (currentRole === "manager") {
        if (!employee) return { data: [], count: 0 };

        const { data: team } = await supabase
          .from("employees")
          .select("id")
          .eq("reporting_manager_id", employee.id)
          .eq("is_active", true);

        const ids = [...(team?.map(e => e.id) || [])];
        query = query.in("employee_id", ids);
      } else if (currentRole !== "admin" && currentRole !== "hr") {
        if (!employee) return { data: [], count: 0 };
        query = query.eq("employee_id", employee.id);
      }else if (currentRole === "hr") {
        if (!employee) return { data: [], count: 0 };
        query = query.neq("employee_id", employee.id);
      }

      /* ---------- optional filters ---------- */
      if (filters?.year) {
        query = query
          .gte("start_date", `${filters.year}-01-01`)
          .lte("start_date", `${filters.year}-12-31`);
      }

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.departmentId && filters.departmentId !== "all") {
        const { data: deptEmployees } = await supabase
          .from("employees")
          .select("id")
          .eq("department_id", filters.departmentId);

        query = query.in(
          "employee_id",
          deptEmployees?.map(e => e.id) || []
        );
      }

      if (filters?.employeeId && filters.employeeId !== "all") {
        query = query.eq("employee_id", filters.employeeId);
      }

      /* ---------- pagination ---------- */
      const { data, count, error } = await query.range(from, to);

      if (error) throw error;

      return {
        data: data as LeaveHistoryItem[],
        count: count || 0,
      };
    },
    enabled: !!role,
    // keepPreviousData: true, // 🔥 smooth page switch
  });

}
