import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";
import { NotificationPreferences } from "@/components/settings/NotificationPreferences";
import { AuditLogViewer } from "@/components/settings/AuditLogViewer";
import { DepartmentManagement } from "@/components/settings/DepartmentManagement";
import { PolicyDocuments } from "@/components/settings/PolicyDocuments";
import { AnnouncementSettings } from "@/components/settings/AnnouncementSettings";
import { AppLayout } from "@/components/layout/AppLayout";
import { Building2, Bell, FileText, FolderKanban, FileCheck, Megaphone, Mail } from "lucide-react";
import EmailSetup from "@/components/settings/MailSetup";

export default function Settings() {
  return (
    <AppLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage organization settings and system preferences
        </p>
      </div>

      <Tabs defaultValue="organization" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Organization</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            <span className="hidden sm:inline">Departments</span>
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Policy Docs</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Announcements</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Log</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email Setup</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <OrganizationSettings />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentManagement />
        </TabsContent>

        <TabsContent value="policies">
          <PolicyDocuments />
        </TabsContent>

        <TabsContent value="announcements">
          <AnnouncementSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPreferences />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="email">
          <EmailSetup />
        </TabsContent>
      </Tabs>
    </div>
    </AppLayout>
  );
}