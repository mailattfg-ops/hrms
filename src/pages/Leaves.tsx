import { useState } from "react";
import { format } from "date-fns";
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle, ShieldAlert, X } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useMyLeaveApplications, useMyLeaveBalances, useLeaveTypes } from "@/hooks/useLeaves";
import { useAuth } from "@/hooks/useAuth";
import { useEmployee } from "@/hooks/useEmployee";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApplyLeaveDialog } from "@/components/leaves/ApplyLeaveDialog";
import { LEAVE_STATUS_COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { usePendingApprovals, useApproveLeave } from "@/hooks/useLeaves";
import { Textarea } from "@/components/ui/textarea";


const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  cancelled: AlertCircle,
};

export default function Leaves() {
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const { role } = useAuth();
  const { toast } = useToast();
  const { data: employee } = useEmployee();
  const { data: applications, isLoading: applicationsLoading } = useMyLeaveApplications();
  const { data: balances, isLoading: balancesLoading } = useMyLeaveBalances();
  const { data: leaveTypes } = useLeaveTypes();
  
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "cancel" | null>(null);
  const [remarks, setRemarks] = useState("");
  const approveLeave = useApproveLeave();

  const employeeGender = employee?.gender;

  // Check if leave type is applicable based on gender
  const isLeaveTypeApplicable = (genderSpecific: string | null) => {
    if (!genderSpecific) return true; // No restriction
    if (!employeeGender) return true; // If gender not set, show all
    return genderSpecific === employeeGender;
  };

  // Merge balances with leave types for display
  const balanceDisplay = leaveTypes?.map((lt) => {
    const balance = balances?.find((b) => b.leave_type_id === lt.id);
    const available = balance 
      ? balance.entitled_days + balance.carried_forward_days + balance.adjusted_days - balance.used_days
      : lt.entitlement_days;
    const total = balance 
      ? balance.entitled_days + balance.carried_forward_days + balance.adjusted_days
      : lt.entitlement_days;
    const isApplicable = isLeaveTypeApplicable(lt.gender_specific);
    return {
      ...lt,
      available,
      total,
      used: balance?.used_days || 0,
      isApplicable,
    };
  }).filter(lt => lt.entitlement_days > 0 || lt.available > 0);

  // If Admin/HR, show a message redirecting to dashboard
  if (role === "admin") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
          <ShieldAlert className="mb-6 h-16 w-16 text-muted-foreground/50" />
          <h1 className="text-2xl font-bold mb-2">Admin/HR Dashboard View</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            As an Admin or HR user, you manage organization-wide leave data. 
            Please use the Dashboard to view leave statistics and manage employee requests.
          </p>
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleAction = async () => {
    if (!selectedApplication || !actionType) return;

    try {
      await approveLeave.mutateAsync({
        applicationId: selectedApplication,
        action: 'cancel',
        remarks,
      });

      toast({
        title: actionType === "approve" ? "Leave approved" : "Leave rejected",
        description: `The leave request has been ${actionType === "approve" ? "approved" : "rejected"}.`,
      });

      // ✅ REFRESH TABLE DATA
      // await refetch();

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
    setSelectedApplication(applicationId);
    setActionType(action);
    setRemarks("");
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Leaves</h1>
            <p className="text-muted-foreground">View your leave balances and applications</p>
          </div>
          <Button onClick={() => setIsApplyDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Apply for Leave
          </Button>
        </div>

        {/* Leave Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Balances</CardTitle>
            <CardDescription>Your available leave days for {new Date().getFullYear()}</CardDescription>
          </CardHeader>
          <CardContent>
            {balancesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {balanceDisplay?.map((leave) => (
                  <div
                    key={leave.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-4",
                      !leave.isApplicable && "opacity-50 cursor-not-allowed bg-muted/30"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={cn("font-medium", !leave.isApplicable && "text-muted-foreground")}>
                          {leave.name}
                        </p>
                        {!leave.isApplicable && (
                          <Badge variant="outline" className="text-xs">
                            Not Applicable
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{leave.code}</p>
                    </div>
                    <div className="text-right">
                      {leave.isApplicable ? (
                        <>
                          <p className="text-lg font-bold">{leave.available}</p>
                          <p className="text-xs text-muted-foreground">of {leave.total} days</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">N/A</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
            <CardDescription>Your leave applications and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : !applications?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">No leave applications yet</p>
                <p className="text-sm text-muted-foreground">
                  Click "Apply for Leave" to submit your first request
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied On</TableHead>
                      {/* <TableHead>Actions</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => {
                      const StatusIcon = statusIcons[app.status];
                      const statusColor = LEAVE_STATUS_COLORS[app.status];

                      return (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{app.leave_types?.name}</p>
                              <code className="text-xs text-muted-foreground">
                                {app.leave_types?.code}
                              </code>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(app.start_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(new Date(app.end_date), "MMM d, yyyy")}</TableCell>
                          <TableCell>{app.days_count}</TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(app.created_at), "MMM d, yyyy")}
                          </TableCell>
                          {app.status.slice(0) === "pending" && (
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => openActionDialog(app.id, "reject")}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Cancel
                              </Button>
                            </TableCell>
                          )}
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

      <ApplyLeaveDialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen} />
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
              Cancel Leave Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to Cancel this leave request
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
              className={actionType === "cancel" ? "bg-success hover:bg-success/90" : ""}
              onClick={handleAction}
              disabled={approveLeave.isPending}
            >
              Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
