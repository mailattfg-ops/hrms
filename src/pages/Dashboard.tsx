import { Calendar, Clock, CheckCircle, AlertCircle, ArrowRight, Users, FileText, BarChart3, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEmployee } from "@/hooks/useEmployee";
import { useDashboardStats, useRecentLeaveRequests, useDashboardPendingApprovals } from "@/hooks/useDashboardData";
import { useOrganizationStats, useAllRecentLeaveRequests, useDepartmentLeaveOverview } from "@/hooks/useOrganizationDashboardData";
import { useIsReportingManager, useTeamMembers, useTeamStats, useTeamLeaveRequests } from "@/hooks/useTeamData";
import { useApproveLeave } from "@/hooks/useLeaves";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { useActiveAnnouncementBanners } from "@/hooks/useAnnouncementBanners";
import { cn } from "@/lib/utils";
import { Megaphone } from "lucide-react";

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-12 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "approved":
      return "default";
    case "pending":
      return "secondary";
    case "rejected":
      return "destructive";
    case "cancelled":
      return "outline";
    default:
      return "secondary";
  }
}

export default function Dashboard() {
  const { role } = useAuth();
  const { data: employee, isLoading: employeeLoading } = useEmployee();
  const { data: banners } = useActiveAnnouncementBanners();
  
  const isAdminOrHR = role === "admin" || role === "hr";
  
  // Personal stats (for non-admin/HR users)
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentRequests, isLoading: requestsLoading } = useRecentLeaveRequests(5);
  
  // Organization-wide stats (for admin/HR users)
  const { data: orgStats, isLoading: orgStatsLoading } = useOrganizationStats();
  const { data: allRecentRequests, isLoading: allRequestsLoading } = useAllRecentLeaveRequests(10);
  const { data: departmentOverview, isLoading: deptLoading } = useDepartmentLeaveOverview();
  const { data: pendingApprovals, isLoading: approvalsLoading } = useDashboardPendingApprovals(5);

  // Team data (for reporting managers)
  const { data: isReportingManager, isLoading: isManagerLoading } = useIsReportingManager();
  const { data: teamMembers, isLoading: teamMembersLoading } = useTeamMembers();
  const { data: teamStats, isLoading: teamStatsLoading } = useTeamStats();
  const { data: teamLeaveRequests, isLoading: teamLeavesLoading } = useTeamLeaveRequests("pending");
  const approveLeave = useApproveLeave();

  const displayName = employee?.profiles
    ? `${employee.profiles.first_name}`
    : "there";

  // Show team section for non-admin/HR users who have direct reports
  const showTeamSection = !isAdminOrHR && isReportingManager;

  const isStatsLoading = employeeLoading || (isAdminOrHR ? orgStatsLoading : statsLoading);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {displayName}!</h1>
          <p className="text-muted-foreground">
            {isAdminOrHR 
              ? "Here's an overview of your organization's leave status."
              : "Here's an overview of your leave status and pending actions."
            }
          </p>
        </div>
        {banners?.length > 0 && (
          <div className="w-full py-6 p-0">
            <Carousel
              className="w-full mx-0 group overflow-hidden rounded-2xl"
              opts={{
                loop: true,
                align: "start",
                duration: 30,
              }}
              plugins={[
                Autoplay({
                  delay: 6000,
                  stopOnInteraction: false,
                }),
              ]}
            >
              <CarouselContent className="h-20 md:h-24">
                {banners.map((banner, index) => (
                  <CarouselItem key={index} className="h-full">
                    <div
                      className={cn(
                        "relative h-full w-full flex items-center px-6 md:px-12 overflow-hidden transition-all duration-500 rounded-2xl border ",
                        banner.color === "yellow"
                          ? "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-200 via-yellow-150 to-orange-200 text-amber-900"
                          : "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-500 via-red-700 to-rose-700 text-white"
                      )}
                    >
                      {/* Subtle Decorative "Glass" Overlay */}
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                      
                      {/* Animated Light Sweep Effect */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

                      <div className="relative z-10 flex items-center w-full gap-4 md:gap-6">
                        {/* Announcement Icon with Pulse */}
                        <div className="flex-shrink-0 relative">
                          <div className={cn(
                            "absolute inset-0 rounded-full animate-ping opacity-20",
                            banner.color === "yellow" ? "bg-amber-400" : "bg-white"
                          )} />
                          <div className={cn(
                            "relative p-2.5 rounded-xl backdrop-blur-md border",
                            banner.color === "yellow" ? "bg-amber-200/50 border-amber-300" : "bg-white/10 border-white/20"
                          )}>
                            <Megaphone className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow">
                          <span
                            dangerouslySetInnerHTML={{ __html: banner.message }}
                            className="block text-sm md:text-lg font-medium tracking-tight leading-snug
                              [&_a]:decoration-rose-500 [&_a]:underline-offset-4 [&_a]:transition-colors
                              [&_a]:font-bold [&_a:hover]:text-rose-500"
                          />
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}

        


        {/* Quick Stats - Different for Admin/HR vs regular users */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isStatsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : isAdminOrHR ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orgStats?.totalPendingLeaves ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">On Leave Today</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orgStats?.employeesOnLeaveToday ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Employees absent</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming This Week</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orgStats?.upcomingLeavesThisWeek ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Approved leaves</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">LOP This Month</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orgStats?.totalLopDaysThisMonth ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Loss of pay days</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalAvailable ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Days available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingRequests ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Used This Year</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.usedThisYear ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Days taken</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">LOP Days</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.lopDays ?? 0}</div>
                  <p className="text-xs text-muted-foreground">Loss of pay</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions for Admin/HR */}
        {isAdminOrHR && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/employees">
                <Users className="h-5 w-5" />
                <span>View All Employees</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/policies">
                <FileText className="h-5 w-5" />
                <span>Manage Leave Policies</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link to="/reports">
                <BarChart3 className="h-5 w-5" />
                <span>View Reports</span>
              </Link>
            </Button>
          </div>
        )}

        {/* Department Overview for Admin/HR */}
        {isAdminOrHR && (
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Leave status by department</CardDescription>
            </CardHeader>
            <CardContent>
              {deptLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-5 w-8 ml-auto" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : departmentOverview && departmentOverview.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {departmentOverview.map((dept) => (
                    <div
                      key={dept.department_id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{dept.department_name}</p>
                        <p className="text-sm text-muted-foreground">{dept.total_employees} employees</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{dept.on_leave_today}</p>
                        <p className="text-xs text-muted-foreground">on leave</p>
                        {dept.pending_requests > 0 && (
                          <Badge variant="secondary" className="mt-1">{dept.pending_requests} pending</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No departments configured. Add departments in Settings.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Leave Balances by Type - Only for non-Admin/HR users */}
        {!isAdminOrHR && (
          <Card>
            <CardHeader>
              <CardTitle>Leave Balances</CardTitle>
              <CardDescription>Your available leave days by category</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-5 w-8 ml-auto" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.leaveBalances && stats.leaveBalances.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {stats.leaveBalances.map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{leave.name}</p>
                        <p className="text-sm text-muted-foreground">{leave.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{leave.available}</p>
                        <p className="text-xs text-muted-foreground">of {leave.total} days</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No leave balances found. Contact HR to set up your leave entitlements.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* My Team Section - For Reporting Managers (non-admin/HR) */}
        {showTeamSection && (
          <>
            {/* Team Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {teamStatsLoading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Team Size</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teamStats?.totalTeamMembers ?? 0}</div>
                      <p className="text-xs text-muted-foreground">Direct reports</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">On Leave Today</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teamStats?.onLeaveToday ?? 0}</div>
                      <p className="text-xs text-muted-foreground">Team members absent</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teamStats?.pendingApprovals ?? 0}</div>
                      <p className="text-xs text-muted-foreground">Awaiting your action</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Upcoming Leaves</CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teamStats?.upcomingLeaves ?? 0}</div>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>My Team</CardTitle>
                <CardDescription>Your direct reports</CardDescription>
              </CardHeader>
              <CardContent>
                {teamMembersLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border p-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : teamMembers && teamMembers.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-lg border p-4"
                      >
                        <Avatar>
                          <AvatarFallback>
                            {member.first_name[0]}{member.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.first_name} {member.last_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.department_name || "No department"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    No team members found.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Team Leave Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Leave Requests</CardTitle>
                  <CardDescription>Pending leave requests from your team members</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/approvals" className="flex items-center gap-1">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {teamLeavesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-56" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : teamLeaveRequests && teamLeaveRequests.length > 0 ? (
                  <div className="space-y-4">
                    {teamLeaveRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{request.employee_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.leave_type} · {format(new Date(request.start_date), "MMM d, yyyy")}
                            {request.start_date !== request.end_date && (
                              <> - {format(new Date(request.end_date), "MMM d, yyyy")}</>
                            )}
                            {" · "}{request.days_count} day{request.days_count !== 1 ? "s" : ""}
                          </p>
                          {request.reason && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              "{request.reason}"
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              approveLeave.mutate(
                                { applicationId: request.id, action: "approve" },
                                {
                                  onSuccess: () => toast.success("Leave approved"),
                                  onError: () => toast.error("Failed to approve leave"),
                                }
                              );
                            }}
                            disabled={approveLeave.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              approveLeave.mutate(
                                { applicationId: request.id, action: "reject" },
                                {
                                  onSuccess: () => toast.success("Leave rejected"),
                                  onError: () => toast.error("Failed to reject leave"),
                                }
                              );
                            }}
                            disabled={approveLeave.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    No pending leave requests from your team.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Recent Leave Requests - Different content for Admin/HR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{isAdminOrHR ? "All Recent Leave Requests" : "Recent Leave Requests"}</CardTitle>
              <CardDescription>
                {isAdminOrHR ? "Latest leave applications from all employees" : "Your latest leave applications"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to={isAdminOrHR ? "/leave-management" : "/leaves"} className="flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(isAdminOrHR ? allRequestsLoading : requestsLoading) ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : isAdminOrHR ? (
              allRecentRequests && allRecentRequests.length > 0 ? (
                <div className="space-y-4">
                  {allRecentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{request.employee_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.leave_type} · {format(new Date(request.start_date), "MMM d, yyyy")}
                          {request.start_date !== request.end_date && (
                            <> - {format(new Date(request.end_date), "MMM d, yyyy")}</>
                          )}
                          {" · "}{request.days_count} day{request.days_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No leave requests in the system yet.
                </p>
              )
            ) : (
              recentRequests && recentRequests.length > 0 ? (
                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{request.leave_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.start_date), "MMM d, yyyy")}
                          {request.start_date !== request.end_date && (
                            <> - {format(new Date(request.end_date), "MMM d, yyyy")}</>
                          )}
                          {" · "}{request.days_count} day{request.days_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No leave requests yet. Apply for leave to see your history here.
                </p>
              )
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals - For Manager/HR/Admin */}
        {(role === "manager" || role === "hr" || role === "admin") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Leave requests awaiting your approval</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/leave-management?status=pending" className="flex items-center gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : pendingApprovals && pendingApprovals.length > 0 ? (
                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{approval.employee_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {approval.leave_type} · {format(new Date(approval.start_date), "MMM d, yyyy")}
                          {approval.start_date !== approval.end_date && (
                            <> - {format(new Date(approval.end_date), "MMM d, yyyy")}</>
                          )}
                          {" · "}{approval.days_count} day{approval.days_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  No pending approvals at this time.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}