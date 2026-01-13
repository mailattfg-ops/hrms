import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Shield, UserCheck, Scale, Eye, Calendar, Pencil, Key, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/hooks/useEmployee";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EMPLOYMENT_TYPE_LABELS, ROLE_LABELS, type AppRole } from "@/lib/constants";
import { AddEmployeeDialog } from "@/components/employees/AddEmployeeDialog";
import { ManageRoleDialog } from "@/components/employees/ManageRoleDialog";
import { AssignManagerDialog } from "@/components/employees/AssignManagerDialog";
import { AdjustBalanceDialog } from "@/components/employees/AdjustBalanceDialog";
import { EditEmployeeDialog } from "@/components/employees/EditEmployeeDialog";
import { ResetPasswordDialog } from "@/components/employees/ResetPasswordDialog";
import { DeleteEmployeeDialog } from "@/components/employees/DeleteEmployeeDialog";

export default function Employees() {
  const { role: currentUserRole } = useAuth();
  const { data: employees, isLoading } = useEmployees();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [roleDialogEmployee, setRoleDialogEmployee] = useState<typeof employees extends (infer T)[] | undefined ? T | null : never>(null);
  const [managerDialogEmployee, setManagerDialogEmployee] = useState<typeof employees extends (infer T)[] | undefined ? T | null : never>(null);
  const [balanceDialogEmployee, setBalanceDialogEmployee] = useState<typeof employees extends (infer T)[] | undefined ? T | null : never>(null);
  const [editDialogEmployee, setEditDialogEmployee] = useState<typeof employees extends (infer T)[] | undefined ? T | null : never>(null);
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState<{ name: string; email: string } | null>(null);
  const [deleteDialogEmployee, setDeleteDialogEmployee] = useState<typeof employees extends (infer T)[] | undefined ? T | null : never>(null);

  // Fetch all user roles
  const { data: allUserRoles } = useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      return data;
    },
  });

  // Create a map of user_id to their primary role
  const userRoleMap = new Map<string, AppRole>();
  allUserRoles?.forEach((ur) => {
    const existing = userRoleMap.get(ur.user_id);
    const order = ["admin", "hr", "finance", "manager", "team_member"];
    if (!existing || order.indexOf(ur.role) < order.indexOf(existing)) {
      userRoleMap.set(ur.user_id, ur.role as AppRole);
    }
  });

  // Create a map of employee_id to employee for manager lookup
  const employeeMap = new Map<string, typeof employees extends (infer T)[] | undefined ? T : never>();
  employees?.forEach((emp) => {
    employeeMap.set(emp.id, emp);
  });

  const filteredEmployees = employees?.filter((emp) => {
    const searchLower = search.toLowerCase();
    const fullName = `${emp.profiles?.first_name} ${emp.profiles?.last_name}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      emp.employee_id.toLowerCase().includes(searchLower) ||
      emp.profiles?.email?.toLowerCase().includes(searchLower) ||
      emp.departments?.name?.toLowerCase().includes(searchLower)
    );
  });

  const canManageRoles = currentUserRole === "admin" || currentUserRole === "hr";

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Employees</h1>
            <p className="text-muted-foreground">Manage your organization's employees</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Employee Directory</CardTitle>
                <CardDescription>
                  {filteredEmployees?.length || 0} employees found
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : !filteredEmployees?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No employees found</p>
                <p className="text-sm text-muted-foreground">
                  {search ? "Try a different search term" : "Add your first employee to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Reporting Manager</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => {
                      const fullName = employee.profiles
                        ? `${employee.profiles.first_name} ${employee.profiles.last_name}`
                        : "Unknown";
                      const initials = employee.profiles
                        ? `${employee.profiles.first_name[0]}${employee.profiles.last_name[0]}`
                        : "?";
                      const userRole = employee.user_id ? userRoleMap.get(employee.user_id) : undefined;

                      // Get reporting manager info
                      const manager = employee.reporting_manager_id
                        ? employeeMap.get(employee.reporting_manager_id)
                        : null;
                      const managerName = manager?.profiles
                        ? `${manager.profiles.first_name} ${manager.profiles.last_name}`
                        : null;

                      return (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <Link
                              to={`/profile/${employee.id}`}
                              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={employee.profiles?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium hover:underline">{fullName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {employee.profiles?.email}
                                </p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm">{employee.employee_id}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {employee.departments?.name || "Unassigned"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {userRole ? (
                              <Badge
                                variant={userRole === "admin" ? "default" : "outline"}
                                className={
                                  userRole === "admin"
                                    ? "bg-primary"
                                    : userRole === "hr"
                                    ? "border-blue-500 text-blue-600"
                                    : userRole === "manager"
                                    ? "border-green-500 text-green-600"
                                    : ""
                                }
                              >
                                {ROLE_LABELS[userRole]}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {managerName ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="bg-muted text-xs">
                                        {manager?.profiles?.first_name?.[0]}
                                        {manager?.profiles?.last_name?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{managerName}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Employee ID: {manager?.employee_id}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-sm text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {EMPLOYMENT_TYPE_LABELS[employee.employment_type]}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/profile/${employee.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  View Leaves
                                </DropdownMenuItem>
                                {canManageRoles && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setEditDialogEmployee(employee)}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setRoleDialogEmployee(employee)}
                                    >
                                      <Shield className="mr-2 h-4 w-4" />
                                      Manage Role
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setManagerDialogEmployee(employee)}
                                    >
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Assign Manager
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setBalanceDialogEmployee(employee)}
                                    >
                                      <Scale className="mr-2 h-4 w-4" />
                                      Adjust Balance
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setResetPasswordEmployee({
                                        name: fullName,
                                        email: employee.profiles?.email || "",
                                      })}
                                    >
                                      <Key className="mr-2 h-4 w-4" />
                                      Reset Password
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setDeleteDialogEmployee(employee)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Employee
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddEmployeeDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <ManageRoleDialog
        open={!!roleDialogEmployee}
        onOpenChange={(open) => !open && setRoleDialogEmployee(null)}
        employee={roleDialogEmployee}
      />
      <AssignManagerDialog
        open={!!managerDialogEmployee}
        onOpenChange={(open) => !open && setManagerDialogEmployee(null)}
        employee={managerDialogEmployee}
      />
      <AdjustBalanceDialog
        open={!!balanceDialogEmployee}
        onOpenChange={(open) => !open && setBalanceDialogEmployee(null)}
        employee={balanceDialogEmployee}
      />
      <EditEmployeeDialog
        open={!!editDialogEmployee}
        onOpenChange={(open) => !open && setEditDialogEmployee(null)}
        employee={editDialogEmployee}
      />
      <ResetPasswordDialog
        open={!!resetPasswordEmployee}
        onOpenChange={(open) => !open && setResetPasswordEmployee(null)}
        employeeName={resetPasswordEmployee?.name || ""}
        employeeEmail={resetPasswordEmployee?.email || ""}
      />
      <DeleteEmployeeDialog
        open={!!deleteDialogEmployee}
        onOpenChange={(open) => !open && setDeleteDialogEmployee(null)}
        employee={deleteDialogEmployee}
      />
    </AppLayout>
  );
}
