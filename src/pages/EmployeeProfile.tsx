import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Download, 
  Pencil, 
  Save, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Building2,
  User,
  Linkedin,
  Droplet,
  AlertTriangle,
  Briefcase,
  FileCheck,
  Check,
  Key
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Policy acknowledgement types
type PolicyType = "leave_policy" | "handbook" | "posh_policy" | "cpp";

interface PolicyAcknowledgementsProps {
  employee: EmployeeProfile;
  isOwnProfile: boolean;
  onAcknowledge: (policy: PolicyType) => void;
  isPending: boolean;
}

const POLICIES = [
  { 
    id: "leave_policy" as PolicyType, 
    name: "Leave Policy", 
    description: "Company leave and time-off policies, including types of leaves, application process, and balance management." 
  },
  { 
    id: "handbook" as PolicyType, 
    name: "Employee Handbook", 
    description: "Complete employee handbook covering company policies, code of conduct, and workplace guidelines." 
  },
  { 
    id: "posh_policy" as PolicyType, 
    name: "POSH Policy", 
    description: "Prevention of Sexual Harassment policy and guidelines for maintaining a safe workplace." 
  },
  { 
    id: "cpp" as PolicyType, 
    name: "CPP (Code of Professional Practice)", 
    description: "Code of professional conduct and ethical standards expected from all employees." 
  },
];

function PolicyAcknowledgements({ employee, isOwnProfile, onAcknowledge, isPending }: PolicyAcknowledgementsProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAcknowledgedAt = (policy: PolicyType): string | null => {
    switch (policy) {
      case "leave_policy":
        return employee.leave_policy_acknowledged_at;
      case "handbook":
        return employee.handbook_acknowledged_at;
      case "posh_policy":
        return employee.posh_policy_acknowledged_at;
      case "cpp":
        return employee.cpp_acknowledged_at;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Policy Acknowledgements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Please review and acknowledge the following company policies. Your acknowledgement confirms that you have read and understood these policies.
        </p>
        <div className="space-y-4">
          {POLICIES.map((policy) => {
            const acknowledgedAt = getAcknowledgedAt(policy.id);
            const isAcknowledged = !!acknowledgedAt;

            return (
              <div
                key={policy.id}
                className={`p-4 rounded-lg border ${
                  isAcknowledged ? "bg-muted/50 border-primary/20" : "bg-background"
                }`}
              >
                <div className="flex items-start gap-4">
                  {isOwnProfile && !isAcknowledged ? (
                    <Checkbox
                      id={policy.id}
                      disabled={isPending}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onAcknowledge(policy.id);
                        }
                      }}
                    />
                  ) : (
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                      isAcknowledged ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      {isAcknowledged && <Check className="h-3 w-3" />}
                    </div>
                  )}
                  <div className="flex-1">
                    <Label
                      htmlFor={policy.id}
                      className={`font-medium ${isOwnProfile && !isAcknowledged ? "cursor-pointer" : ""}`}
                    >
                      {policy.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {policy.description}
                    </p>
                    {isAcknowledged && (
                      <p className="text-xs text-primary mt-2 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Acknowledged on {formatDate(acknowledgedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import { ChangePasswordDialog } from "@/components/profile/ChangePasswordDialog";

interface EmployeeProfile {
  id: string;
  user_id: string | null;
  employee_id: string;
  designation: string | null;
  department_id: string | null;
  reporting_manager_id: string | null;
  employment_type: "full_time" | "part_time" | "contract";
  work_mode: string | null;
  gender: "male" | "female" | "other" | null;
  date_of_joining: string;
  probation_end_date: string | null;
  work_location: string | null;
  state: string | null;
  is_active: boolean;
  personal_email: string | null;
  linkedin_url: string | null;
  blood_group: string | null;
  current_address: string | null;
  permanent_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  about_me: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_modified_by: string | null;
  leave_policy_acknowledged_at: string | null;
  handbook_acknowledged_at: string | null;
  posh_policy_acknowledged_at: string | null;
  cpp_acknowledged_at: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  departments: {
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

export default function EmployeeProfile() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { user,role } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<EmployeeProfile>>({});
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Fetch employee profile
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ["employee-profile", employeeId],
    queryFn: async (): Promise<EmployeeProfile | null> => {
      if (!employeeId) return null;
      console.log("employeeId", employeeId);
      
      let employeeData;
      let error;

      // if (role === "admin") {
      //   // 🔹 Admin → profile table
      //   const result = await supabase
      //     .from("profiles")
      //     .select(`
      //       id,
      //       first_name,
      //       last_name,
      //       email,
      //       phone,
      //       avatar_url
      //     `)
      //     .eq("id", employeeId)
      //     .maybeSingle();

      //   employeeData = result.data;
      //   error = result.error;
      //   console.log("employeeData", employeeData);
      //   console.log("error", error);
        

      // } else {
      //   // 🔹 Employee → employees table
        const result = await supabase
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
          .eq("id", employeeId)
          .maybeSingle();

        employeeData = result.data;
        error = result.error;
      // }

      if (error) throw error;


      if (error) {
        console.error("Error fetching employee:", error);
        throw error;
      }

      if (!employeeData) return null;

      // Fetch reporting manager separately
      let reporting_manager = null;
      if (employeeData.reporting_manager_id) {
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
          .maybeSingle();
        
        reporting_manager = managerData;
      }

      return { ...employeeData, reporting_manager } as unknown as EmployeeProfile;
    },
    enabled: !!employeeId,
  });

  // Fetch creator and modifier names
  const { data: auditUsers } = useQuery({
    queryKey: ["audit-users", employee?.created_by, employee?.last_modified_by],
    queryFn: async () => {
      const ids = [employee?.created_by, employee?.last_modified_by].filter(Boolean) as string[];
      if (ids.length === 0) return {};

      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", ids);

      return (data || []).reduce((acc, p) => {
        acc[p.id] = `${p.first_name} ${p.last_name}`;
        return acc;
      }, {} as Record<string, string>);
    },
    enabled: !!(employee?.created_by || employee?.last_modified_by),
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<EmployeeProfile>) => {
      const { error: empError } = await supabase
        .from("employees")
        .update({
          designation: data.designation,
          personal_email: data.personal_email,
          linkedin_url: data.linkedin_url,
          blood_group: data.blood_group,
          gender: data.gender,
          work_location: data.work_location,
          state: data.state,
          current_address: data.current_address,
          permanent_address: data.permanent_address,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_number: data.emergency_contact_number,
          work_mode: data.work_mode,
          about_me: data.about_me,
          last_modified_by: user?.id,
        })
        .eq("id", employeeId);

      if (empError) throw empError;

      // Update profile phone if changed
      if (data.profiles?.phone !== employee?.profiles?.phone && employee?.user_id) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ phone: data.profiles?.phone })
          .eq("id", employee.user_id);

        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-profile", employeeId] });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    },
  });

  // Acknowledge policy mutation
  const acknowledgePolicy = useMutation({
    mutationFn: async (policy: "leave_policy" | "handbook" | "posh_policy" | "cpp") => {
      const updateField = `${policy}_acknowledged_at`;
      const { error } = await supabase
        .from("employees")
        .update({ [updateField]: new Date().toISOString() })
        .eq("id", employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-profile", employeeId] });
      toast.success("Policy acknowledged successfully");
    },
    onError: (error) => {
      console.error("Error acknowledging policy:", error);
      toast.error("Failed to acknowledge policy");
    },
  });

  const isOwnProfile = employee?.user_id === user?.id;

  const handleEdit = () => {
    setEditData({
      designation: employee?.designation,
      personal_email: employee?.personal_email,
      linkedin_url: employee?.linkedin_url,
      blood_group: employee?.blood_group,
      gender: employee?.gender,
      work_location: employee?.work_location,
      state: employee?.state,
      current_address: employee?.current_address,
      permanent_address: employee?.permanent_address,
      emergency_contact_name: employee?.emergency_contact_name,
      emergency_contact_number: employee?.emergency_contact_number,
      work_mode: employee?.work_mode,
      about_me: employee?.about_me,
      profiles: { 
        phone: employee?.profiles?.phone || null 
      } as EmployeeProfile["profiles"],
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEmploymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      full_time: "Full Time",
      part_time: "Part Time",
      contract: "Contract",
    };
    return labels[type] || type;
  };

  const getWorkModeLabel = (mode: string | null) => {
    if (!mode) return "Not Set";
    const labels: Record<string, string> = {
      on_site: "On-site",
      remote: "Remote",
      hybrid: "Hybrid",
    };
    return labels[mode] || mode;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container max-w-5xl py-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-6">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error || !employee) {
    return (
      <AppLayout>
        <div className="container max-w-5xl py-6">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Employee not found</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/employees">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Employees
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link to="/employees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Link>
          </Button>
          {isOwnProfile && !isEditing && (
            <div className="flex gap-2">
              <Button onClick={() => setChangePasswordOpen(true)} variant="outline" size="sm">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button onClick={handleEdit} size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm" disabled={updateProfile.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Profile Hero */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo Section */}
              <div className="flex flex-col items-center gap-3">
                {isOwnProfile ? (
                  <ProfilePhotoUpload
                    currentUrl={employee.profiles?.avatar_url}
                    userId={employee.user_id!}
                    onUploadComplete={() => {
                      queryClient.invalidateQueries({ queryKey: ["employee-profile", employeeId] });
                    }}
                  />
                ) : (
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={employee.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">
                        {getInitials(employee.profiles?.first_name, employee.profiles?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    {employee.profiles?.avatar_url && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = employee.profiles!.avatar_url!;
                          link.download = `${employee.profiles?.first_name}_${employee.profiles?.last_name}_photo.jpg`;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    {employee.profiles?.first_name} {employee.profiles?.last_name}
                  </h1>
                  {isEditing ? (
                    <Input
                      value={editData.designation || ""}
                      onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
                      placeholder="Designation"
                      className="mt-1 max-w-xs"
                    />
                  ) : (
                    <p className="text-muted-foreground">{employee.designation || "No designation set"}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    <User className="h-3 w-3 mr-1" />
                    {employee.employee_id}
                  </Badge>
                  <Badge variant={employee.is_active ? "default" : "secondary"}>
                    {employee.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="secondary">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {getEmploymentTypeLabel(employee.employment_type)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{employee.departments?.name || "No Department"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {employee.work_location || "N/A"}
                      {employee.state && `, ${employee.state}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{employee.profiles?.email}</span>
                  </div>
                  {employee.reporting_manager && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>
                        Reports to:{" "}
                        <Link
                          to={`/profile/${employee.reporting_manager.id}`}
                          className="text-primary hover:underline"
                        >
                          {employee.reporting_manager.profiles?.first_name}{" "}
                          {employee.reporting_manager.profiles?.last_name}
                        </Link>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Details */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Personal Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editData.personal_email || ""}
                        onChange={(e) => setEditData({ ...editData, personal_email: e.target.value })}
                        placeholder="personal@email.com"
                      />
                    ) : (
                      <p className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {employee.personal_email || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">LinkedIn</Label>
                    {isEditing ? (
                      <Input
                        value={editData.linkedin_url || ""}
                        onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/in/username"
                      />
                    ) : (
                      <p className="flex items-center gap-2 mt-1">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        {employee.linkedin_url ? (
                          <a
                            href={employee.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Profile
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Blood Group</Label>
                    {isEditing ? (
                      <Select
                        value={editData.blood_group || ""}
                        onValueChange={(value) => setEditData({ ...editData, blood_group: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                            <SelectItem key={bg} value={bg}>
                              {bg}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="flex items-center gap-2 mt-1">
                        <Droplet className="h-4 w-4 text-muted-foreground" />
                        {employee.blood_group || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    {isEditing ? (
                      <Select
                        value={editData.gender || ""}
                        onValueChange={(value) => setEditData({ ...editData, gender: value as "male" | "female" | "other" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 capitalize">{employee.gender || "Not specified"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Current Address</Label>
                    {isEditing ? (
                      <Textarea
                        value={editData.current_address || ""}
                        onChange={(e) => setEditData({ ...editData, current_address: e.target.value })}
                        placeholder="Enter current address"
                        rows={2}
                      />
                    ) : (
                      <p className="mt-1">{employee.current_address || "Not provided"}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Permanent Address</Label>
                    {isEditing ? (
                      <Textarea
                        value={editData.permanent_address || ""}
                        onChange={(e) => setEditData({ ...editData, permanent_address: e.target.value })}
                        placeholder="Enter permanent address"
                        rows={2}
                      />
                    ) : (
                      <p className="mt-1">{employee.permanent_address || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact & Emergency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Mobile Number</Label>
                    {isEditing ? (
                      <Input
                        value={editData.profiles?.phone || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            profiles: { ...editData.profiles, phone: e.target.value } as EmployeeProfile["profiles"],
                          })
                        }
                        placeholder="+91 XXXXX XXXXX"
                      />
                    ) : (
                      <p className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {employee.profiles?.phone || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Official Email</Label>
                    <p className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {employee.profiles?.email}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Contact Name</Label>
                      {isEditing ? (
                        <Input
                          value={editData.emergency_contact_name || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, emergency_contact_name: e.target.value })
                          }
                          placeholder="Emergency contact name"
                        />
                      ) : (
                        <p className="mt-1">{employee.emergency_contact_name || "Not provided"}</p>
                      )}
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Contact Number</Label>
                      {isEditing ? (
                        <Input
                          value={editData.emergency_contact_number || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, emergency_contact_number: e.target.value })
                          }
                          placeholder="+91 XXXXX XXXXX"
                        />
                      ) : (
                        <p className="mt-1">{employee.emergency_contact_number || "Not provided"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Date of Joining</Label>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(employee.date_of_joining)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Employment Type</Label>
                    <p className="mt-1">{getEmploymentTypeLabel(employee.employment_type)}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Work Mode</Label>
                    {isEditing ? (
                      <Select
                        value={editData.work_mode || "on_site"}
                        onValueChange={(value) => setEditData({ ...editData, work_mode: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select work mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on_site">On-site</SelectItem>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1">{getWorkModeLabel(employee.work_mode)}</p>
                    )}
                  </div>

                  {employee.probation_end_date && (
                    <div>
                      <Label className="text-muted-foreground">Probation End Date</Label>
                      <p className="mt-1">{formatDate(employee.probation_end_date)}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-muted-foreground">Work Location</Label>
                    <p className="mt-1">
                      {employee.work_location || "N/A"}
                      {employee.state && `, ${employee.state}`}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="mt-1">{employee.departments?.name || "Not assigned"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About Me</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.about_me || ""}
                    onChange={(e) => setEditData({ ...editData, about_me: e.target.value })}
                    placeholder="Write a brief introduction about yourself..."
                    rows={6}
                  />
                ) : (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {employee.about_me || "No introduction provided yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies">
            <PolicyAcknowledgements
              employee={employee}
              isOwnProfile={isOwnProfile}
              onAcknowledge={(policy) => acknowledgePolicy.mutate(policy)}
              isPending={acknowledgePolicy.isPending}
            />
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Profile Created</Label>
                    <p className="mt-1">{formatDate(employee.created_at)}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p className="mt-1">{formatDate(employee.updated_at)}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Created By</Label>
                    <p className="mt-1">
                      {employee.created_by && auditUsers?.[employee.created_by]
                        ? auditUsers[employee.created_by]
                        : "System"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Last Modified By</Label>
                    <p className="mt-1">
                      {employee.last_modified_by && auditUsers?.[employee.last_modified_by]
                        ? auditUsers[employee.last_modified_by]
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Change Password Dialog */}
        <ChangePasswordDialog
          open={changePasswordOpen}
          onOpenChange={setChangePasswordOpen}
        />
      </div>
    </AppLayout>
  );
}