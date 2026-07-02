// frontend/src/utils/authUtils.ts

import api from "../api";
import {
  getCachedRolesAndPermissions,
  getRolePermissions,
} from "../hooks/useRolesAndPermissions";

export interface UserData {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  /** teacher_type: "class" | "subject" | null  (was instructor_type) */
  teacher_type: string | null;
  /** Alias kept for backwards compatibility */
  instructor_type: string | null;
  phone?: string;
  bio?: string;
  permissions: string[];
  is_staff?: boolean;
  is_superuser?: boolean;
}

export type UserRole =
  | "super_admin"
  | "admin"
  | "school_admin"
  | "teacher"
  | "non_teaching"
  | "student"
  | "parent"
  | "visitor";

// ─────────────────────────────────────────────────────────────────────────────
// NIGERIA NERDC SUBJECT CATALOGUE  (keep in sync with backend SUBJECT_CHOICES)
// ─────────────────────────────────────────────────────────────────────────────

export interface SubjectMeta {
  code: string;
  label: string;
  category: string;
  level: "jss" | "sss" | "both";
  streams?: string[]; // if empty/absent → all streams
}

export const NIGERIA_SUBJECTS: SubjectMeta[] = [
  // Core / Compulsory
  {
    code: "english_language",
    label: "English Language",
    category: "core",
    level: "both",
  },
  {
    code: "mathematics",
    label: "Mathematics",
    category: "core",
    level: "both",
  },
  {
    code: "civic_education",
    label: "Civic Education",
    category: "core",
    level: "both",
  },
  {
    code: "digital_technologies",
    label: "Digital Technologies / Computer Studies",
    category: "core",
    level: "both",
  },
  {
    code: "citizenship_heritage",
    label: "Citizenship and Heritage Studies",
    category: "core",
    level: "sss",
  },
  {
    code: "entrepreneurship",
    label: "Trade / Entrepreneurship Subject",
    category: "core",
    level: "sss",
  },

  // Science
  {
    code: "biology",
    label: "Biology",
    category: "science",
    level: "sss",
    streams: ["science"],
  },
  {
    code: "chemistry",
    label: "Chemistry",
    category: "science",
    level: "sss",
    streams: ["science"],
  },
  {
    code: "physics",
    label: "Physics",
    category: "science",
    level: "sss",
    streams: ["science"],
  },
  {
    code: "further_mathematics",
    label: "Further Mathematics",
    category: "science",
    level: "sss",
    streams: ["science"],
  },
  {
    code: "agricultural_science",
    label: "Agricultural Science",
    category: "science",
    level: "both",
  },
  { code: "geography", label: "Geography", category: "science", level: "both" },
  {
    code: "technical_drawing",
    label: "Technical Drawing",
    category: "science",
    level: "sss",
    streams: ["science", "technical"],
  },
  {
    code: "food_nutrition",
    label: "Food and Nutrition",
    category: "science",
    level: "sss",
  },
  {
    code: "health_education",
    label: "Health Education",
    category: "science",
    level: "both",
  },
  {
    code: "physical_health_education",
    label: "Physical and Health Education",
    category: "science",
    level: "both",
  },

  // Humanities / Arts
  {
    code: "literature_in_english",
    label: "Literature in English",
    category: "arts",
    level: "sss",
    streams: ["arts"],
  },
  {
    code: "government",
    label: "Government",
    category: "arts",
    level: "sss",
    streams: ["arts", "commercial"],
  },
  {
    code: "nigerian_history",
    label: "Nigerian History",
    category: "arts",
    level: "sss",
    streams: ["arts"],
  },
  {
    code: "christian_religious_studies",
    label: "Christian Religious Studies (CRS)",
    category: "arts",
    level: "both",
  },
  {
    code: "islamic_religious_studies",
    label: "Islamic Religious Studies (IRS)",
    category: "arts",
    level: "both",
  },
  {
    code: "visual_arts",
    label: "Visual Arts (Fine Arts)",
    category: "arts",
    level: "sss",
    streams: ["arts"],
  },
  { code: "music", label: "Music", category: "arts", level: "both" },
  { code: "french", label: "French", category: "arts", level: "both" },
  { code: "arabic", label: "Arabic", category: "arts", level: "both" },
  { code: "hausa", label: "Hausa", category: "arts", level: "both" },
  { code: "igbo", label: "Igbo", category: "arts", level: "both" },
  { code: "yoruba", label: "Yoruba", category: "arts", level: "both" },
  {
    code: "home_management",
    label: "Home Management",
    category: "arts",
    level: "sss",
    streams: ["arts"],
  },
  {
    code: "catering_craft",
    label: "Catering Craft",
    category: "arts",
    level: "sss",
  },

  // Commercial / Business
  {
    code: "financial_accounting",
    label: "Financial Accounting",
    category: "commercial",
    level: "sss",
    streams: ["commercial"],
  },
  {
    code: "commerce",
    label: "Commerce",
    category: "commercial",
    level: "sss",
    streams: ["commercial"],
  },
  {
    code: "economics",
    label: "Economics",
    category: "commercial",
    level: "sss",
    streams: ["commercial", "arts"],
  },
  {
    code: "marketing",
    label: "Marketing",
    category: "commercial",
    level: "sss",
    streams: ["commercial"],
  },
  {
    code: "business_studies",
    label: "Business Studies",
    category: "commercial",
    level: "both",
  },

  // Technology / Technical
  {
    code: "basic_electronics",
    label: "Basic Electronics",
    category: "technical",
    level: "sss",
    streams: ["technical"],
  },
  {
    code: "basic_electricity",
    label: "Basic Electricity",
    category: "technical",
    level: "sss",
    streams: ["technical"],
  },
  {
    code: "metalwork",
    label: "Metalwork",
    category: "technical",
    level: "sss",
    streams: ["technical"],
  },
  {
    code: "woodwork",
    label: "Woodwork",
    category: "technical",
    level: "sss",
    streams: ["technical"],
  },
  {
    code: "building_construction",
    label: "Building Construction",
    category: "technical",
    level: "sss",
    streams: ["technical"],
  },
  {
    code: "auto_mechanics",
    label: "Auto Mechanics",
    category: "technical",
    level: "sss",
    streams: ["technical"],
  },
  {
    code: "welding_fabrication",
    label: "Welding and Fabrication",
    category: "technical",
    level: "sss",
    streams: ["technical"],
  },
  {
    code: "computer_studies_ict",
    label: "Computer Studies / ICT",
    category: "technical",
    level: "both",
  },

  // Vocational / Trade
  {
    code: "solar_installation",
    label: "Solar Panel Installation",
    category: "vocational",
    level: "sss",
  },
  {
    code: "fashion_design",
    label: "Fashion Design and Garment Making",
    category: "vocational",
    level: "sss",
  },
  {
    code: "livestock_farming",
    label: "Livestock Farming",
    category: "vocational",
    level: "sss",
  },
  {
    code: "beauty_cosmetology",
    label: "Beauty and Cosmetology",
    category: "vocational",
    level: "sss",
  },
  {
    code: "computer_hardware_repairs",
    label: "Computer Hardware / GSM Repairs",
    category: "vocational",
    level: "sss",
  },
  {
    code: "horticulture",
    label: "Horticulture and Crop Production",
    category: "vocational",
    level: "sss",
  },

  // JSS General
  {
    code: "basic_science",
    label: "Basic Science",
    category: "jss",
    level: "jss",
  },
  {
    code: "basic_technology",
    label: "Basic Technology",
    category: "jss",
    level: "jss",
  },
  {
    code: "social_studies",
    label: "Social Studies",
    category: "jss",
    level: "jss",
  },
  {
    code: "cultural_creative_arts",
    label: "Cultural and Creative Arts",
    category: "jss",
    level: "jss",
  },
  {
    code: "religious_studies",
    label: "Religious Studies (General)",
    category: "jss",
    level: "jss",
  },
];

export function getSubjectLabel(code: string): string {
  return NIGERIA_SUBJECTS.find((s) => s.code === code)?.label ?? code;
}

export function getSubjectsForStream(
  stream: string,
  level: "jss" | "sss" = "sss",
): SubjectMeta[] {
  return NIGERIA_SUBJECTS.filter((s) => {
    if (s.level !== level && s.level !== "both") return false;
    if (!s.streams || s.streams.length === 0) return true;
    return s.streams.includes(stream);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE → PERMISSIONS MAP (FALLBACK - should fetch from /api/roles-and-permissions/)
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: This is a fallback for offline/early authentication.
// The canonical version is in backend/api/core/constants.py
// Use the hook useRolesAndPermissions() to get the live version from the API.
// If you update permissions, update BOTH this file AND backend/api/core/constants.py

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    "admin.access",
    "course.view",
    "course.create",
    "course.edit",
    "course.delete",
    "assignment.view",
    "assignment.create",
    "assignment.edit",
    "assignment.delete",
    "enrollment.view",
    "enrollment.create",
    "enrollment.manage",
    "quiz.view",
    "quiz.create",
    "quiz.edit",
    "quiz.delete",
    "analytics.view",
    "analytics.full",
    "payment.view",
    "payment.manage",
    "user.view",
    "user.create",
    "user.edit",
    "user.delete",
    "grade.view",
    "grade.edit",
    "department.access.western",
    "department.access.arabic",
    "department.access.programming",
    "audit.view",
    "subject.manage",
    "teacher.assign",
  ],
  admin: [
    "admin.access",
    "course.view",
    "course.create",
    "course.edit",
    "course.delete",
    "assignment.view",
    "assignment.create",
    "assignment.edit",
    "enrollment.view",
    "enrollment.create",
    "enrollment.manage",
    "quiz.view",
    "quiz.create",
    "analytics.view",
    "payment.view",
    "user.view",
    "user.create",
    "user.edit",
    "grade.view",
    "grade.edit",
    "department.access.western",
    "department.access.arabic",
    "department.access.programming",
    "audit.view",
  ],
  school_admin: [
    "admin.access",
    "course.view",
    "course.create",
    "course.edit",
    "assignment.view",
    "assignment.create",
    "assignment.edit",
    "enrollment.view",
    "enrollment.create",
    "enrollment.manage",
    "quiz.view",
    "analytics.view",
    "payment.view",
    "user.view",
    "user.create",
    "user.edit",
    "grade.view",
    "grade.edit",
    "department.access.*",
    "audit.view",
  ],
  teacher: [
    "course.view",
    "assignment.view",
    "assignment.create",
    "assignment.edit",
    "enrollment.view",
    "quiz.view",
    "quiz.create",
    "quiz.edit",
    "analytics.view",
    "grade.view",
    "grade.edit",
    "subject.manage",
  ],
  non_teaching: [
    "analytics.view",
    "payment.view",
    "payment.manage",
    "user.view",
  ],
  student: [
    "course.view",
    "assignment.view",
    "quiz.view",
    "quiz.submit",
    "grade.view",
    "chat.access",
  ],
  parent: ["course.view", "assignment.view", "grade.view", "chat.access"],
  visitor: ["course.view"],
};

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export function resolvePermissions(
  role: string,
  department?: string | null,
): string[] {
  const cachedRoles = getCachedRolesAndPermissions();
  const livePermissions = cachedRoles
    ? getRolePermissions(role, cachedRoles)
    : undefined;
  const base = livePermissions ?? ROLE_PERMISSIONS[role] ?? [];

  if (role === "school_admin" && department) {
    return [
      ...base.filter((p) => !p.startsWith("department.access.")),
      `department.access.${department}`,
    ];
  }

  const extra: string[] = [];
  if (department) extra.push(`department.access.${department}`);
  return [...new Set([...base, ...extra])];
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getUserData(): UserData | null {
  try {
    const raw = localStorage.getItem("user_data");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUserData(data: UserData): void {
  localStorage.setItem("user_data", JSON.stringify(data));
}

export function clearUserData(): void {
  localStorage.removeItem("user_data");
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function hasPermission(permission: string): boolean {
  const user = getUserData();
  if (!user) return false;
  const perms =
    user.permissions ?? resolvePermissions(user.role, user.department);
  return perms.includes(permission);
}

export function hasRole(...roles: string[]): boolean {
  const user = getUserData();
  return roles.includes(user?.role ?? "");
}

export function isAdmin(): boolean {
  return hasRole("admin", "school_admin", "super_admin");
}

export function isSuperAdmin(): boolean {
  return hasRole("super_admin");
}

export function isSchoolAdmin(): boolean {
  return hasRole("school_admin");
}

export function isTeacher(): boolean {
  return hasRole("teacher", "instructor");
}

export function isStudent(): boolean {
  return hasRole("student");
}

export function isParent(): boolean {
  return hasRole("parent");
}

/** @deprecated use isTeacher() */
export const isInstructor = isTeacher;

// ─────────────────────────────────────────────────────────────────────────────
// AUTH FLOW
// ─────────────────────────────────────────────────────────────────────────────

export async function handleLoginSuccess(userFromLogin: any): Promise<void> {
  try {
    const res = await api.get("/profiles/me/");
    const p = res.data;
    const userObj = p.user || {};
    const role = p.role ?? userFromLogin?.role ?? "";
    const department = p.department ?? userFromLogin?.department ?? null;

    // Support both old instructor_type and new teacher_type
    const teacherType =
      p.teacher_type ??
      p.instructor_type ??
      userFromLogin?.teacher_type ??
      userFromLogin?.instructor_type ??
      null;

    const normalized: UserData = {
      id: p.id ?? userFromLogin?.id,
      username: userObj.username ?? userFromLogin?.username ?? "",
      email: userObj.email ?? userFromLogin?.email ?? "",
      firstName: userObj.first_name ?? userFromLogin?.first_name ?? "",
      lastName: userObj.last_name ?? userFromLogin?.last_name ?? "",
      first_name: userObj.first_name ?? userFromLogin?.first_name ?? "",
      last_name: userObj.last_name ?? userFromLogin?.last_name ?? "",
      role,
      department,
      teacher_type: teacherType,
      instructor_type: teacherType, // backwards compat
      phone: p.phone ?? "",
      bio: p.bio ?? "",
      is_staff: userFromLogin?.is_staff ?? false,
      is_superuser: userFromLogin?.is_superuser ?? false,
      permissions: resolvePermissions(role, department),
    };
    setUserData(normalized);
  } catch (err) {
    console.warn(
      "Could not fetch /profiles/me/, saving login data directly",
      err,
    );
    const role = userFromLogin?.role ?? "";
    const department = userFromLogin?.department ?? null;
    const teacherType =
      userFromLogin?.teacher_type ?? userFromLogin?.instructor_type ?? null;
    const fallback: UserData = {
      id: userFromLogin?.id,
      username: userFromLogin?.username ?? "",
      email: userFromLogin?.email ?? "",
      firstName: userFromLogin?.first_name ?? "",
      lastName: userFromLogin?.last_name ?? "",
      first_name: userFromLogin?.first_name ?? "",
      last_name: userFromLogin?.last_name ?? "",
      role,
      department,
      teacher_type: teacherType,
      instructor_type: teacherType,
      permissions: resolvePermissions(role, department),
    };
    setUserData(fallback);
  }
}

export async function checkAuthStatus(): Promise<boolean> {
  try {
    await api.get("/auth/status/");
    return true;
  } catch {
    return false;
  }
}

export async function handleLogout(): Promise<void> {
  try {
    await api.post("/auth/logout/");
  } catch {
    // Even if the backend call fails, clear local state
  } finally {
    clearUserData();
    sessionStorage.clear();
    window.location.href = "/login";
  }
}

/**
 * Returns the correct dashboard route for a given role / department / teacher_type.
 * Used by App.tsx HomeRouter and DashboardRouter to redirect after login.
 *
 * Hierarchy: super_admin → admin → school_admin → teacher → non_teaching
 *            → student → parent → visitor
 */
export function getDashboardRouteByRole(
  role: string,
  department?: string | null,
  teacherType?: string | null,
): string {
  switch (role) {
    case "super_admin":
      return "/super-admin-portal";

    case "admin":
      return "/admin-dashboard";

    case "school_admin":
      if (department === "western") return "/western-dashboard";
      if (department === "arabic") return "/arabic-dashboard";
      if (department === "programming") return "/digital-dashboard";
      return "/admin-dashboard";

    case "teacher":
      if (teacherType === "class") return "/class-teacher-dashboard";
      if (teacherType === "subject") return "/subject-teacher-dashboard";
      return "/teacher-dashboard";

    case "non_teaching":
      return "/staff-dashboard";

    case "student":
      return "/student-dashboard";

    case "parent":
      return "/parent-portal";

    case "visitor":
      return "/visitor";

    default:
      return "/dashboard";
  }
}
