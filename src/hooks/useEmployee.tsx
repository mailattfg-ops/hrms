import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Employee {
  id: string;
  user_id: string | null;
  employee_id: string;
  department_id: string | null;
  reporting_manager_id: string | null;
  employment_type: "full_time" | "part_time" | "contract";
  gender: "male" | "female" | "other" | null;
  date_of_joining: string;
  probation_end_date: string | null;
  work_location: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // New profile fields
  designation: string | null;
  personal_email: string | null;
  linkedin_url: string | null;
  blood_group: string | null;
  current_address: string | null;
  permanent_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  work_mode: string | null;
  about_me: string | null;
  created_by: string | null;
  last_modified_by: string | null;
  // Policy acknowledgements
  leave_policy_acknowledged_at: string | null;
  handbook_acknowledged_at: string | null;
  posh_policy_acknowledged_at: string | null;
  cpp_acknowledged_at: string | null;
  // Relationships
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  departments?: {
    id: string;
    name: string;
  } | null;
  reporting_manager?: {
    id: string;
    employee_id: string;
    profiles: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

export function useEmployee() {
  const { user,role } = useAuth();
  // if (role !== "admin" ) {return null;}
  return useQuery({
    queryKey: ["employee", user?.id],
    queryFn: async (): Promise<Employee | null> => {
      if (!user) return null;

      // First get the employee data without self-referencing join
      const { data: employeeData, error } = await supabase
        .from("employees")
        .select(`
          *,
          profiles!employees_user_id_profiles_fkey (
            first_name,
            last_name,
            email,
            phone,
            avatar_url
          ),
          departments (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .single();

      if (error && role !== "admin") {
        console.error("Error fetching employee:", error);
        return null;
      }

      // If there's a reporting manager, fetch their details separately
      let reporting_manager = null;
      if (employeeData?.reporting_manager_id) {
        const { data: managerData } = await supabase
          .from("employees")
          .select(`
            id,
            employee_id,
            profiles!employees_user_id_profiles_fkey (
              first_name,
              last_name
            )
          `)
          .eq("id", employeeData.reporting_manager_id)
          .single();
        
        reporting_manager = managerData;
      }

      return { ...employeeData, reporting_manager } as unknown as Employee;
    },
    enabled: !!user,
  });
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async (): Promise<Employee[]> => {
      // First get all employees without self-referencing join
      const { data: employeesData, error } = await supabase
        .from("employees")
        .select(`
          *,
          profiles!employees_user_id_profiles_fkey (
            first_name,
            last_name,
            email,
            phone,
            avatar_url
          ),
          departments (
            id,
            name
          )
        `)
        .eq("is_active", true)
        .order("employee_id");

      if (error) {
        console.error("Error fetching employees:", error);
        return [];
      }

      if (!employeesData || employeesData.length === 0) {
        return [];
      }

      // Get all unique reporting manager IDs
      const managerIds = [...new Set(
        employeesData
          .filter(e => e.reporting_manager_id)
          .map(e => e.reporting_manager_id)
      )] as string[];

      // Fetch all managers in one query
      let managersMap: Record<string, any> = {};
      if (managerIds.length > 0) {
        const { data: managersData } = await supabase
          .from("employees")
          .select(`
            id,
            employee_id,
            profiles!employees_user_id_profiles_fkey (
              first_name,
              last_name
            )
          `)
          .in("id", managerIds);

        if (managersData) {
          managersMap = managersData.reduce((acc, manager) => {
            acc[manager.id] = manager;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combine employees with their reporting managers
      const employeesWithManagers = employeesData.map(emp => ({
        ...emp,
        reporting_manager: emp.reporting_manager_id 
          ? managersMap[emp.reporting_manager_id] || null 
          : null
      }));

      return employeesWithManagers as unknown as Employee[];
    },
  });
}
