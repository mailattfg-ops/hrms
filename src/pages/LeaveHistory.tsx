import { useState, useMemo } from "react";
import { format } from "date-fns";
import { History, Clock, CheckCircle, XCircle, AlertCircle, Filter, Download, Users, X, Check, MessageSquare } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLeaveHistory } from "@/hooks/useLeaveHistory";
import { useAuth } from "@/hooks/useAuth";
import { useDepartments } from "@/hooks/useDepartments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LEAVE_STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePendingApprovals, useApproveLeave } from "@/hooks/useLeaves";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  cancelled: AlertCircle,
};

const currentYear = new Date().getFullYear();

export default function LeaveHistory() {
  const { role } = useAuth();
  const { data: departments } = useDepartments();
  const approveLeave = useApproveLeave();
  const { toast } = useToast();
  const status = new URLSearchParams(window.location.search).get("status");
  // Filters
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedStatus, setSelectedStatus] = useState(status || "all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [remarks, setRemarks] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    data,
    isLoading,
    refetch,     // 👈 IMPORTANT
  } = useLeaveHistory(
    {
      year: selectedYear,
      status: selectedStatus,
      departmentId: selectedDepartment,
    },
    page,
    pageSize
  );

  const leaveHistory = data?.data || [];
  const totalPages = Math.ceil((data?.count || 0) / pageSize);



  // Calculate stats
  const stats = useMemo(() => {
    if (!leaveHistory) return { total: 0, approved: 0, rejected: 0, pending: 0, cancelled: 0 };
    
    return {
      total: leaveHistory.length,
      approved: leaveHistory.filter(l => l.status === "approved").length,
      rejected: leaveHistory.filter(l => l.status === "rejected").length,
      pending: leaveHistory.filter(l => l.status === "pending").length,
      cancelled: leaveHistory.filter(l => l.status === "cancelled").length,
    };
  }, [leaveHistory]);

  const isAdminOrHR = role === "admin" || role === "hr";
  const isManager = role === "manager";

  const getEmployeeName = (item: typeof leaveHistory extends (infer T)[] ? T : never) => {
    if (!item.employees?.profiles) return "Unknown";
    return `${item.employees.profiles.first_name} ${item.employees.profiles.last_name}`;
  };

  const handleAction = async () => {
    if (!selectedApplication || !actionType) return;

    try {
      await approveLeave.mutateAsync({
        applicationId: selectedApplication,
        action: actionType,
        remarks,
      });

      toast({
        title: actionType === "approve" ? "Leave approved" : "Leave rejected",
        description: `The leave request has been ${actionType === "approve" ? "approved" : "rejected"}.`,
      });

      // ✅ REFRESH TABLE DATA
      await refetch();

      setSelectedApplication(null);
      setActionType(null);
      setRemarks("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to process leave request",
      });
    }
  };

  const openActionDialog = (applicationId: string, action: "approve" | "reject") => {
    console.log("applicationId",applicationId);
    
    setSelectedApplication(applicationId);
    setActionType(action);
    setRemarks("");
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6" />
              Leave Management
            </h1>
            <p className="text-muted-foreground">
              {isAdminOrHR 
                ? "Complete leave history for all employees" 
                : isManager 
                  ? "Leave history for you and your team members"
                  : "Your complete leave history"}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-success">{stats.approved}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-muted-foreground">{stats.cancelled}</div>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Year</label>
                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isAdminOrHR && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Department</label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leave History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Applications</CardTitle>
            <CardDescription>
              {/* {isAdminOrHR 
                ? "All leave applications across the organization"
                : isManager
                  ? "Leave applications from you and your team"
                  : "Your leave applications history"} */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : !leaveHistory?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No leave applications found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="w-full grid gap-2">
                  {leaveHistory.map((app) => {
                      const StatusIcon = statusIcons[app.status];
                      const statusColor = LEAVE_STATUS_COLORS[app.status];
                      const employeeName = app.employees?.profiles
                        ? `${app.employees.profiles.first_name} ${app.employees.profiles.last_name}`
                        : "Unknown";
                      const initials = app.employees?.profiles
                        ? `${app.employees.profiles.first_name[0]}${app.employees.profiles.last_name[0]}`
                        : "?";
                      return (
                        <div
                          key={app.id}
                          className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <p className="font-medium flex items-center">
                                {employeeName} / &nbsp;
                                <span className="text-sm text-muted-foreground flex gap-2">
                                  {app.employees?.employee_id}
                                </span>
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm text-muted-foreground flex gap-2">
                                  {isAdminOrHR && (
                                    <Badge variant="default">
                                      {app.employees?.departments?.name || "—"}
                                    </Badge>
                                  )}
                                </p>
                                <Badge variant="outline">{app.leave_types?.name}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(app.start_date), "MMM d")} -{" "}
                                  {format(new Date(app.end_date), "MMM d, yyyy")}
                                </span>
                                <Badge variant="secondary">{app.days_count} day(s)</Badge>
                              </div>
                              {app.reason && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                  <MessageSquare className="mr-1 inline h-3 w-3" />
                                  {app.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          

                          <div className="flex gap-2 sm:flex-shrink-0">
                            {(isAdminOrHR || isManager) && app.status.slice(0) === "pending" ? 
                              (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => openActionDialog(app.id, "reject")}
                                  >
                                    <X className="mr-1 h-4 w-4" />
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-success hover:bg-success/90"
                                    onClick={() => openActionDialog(app.id, "approve")}
                                  >
                                    <Check className="mr-1 h-4 w-4" />
                                    Approve
                                  </Button>
                                </>
                              ):(
                                <Badge
                                  variant={statusColor === "muted" ? "secondary" : "default"}
                                  className={cn(
                                    "gap-1",
                                    statusColor === "success" && "bg-success text-success-foreground",
                                    statusColor === "warning" && "bg-warning text-warning-foreground",
                                    statusColor === "destructive" && "bg-destructive text-destructive-foreground"
                                  )}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                </Badge>
                              )
                            }
                          </div>
                        </div>
                      );
                  })}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <span className="text-sm text-muted-foreground px-2 flex items-center">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>

              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Action Confirmation Dialog */}
      <Dialog 
        open={!!selectedApplication && !!actionType} 
        onOpenChange={() => {
          setSelectedApplication(null);
          setActionType(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Are you sure you want to approve this leave request?"
                : "Are you sure you want to reject this leave request?"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks (optional)</label>
              <Textarea
                placeholder="Add any comments or notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedApplication(null);
                setActionType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "reject" ? "destructive" : "default"}
              className={actionType === "approve" ? "bg-success hover:bg-success/90" : ""}
              onClick={handleAction}
              disabled={approveLeave.isPending}
            >
              {approveLeave.isPending
                ? "Processing..."
                : actionType === "approve"
                ? "Approve"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
