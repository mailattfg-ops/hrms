import { useState, useEffect } from "react";
import { X, Save, Eye, Variable, Bold, Italic, Link, List, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

interface TemplateData {
  id?: string;
  name: string;
  subject: string;
  category: string;
  status: "active" | "draft";
  body: string;
}

interface TemplateEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: TemplateData | null;
  onSave: (template: TemplateData) => void;
}

const availableVariables = [
  { key: "employee_name", label: "Employee Name" },
  { key: "employee_email", label: "Employee Email" },
  { key: "company_name", label: "Company Name" },
  { key: "manager_name", label: "Manager Name" },
  { key: "department", label: "Department" },
  { key: "leave_start_date", label: "Leave Start Date" },
  { key: "leave_end_date", label: "Leave End Date" },
  { key: "leave_type", label: "Leave Type" },
  { key: "current_date", label: "Current Date" },
];

const categories = ["Onboarding", "Leave Management", "Security", "Celebrations", "Offboarding", "General"];

const TemplateEditorModal = ({ open, onOpenChange, template, onSave }: TemplateEditorModalProps) => {
  const [formData, setFormData] = useState<TemplateData>(
    template || {
      name: "",
      subject: "",
      category: "General",
      status: "draft",
      body: "",
    }
  );

  useEffect(() => {
    if (open) {
      if (template) {
        setFormData(template);
      } else {
        setFormData({
          name: "",
          subject: "",
          category: "General",
          status: "draft",
          body: "",
        });
      }
    }
  }, [template, open]);

  const [activeTab, setActiveTab] = useState("edit");

  const insertVariable = (variable: string, field: "subject" | "body") => {
    const variableText = `{{${variable}}}`;
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] + variableText,
    }));
  };

  const renderPreview = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      const varInfo = availableVariables.find((v) => v.key === variable);
      return `<span class="bg-primary/20 text-primary px-1 rounded">[${varInfo?.label || variable}]</span>`;
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }
    if (!formData.subject.trim()) {
      toast({
        title: "Validation Error",
        description: "Email subject is required",
        variant: "destructive",
      });
      return;
    }
    onSave(formData);
    toast({
      title: "Template Saved",
      description: `"${formData.name}" has been saved successfully`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {template ? "Edit Template" : "Create New Template"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6 py-4">
          {/* Template Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Welcome Email"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "draft") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Subject Line */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="subject">Email Subject</Label>
              <div className="flex gap-1">
                {availableVariables.slice(0, 3).map((v) => (
                  <Badge
                    key={v.key}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 text-xs"
                    onClick={() => insertVariable(v.key, "subject")}
                  >
                    {v.label}
                  </Badge>
                ))}
              </div>
            </div>
            <Input
              id="subject"
              placeholder="e.g., Welcome to the team, {{employee_name}}!"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <Separator />

          {/* Editor Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="edit" className="gap-2">
                  <AlignLeft className="h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              {activeTab === "edit" && (
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Link className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <List className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <TabsContent value="edit" className="mt-0 space-y-4">
              {/* Variable Palette */}
              <div className="p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Variable className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Insert Variable</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((v) => (
                    <Badge
                      key={v.key}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => insertVariable(v.key, "body")}
                    >
                      {`{{${v.key}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              <Textarea
                placeholder="Write your email content here... Use variables like {{employee_name}} to personalize the email."
                className="min-h-[250px] resize-none font-mono text-sm"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <div className="border rounded-lg p-6 bg-card min-h-[300px]">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="border-b pb-4">
                    <p className="text-sm text-muted-foreground">Subject:</p>
                    <p
                      className="font-semibold"
                      dangerouslySetInnerHTML={{ __html: renderPreview(formData.subject) }}
                    />
                  </div>
                  <div
                    className="prose prose-sm max-w-none whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: renderPreview(formData.body) || "<span class='text-muted-foreground italic'>No content yet...</span>" }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFormData({ ...formData, status: "draft" })}
            >
              Save as Draft
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateEditorModal;
