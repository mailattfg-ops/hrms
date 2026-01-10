// Application constants
export const APP_NAME = "Think Forge HRMS";

// State code to full name mapping
export const STATE_CODE_MAP: Record<string, string> = {
  "AN": "Andaman and Nicobar Islands",
  "AP": "Andhra Pradesh",
  "AR": "Arunachal Pradesh",
  "AS": "Assam",
  "BR": "Bihar",
  "CG": "Chhattisgarh",
  "CH": "Chandigarh",
  "DD": "Daman and Diu",
  "DL": "Delhi",
  "DN": "Dadra and Nagar Haveli",
  "GA": "Goa",
  "GJ": "Gujarat",
  "HP": "Himachal Pradesh",
  "HR": "Haryana",
  "JH": "Jharkhand",
  "JK": "Jammu and Kashmir",
  "KA": "Karnataka",
  "KL": "Kerala",
  "LD": "Lakshadweep",
  "MH": "Maharashtra",
  "ML": "Meghalaya",
  "MN": "Manipur",
  "MP": "Madhya Pradesh",
  "MZ": "Mizoram",
  "NL": "Nagaland",
  "OR": "Odisha",
  "PB": "Punjab",
  "PY": "Puducherry",
  "RJ": "Rajasthan",
  "SK": "Sikkim",
  "TG": "Telangana",
  "TN": "Tamil Nadu",
  "TR": "Tripura",
  "UK": "Uttarakhand",
  "UP": "Uttar Pradesh",
  "WB": "West Bengal"
};

// Reverse mapping: full name to state code
export const STATE_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_CODE_MAP).map(([code, name]) => [name, code])
);

// Indian states for regional holidays and employee state
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh"
] as const;

// Role hierarchy (lower number = higher privilege)
export const ROLE_HIERARCHY = {
  admin: 1,
  hr: 2,
  finance: 3,
  manager: 4,
  team_member: 5,
} as const;

export type AppRole = keyof typeof ROLE_HIERARCHY;

// Role display names
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  hr: "HR",
  finance: "Finance",
  manager: "Manager",
  team_member: "Team Member",
};

// Employment types
export const EMPLOYMENT_TYPE_LABELS = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
} as const;

// Leave categories
export const LEAVE_CATEGORY_LABELS = {
  regular: "Regular",
  wellness: "Wellness",
  special: "Special",
  statutory: "Statutory",
  compensatory: "Compensatory",
} as const;

// Leave status colors
export const LEAVE_STATUS_COLORS = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  cancelled: "muted",
} as const;

// Navigation items based on role
export const getNavigationItems = (role: AppRole) => {
  const items = [
    { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard" },
  ];

  // My Leaves is only for non-admin/HR roles (they manage org-wide data)
  if (!["admin"].includes(role)) {
    items.push({ label: "My Leaves", path: "/leaves", icon: "Calendar" });
  }

  // items.push({ label: "Calendar", path: "/calendar", icon: "CalendarDays" });

  // // Leave History - available to all roles
  // items.push({ label: "Leave History", path: "/leave-history", icon: "History" });

  if (["admin", "hr", "manager"].includes(role)) {
    items.push({ label: "Leave Management", path: "/leave-management", icon: "CalendarDays" });
  }

  // Holidays - available to all roles (read-only for non-admin/HR)
  items.push({ label: "Holidays", path: "/holidays", icon: "CalendarPlus" });

  // if (["admin", "hr", "manager"].includes(role)) {
  //   items.push({ label: "Approvals", path: "/approvals", icon: "CheckCircle" });
  // }

  if (["admin", "hr"].includes(role)) {
    items.push(
      { label: "Employees", path: "/employees", icon: "Users" },
      { label: "Leave Policies", path: "/policies", icon: "FileText" },
      { label: "Reports", path: "/reports", icon: "BarChart3" }
    );
  }

  if (role === "admin") {
    items.push({ label: "Settings", path: "/settings", icon: "Settings" });
  }

  return items;
};
