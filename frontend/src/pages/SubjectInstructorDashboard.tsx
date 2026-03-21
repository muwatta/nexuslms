// frontend/src/pages/SubjectInstructorDashboard.tsx
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
  type ElementType,
} from "react";
import api from "../api";
import { getUserData } from "../utils/authUtils";
import { AnimatePresence, motion } from "framer-motion";
import TeacherLayout from "../components/TeacherLayout";
import {
  BookOpen,
  Users,
  FileText,
  ChevronDown,
  Save,
  Upload,
  Plus,
  Search,
  Calendar,
  TrendingUp,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  GraduationCap,
  School,
  Clock,
  BarChart3,
  MoreHorizontal,
} from "lucide-react";

// ── Types ────

interface Course {
  id: number;
  title: string;
  department?: string;
  student_class?: string;
}

interface StudentRow {
  profile_id: number;
  student_id: string;
  full_name: string;
  test1: number;
  test2: number;
  assignment: number;
  midterm: number;
  exam: number;
  total: number;
  grade: string;
  result_id: number | null;
  status: "draft" | "submitted" | "reviewed" | "published";
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string;
  course: number;
  course_title?: string;
}

interface Student {
  id: number;
  username: string;
  full_name?: string;
  class: string | null;
  class_section?: string;
  department: string | null;
  student_id?: string;
  assignment_id: number;
}

interface MySubject {
  subject: string;
  subject_display: string;
  students: Student[];
}

interface StudentProgress {
  student_name: string;
  student_id: string;
  student_class: string;
  results: Array<{
    subject: string;
    total: number;
    grade: string;
    ca_total: number;
    exam: number;
    status: "draft" | "submitted" | "reviewed" | "published";
  }>;
}

type SectionType = "entry" | "assignments" | "students";

interface TabConfig {
  id: SectionType;
  label: string;
  icon: ElementType;
  count?: number;
}

interface Enrollment {
  student: number | { id: number };
}

interface Profile {
  id: number;
  student_id?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    username?: string;
  };
}

// ── Constants 

const CL: Record<string, string> = {
  jss1: "JSS 1",
  jss2: "JSS 2",
  jss3: "JSS 3",
  sss1_sci: "SSS 1 Science",
  sss1_arts: "SSS 1 Arts",
  sss1_com: "SSS 1 Commercial",
  sss2_sci: "SSS 2 Science",
  sss2_arts: "SSS 2 Arts",
  sss2_com: "SSS 2 Commercial",
  sss3_sci: "SSS 3 Science",
  sss3_arts: "SSS 3 Arts",
  sss3_com: "SSS 3 Commercial",
  ibtidaai_1: "الصف الأول الابتدائي",
  ibtidaai_2: "الصف الثاني الابتدائي",
  ibtidaai_3: "الصف الثالث الابتدائي",
  ibtidaai_4: "الصف الرابع الابتدائي",
  ibtidaai_5: "الصف الخامس الابتدائي",
  ibtidaai_6: "الصف السادس الابتدائي",
  mutawassit_1: "الصف الأول المتوسط",
  mutawassit_2: "الصف الثاني المتوسط",
  mutawassit_3: "الصف الثالث المتوسط",
  thanawi_1: "الصف الأول الثانوي",
  thanawi_2: "الصف الثاني الثانوي",
  thanawi_3: "الصف الثالث الثانوي",
  ai_ml_beginner: "AI & ML — Beginner",
  ai_ml_junior: "AI & ML — Junior",
  ai_ml_intermediate: "AI & ML — Intermediate",
  ai_ml_advanced: "AI & ML — Advanced",
  scratch_beginner: "Scratch — Beginner",
  scratch_junior: "Scratch — Junior",
  scratch_intermediate: "Scratch — Intermediate",
  scratch_advanced: "Scratch — Advanced",
  frontend_beginner: "Frontend — Beginner",
  frontend_junior: "Frontend — Junior",
  frontend_intermediate: "Frontend — Intermediate",
  frontend_advanced: "Frontend — Advanced",
  backend_beginner: "Backend — Beginner",
  backend_junior: "Backend — Junior",
  backend_intermediate: "Backend — Intermediate",
  backend_advanced: "Backend — Advanced",
  ai_automation_beginner: "AI Automation — Beginner",
  ai_automation_junior: "AI Automation — Junior",
  ai_automation_intermediate: "AI Automation — Intermediate",
  ai_automation_advanced: "AI Automation — Advanced",
  data_science_beginner: "Data Science — Beginner",
  data_science_junior: "Data Science — Junior",
  data_science_intermediate: "Data Science — Intermediate",
  data_science_advanced: "Data Science — Advanced",
};

const TERMS = ["FIRST TERM", "SECOND TERM", "THIRD TERM"] as const;
type TermType = (typeof TERMS)[number];

const TERM_KEY: Record<TermType, string> = {
  "FIRST TERM": "First Term",
  "SECOND TERM": "Second Term",
  "THIRD TERM": "Third Term",
};

const SCHEME_MAX = {
  test1: 10,
  test2: 10,
  assignment: 10,
  midterm: 10,
  exam: 60,
} as const;

type ScoreField = keyof typeof SCHEME_MAX;

const gradeOf = (total: number): string => {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
};

const GRADE_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  A: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  B: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  C: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  D: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  E: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  F: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
};

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; icon: ElementType }
> = {
  published: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  reviewed: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    icon: Eye,
  },
  submitted: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    icon: Upload,
  },
  draft: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    icon: FileText,
  },
};

const getCurrentYear = (): string => {
  const n = new Date();
  return n.getMonth() >= 8
    ? `${n.getFullYear()}/${n.getFullYear() + 1}`
    : `${n.getFullYear() - 1}/${n.getFullYear()}`;
};

const YEARS = Array.from({ length: 12 }, (_, i) => {
  const y = new Date().getFullYear() + 3 - i;
  return `${y}/${y + 1}`;
});

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getInitial = (name: string): string => (name || "?")[0].toUpperCase();

// ── Reusable UI Components ─────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className = "" }: CardProps) => (
  <div
    className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm ${className}`}
  >
    {children}
  </div>
);

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "neutral";
  className?: string;
}

const Badge = ({
  children,
  variant = "default",
  className = "",
}: BadgeProps) => {
  const variants = {
    default: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
    success:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    warning:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    error: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    neutral: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading,
  className = "",
  ...props
}: ButtonProps) => {
  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20",
    secondary:
      "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100",
    outline:
      "border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300",
    ghost:
      "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

const SectionHeader = ({ title, subtitle, action }: SectionHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
    {action && <div className="flex items-center gap-2">{action}</div>}
  </div>
);

interface EmptyStateProps {
  icon: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
      {title}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
      {description}
    </p>
    {action}
  </div>
);

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Toast = ({ message, type, onClose }: ToastProps) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl ${
      type === "success" ? "bg-emerald-600" : "bg-rose-600"
    } text-white min-w-[300px]`}
  >
    {type === "success" ? (
      <CheckCircle2 className="w-5 h-5" />
    ) : (
      <AlertCircle className="w-5 h-5" />
    )}
    <p className="text-sm font-medium flex-1">{message}</p>
    <button
      onClick={onClose}
      className="opacity-70 hover:opacity-100 transition-opacity"
    >
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  helperText?: string;
}

const Select = ({
  label,
  helperText,
  className = "",
  ...props
}: SelectProps) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </label>
    <select
      className={`w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 ${className}`}
      {...props}
    />
    {helperText && <p className="text-[10px] text-gray-400">{helperText}</p>}
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────

const SubjectInstructorDashboard: React.FC = () => {
  const userData = getUserData();
  const dept = userData?.department ?? "western";

  // ── State ─
  const [activeSection, setActiveSection] = useState<SectionType>("entry");
  const [mySubjects, setMySubjects] = useState<MySubject[]>([]);
  const [subjectsReady, setSubjectsReady] = useState(false);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [coursesReady, setCoursesReady] = useState(false);

  // Result Entry State
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<number | "">("");
  const [selectedTerm, setSelectedTerm] = useState<TermType>("FIRST TERM");
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [studentRows, setStudentRows] = useState<StudentRow[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetLoaded, setSheetLoaded] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Assignment State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignClass, setAssignClass] = useState("");
  const [assignCourse, setAssignCourse] = useState<number | "">("");
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    deadline: "",
  });
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

  // Students State
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [progressStudent, setProgressStudent] =
    useState<StudentProgress | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // ── Callbacks ──────────────────────────────────────────────────────────────
  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 5000);
    },
    [],
  );

  // ── Data Fetching ─────────────────────────────────────────────────────────
  useEffect(() => {
    api
      .get("/subject-assignments/my_students/")
      .then((res) => {
        setMySubjects(res.data ?? []);
        setSubjectsReady(true);
      })
      .catch(() => setSubjectsReady(true));
  }, []);

  useEffect(() => {
    api
      .get("/courses/", { params: { department: dept, page_size: 500 } })
      .then((res) => {
        setAllCourses(
          Array.isArray(res.data) ? res.data : (res.data?.results ?? []),
        );
        setCoursesReady(true);
      })
      .catch(() => setCoursesReady(true));
  }, [dept]);

  const loadAssignments = useCallback(() => {
    api
      .get("/assignments/", { params: { page_size: 200 } })
      .then((res) => {
        setAssignments(
          Array.isArray(res.data) ? res.data : (res.data?.results ?? []),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // ── Derived State ─────────────────────────────────────────────────────────
  const hasSubjectAssignments = mySubjects.length > 0;

  const myClasses = useMemo(
    () =>
      Array.from(
        new Set(
          mySubjects.flatMap((s) =>
            s.students.map((st) => st.class).filter(Boolean),
          ),
        ),
      ) as string[],
    [mySubjects],
  );

  const getCoursesForClass = useCallback(
    (className: string): Course[] => {
      if (!hasSubjectAssignments) {
        return allCourses.filter((c) => c.student_class === className);
      }

      const subjectsForClass = mySubjects
        .filter((s) => s.students.some((st) => st.class === className))
        .map((s) => s.subject);

      return allCourses.filter((c) => {
        if (c.student_class !== className) return false;
        const titleSubject = c.title
          .split("—")[0]
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_");
        const titleSubjectSpaced = c.title.split("—")[0].trim().toLowerCase();

        return subjectsForClass.some((subj) => {
          const subjNorm = subj.toLowerCase().replace(/_/g, " ");
          const subjExact = subj.toLowerCase();
          return (
            titleSubjectSpaced === subjNorm ||
            titleSubject === subjExact ||
            titleSubject === subjNorm.replace(/\s+/g, "_")
          );
        });
      });
    },
    [hasSubjectAssignments, mySubjects, allCourses],
  );

  const classOptions = hasSubjectAssignments
    ? myClasses
    : (Array.from(
        new Set(allCourses.map((c) => c.student_class).filter(Boolean)),
      ) as string[]);

  const subjectOptions = selectedClass ? getCoursesForClass(selectedClass) : [];
  const assignmentSubjects = assignClass
    ? getCoursesForClass(assignClass)
    : allCourses;

  const allMyStudents = useMemo(
    () =>
      mySubjects.flatMap((s) =>
        s.students.map((st) => ({
          ...st,
          subject_display: s.subject_display,
          subject: s.subject,
        })),
      ),
    [mySubjects],
  );

  const uniqueStudentIds = useMemo(
    () => Array.from(new Set(allMyStudents.map((s) => s.id))),
    [allMyStudents],
  );

  const filteredSubjects = useMemo(
    () =>
      mySubjects.filter((s) => {
        if (!studentSearch) return true;
        const query = studentSearch.toLowerCase();
        return (
          s.subject_display.toLowerCase().includes(query) ||
          s.students.some((st) =>
            (st.full_name ?? st.username).toLowerCase().includes(query),
          )
        );
      }),
    [mySubjects, studentSearch],
  );

  const courseName =
    allCourses.find((c) => c.id === selectedCourse)?.title ?? "";
  const classLabel = selectedClass ? (CL[selectedClass] ?? selectedClass) : "";

  // ── Score Sheet Logic ──────────────────────────────────────────────────────
  const loadScoreSheet = useCallback(async () => {
    if (!selectedCourse || !selectedClass) {
      showToast("error", "Select class and subject first");
      return;
    }

    setIsLoadingSheet(true);
    setSheetLoaded(false);
    setStudentRows([]);

    try {
      const [enrollRes, resultRes, profileRes] = await Promise.all([
        api.get("/enrollments/", {
          params: { course: selectedCourse, page_size: 200 },
        }),
        api.get("/results/", {
          params: {
            course: selectedCourse,
            term: TERM_KEY[selectedTerm],
            academic_year: selectedYear,
            page_size: 200,
          },
        }),
        api.get("/profiles/", {
          params: {
            student_class: selectedClass,
            role: "student",
            page_size: 200,
          },
        }),
      ]);

      // Properly typed API responses
      const enrollments: Array<{ student: number | { id: number } }> =
        Array.isArray(enrollRes.data)
          ? enrollRes.data
          : (enrollRes.data?.results ?? []);
      const existing: Array<any> = Array.isArray(resultRes.data)
        ? resultRes.data
        : (resultRes.data?.results ?? []);
      const profiles: Array<{
        id: number;
        student_id?: string;
        user?: {
          first_name?: string;
          last_name?: string;
          username?: string;
        };
      }> = Array.isArray(profileRes.data)
        ? profileRes.data
        : (profileRes.data?.results ?? []);

      // Build profile map with proper typing
      const profileMap: Record<number, (typeof profiles)[number]> =
        Object.fromEntries(profiles.map((p) => [p.id, p]));

      // Extract enrolled IDs with type guard
      const enrolledIds: number[] = enrollments
        .map((e) => (typeof e.student === "number" ? e.student : e.student?.id))
        .filter((id): id is number => typeof id === "number");

      // Get final student IDs with type safety
      const studentIds: number[] =
        enrolledIds.length > 0
          ? Array.from(new Set(enrolledIds)).filter(
              (id): id is number => typeof id === "number" && !!profileMap[id],
            )
          : profiles.map((p) => p.id);

      if (studentIds.length === 0) {
        showToast(
          "error",
          `No students found in ${CL[selectedClass] ?? selectedClass}`,
        );
        setIsLoadingSheet(false);
        return;
      }

      // Map to StudentRow with explicit pid type
    const rows: StudentRow[] = studentIds.map((pid: number) => {
        const p = profileMap[pid] ?? {};
        const u = p.user ?? {};
        const ex = existing.find((r: any) => r.student === pid);
        const total =
          (ex?.test1 ?? 0) +
          (ex?.test2 ?? 0) +
          (ex?.assignment ?? 0) +
          (ex?.midterm ?? 0) +
          (ex?.exam ?? 0);

        return {
          profile_id: pid,
          student_id: p.student_id ?? `#${pid}`,
          full_name:
            `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ||
            u.username ||
            `Student #${pid}`,
          test1: ex?.test1 ?? 0,
          test2: ex?.test2 ?? 0,
          assignment: ex?.assignment ?? 0,
          midterm: ex?.midterm ?? 0,
          exam: ex?.exam ?? 0,
          total: Math.round(total * 10) / 10,
          grade: ex?.grade ?? gradeOf(total),
          result_id: ex?.id ?? null,
          status: ex?.status ?? "draft",
        };
      });

      setStudentRows(rows);
      setSheetLoaded(true);
    } catch (err: any) {
      showToast("error", err?.response?.data?.detail ?? "Failed to load sheet");
    } finally {
      setIsLoadingSheet(false);
    }
  }, [selectedCourse, selectedClass, selectedTerm, selectedYear, showToast]);

  const updateScore = useCallback(
    (index: number, field: ScoreField, rawValue: string) => {
      const value =
        rawValue === ""
          ? 0
          : Math.min(SCHEME_MAX[field], Math.max(0, Number(rawValue)));

      setStudentRows((prev) => {
        const next = [...prev];
        const row = { ...next[index], [field]: value };
        const total =
          row.test1 + row.test2 + row.assignment + row.midterm + row.exam;
        row.total = Math.round(total * 10) / 10;
        row.grade = gradeOf(total);
        next[index] = row;
        return next;
      });

      setLastSavedAt(null);

      if (autoSave) {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => saveResults(false), 2000);
      }
    },
    [autoSave],
  );

  const saveResults = useCallback(
    async (showNotification = true) => {
      if (!selectedCourse || studentRows.length === 0) return;

      setIsSaving(true);
      try {
        await api.post("/results/bulk_entry/", {
          course: selectedCourse,
          term: TERM_KEY[selectedTerm],
          academic_year: selectedYear,
          results: studentRows.map((r) => ({
            student: r.profile_id,
            test1: r.test1,
            test2: r.test2,
            assignment: r.assignment,
            midterm: r.midterm,
            exam: r.exam,
          })),
        });

        setLastSavedAt(new Date());
        if (showNotification)
          showToast("success", "Results saved successfully");
      } catch (err: any) {
        if (showNotification)
          showToast("error", err?.response?.data?.detail ?? "Save failed");
      } finally {
        setIsSaving(false);
      }
    },
    [selectedCourse, studentRows, selectedTerm, selectedYear, showToast],
  );

  const submitResults = useCallback(async () => {
    await saveResults(false);
    try {
      const res = await api.get("/results/", {
        params: {
          course: selectedCourse,
          term: TERM_KEY[selectedTerm],
          academic_year: selectedYear,
          page_size: 200,
        },
      });

      const all = Array.isArray(res.data)
        ? res.data
        : (res.data?.results ?? []);
      await Promise.allSettled(
        all
          .filter((x: any) => x.status === "draft")
          .map((x: any) => api.post(`/results/${x.id}/submit/`)),
      );

      showToast("success", "Submitted for review");
      loadScoreSheet();
    } catch {
      showToast("error", "Submit failed");
    }
  }, [
    selectedCourse,
    selectedTerm,
    selectedYear,
    saveResults,
    loadScoreSheet,
    showToast,
  ]);

  // ── Assignment Logic ──────────────────────────────────────────────────────
  const createAssignment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!assignCourse) {
        showToast("error", "Select a subject");
        return;
      }

      setIsSubmittingAssignment(true);
      try {
        await api.post("/assignments/", {
          ...newAssignment,
          deadline: newAssignment.deadline + "T23:59",
          course: Number(assignCourse),
        });

        showToast("success", "Assignment created");
        setNewAssignment({ title: "", description: "", deadline: "" });
        setAssignClass("");
        setAssignCourse("");
        setShowAssignmentForm(false);
        loadAssignments();
      } catch (err: any) {
        const error = err?.response?.data;
        showToast(
          "error",
          error?.detail ??
            error?.deadline?.[0] ??
            error?.course?.[0] ??
            error?.title?.[0] ??
            "Failed to create assignment",
        );
      } finally {
        setIsSubmittingAssignment(false);
      }
    },
    [assignCourse, newAssignment, loadAssignments, showToast],
  );

  // ── Student Progress Logic ────────────────────────────────────────────────
  const loadStudentProgress = useCallback(
    async (
      studentId: number,
      name: string,
      studentIdStr: string,
      cls: string,
    ) => {
      setIsLoadingProgress(true);
      setProgressStudent({
        student_name: name,
        student_id: studentIdStr,
        student_class: cls,
        results: [],
      });

      try {
        const res = await api.get("/results/", {
          params: { student: studentId, page_size: 200 },
        });

        const data = Array.isArray(res.data)
          ? res.data
          : (res.data?.results ?? []);
        setProgressStudent({
          student_name: name,
          student_id: studentIdStr,
          student_class: cls,
          results: data.map((res: any) => ({
            subject: res.course_title ?? `Course #${res.course}`,
            total: res.total ?? 0,
            grade: res.grade ?? "",
            ca_total: res.ca_total ?? 0,
            exam: res.exam ?? 0,
            status: res.status ?? "draft",
          })),
        });
      } catch {
        showToast("error", "Failed to load progress");
      } finally {
        setIsLoadingProgress(false);
      }
    },
    [showToast],
  );

  // ── Keyboard Shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSection === "entry" && sheetLoaded) {
        if ((e.metaKey || e.ctrlKey) && e.key === "s") {
          e.preventDefault();
          saveResults(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSection, sheetLoaded, saveResults]);

  // ── Tabs Configuration ────────────────────────────────────────────────────
  const tabs: TabConfig[] = [
    { id: "entry", label: "Result Entry", icon: FileText },
    { id: "assignments", label: "Assignments", icon: BookOpen },
    {
      id: "students",
      label: "My Students",
      icon: Users,
      count: uniqueStudentIds.length,
    },
  ];

  // ── Render 
  return (
    <TeacherLayout
      activeSection={activeSection}
      onSectionChange={(s) => setActiveSection(s as SectionType)}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {typeof tab.count === "number" && tab.count > 0 && (
                    <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            {coursesReady ? (
              <Badge variant="success">
                <CheckCircle2 className="w-3 h-3" />
                {allCourses.length} courses
              </Badge>
            ) : (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* RESULT ENTRY SECTION                                               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeSection === "entry" && (
          <>
            {/* Filters Card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">
                      Result Entry
                    </h2>
                    <p className="text-blue-100 text-sm">
                      {hasSubjectAssignments
                        ? `Managing ${mySubjects.length} subjects across ${myClasses.length} classes`
                        : "Select criteria to load score sheet"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Select
                    label="Class *"
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedCourse("");
                      setSheetLoaded(false);
                      setStudentRows([]);
                    }}
                  >
                    <option value="">Select class</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>
                        {CL[c] ?? c}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Subject *"
                    value={selectedCourse}
                    onChange={(e) => {
                      setSelectedCourse(
                        e.target.value ? Number(e.target.value) : "",
                      );
                      setSheetLoaded(false);
                      setStudentRows([]);
                    }}
                    disabled={!selectedClass}
                    helperText={
                      hasSubjectAssignments && selectedClass
                        ? `${subjectOptions.length} subjects available`
                        : undefined
                    }
                  >
                    <option value="">
                      {selectedClass ? "Select subject" : "Select class first"}
                    </option>
                    {subjectOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Term *"
                    value={selectedTerm}
                    onChange={(e) => {
                      setSelectedTerm(e.target.value as TermType);
                      setSheetLoaded(false);
                    }}
                  >
                    {TERMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Session *"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSheetLoaded(false);
                    }}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <Button
                    onClick={loadScoreSheet}
                    isLoading={isLoadingSheet}
                    disabled={!selectedCourse || !selectedClass}
                  >
                    {!isLoadingSheet && <TrendingUp className="w-4 h-4" />}
                    {isLoadingSheet ? "Loading..." : "Load Score Sheet"}
                  </Button>

                  {sheetLoaded && (
                    <div className="flex items-center gap-4">
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3" />
                        {studentRows.length} students
                      </Badge>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          onClick={() => setAutoSave((v) => !v)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            autoSave
                              ? "bg-emerald-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              autoSave ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                          Autosave
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Score Sheet Table */}
            {sheetLoaded && (
              <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/30">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {courseName}
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-600 dark:text-gray-400 font-normal">
                        {classLabel}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedTerm} · {selectedYear}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveResults(true)}
                      isLoading={isSaving}
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={submitResults}
                      disabled={isSaving}
                    >
                      <Upload className="w-4 h-4" />
                      Submit
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-900 dark:bg-gray-950 text-white">
                        <th className="px-4 py-3 text-left font-semibold w-12">
                          #
                        </th>
                        <th className="px-4 py-3 text-left font-semibold min-w-[100px]">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left font-semibold min-w-[180px]">
                          Student Name
                        </th>
                        {(Object.keys(SCHEME_MAX) as ScoreField[]).map(
                          (key) => (
                            <th
                              key={key}
                              className="px-2 py-3 text-center font-semibold w-20"
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase tracking-wider opacity-70">
                                  {key.replace(/(\d)/, " $1")}
                                </span>
                                <span className="text-xs font-bold">
                                  /{SCHEME_MAX[key]}
                                </span>
                              </div>
                            </th>
                          ),
                        )}
                        <th className="px-2 py-3 text-center font-semibold w-20">
                          Total
                        </th>
                        <th className="px-2 py-3 text-center font-semibold w-16">
                          Grade
                        </th>
                        <th className="px-4 py-3 text-center font-semibold w-24">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {studentRows.map((row, index) => (
                        <motion.tr
                          key={row.profile_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={
                            index % 2 === 0
                              ? "bg-white dark:bg-gray-900"
                              : "bg-gray-50/50 dark:bg-gray-800/20"
                          }
                        >
                          <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                            {row.student_id}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {row.full_name}
                          </td>
                          {(Object.keys(SCHEME_MAX) as ScoreField[]).map(
                            (field) => (
                              <td key={field} className="px-1 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  max={SCHEME_MAX[field]}
                                  value={row[field] === 0 ? "" : row[field]}
                                  placeholder="—"
                                  onChange={(e) =>
                                    updateScore(index, field, e.target.value)
                                  }
                                  className={`w-full px-2 py-1.5 text-center text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all
                                    ${
                                      row[field] > 0 &&
                                      row[field] < SCHEME_MAX[field] * 0.4
                                        ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100"
                                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    }`}
                                />
                              </td>
                            ),
                          )}
                          <td className="px-2 py-3 text-center">
                            <span
                              className={`text-lg font-bold ${
                                row.total > 0
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-300"
                              }`}
                            >
                              {row.total > 0 ? row.total : "—"}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            {row.grade && (
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold border ${
                                  GRADE_STYLES[row.grade]?.bg
                                } ${GRADE_STYLES[row.grade]?.text} ${
                                  GRADE_STYLES[row.grade]?.border
                                }`}
                              >
                                {row.grade}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                STATUS_STYLES[row.status]?.bg
                              } ${STATUS_STYLES[row.status]?.text}`}
                            >
                              {React.createElement(
                                STATUS_STYLES[row.status]?.icon || FileText,
                                { className: "w-3 h-3" },
                              )}
                              {row.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {lastSavedAt && (
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 flex items-center justify-between">
                    <span>Last saved {lastSavedAt.toLocaleTimeString()}</span>
                    <span className="text-gray-400">Ctrl+S to save</span>
                  </div>
                )}
              </Card>
            )}

            {/* Empty State */}
            {!sheetLoaded && !isLoadingSheet && (
              <Card>
                <EmptyState
                  icon={FileText}
                  title="No score sheet loaded"
                  description={
                    !coursesReady
                      ? "Loading courses..."
                      : classOptions.length === 0
                        ? "No classes assigned. Contact admin."
                        : "Select class, subject, term and session to begin"
                  }
                />
              </Card>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ASSIGNMENTS SECTION                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeSection === "assignments" && (
          <div className="space-y-6">
            <SectionHeader
              title="Assignments"
              subtitle={`${assignments.length} total assignments`}
              action={
                <Button
                  onClick={() => setShowAssignmentForm((v) => !v)}
                  variant={showAssignmentForm ? "secondary" : "primary"}
                >
                  {showAssignmentForm ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {showAssignmentForm ? "Cancel" : "New Assignment"}
                </Button>
              }
            />

            {/* Assignment Form */}
            <AnimatePresence>
              {showAssignmentForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Create New Assignment
                    </h3>
                    <form onSubmit={createAssignment} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Class *"
                          value={assignClass}
                          onChange={(e) => {
                            setAssignClass(e.target.value);
                            setAssignCourse("");
                          }}
                        >
                          <option value="">Select class</option>
                          {classOptions.map((c) => (
                            <option key={c} value={c}>
                              {CL[c] ?? c}
                            </option>
                          ))}
                        </Select>

                        <Select
                          label="Subject *"
                          value={assignCourse}
                          onChange={(e) =>
                            setAssignCourse(
                              e.target.value ? Number(e.target.value) : "",
                            )
                          }
                          disabled={!assignClass}
                        >
                          <option value="">Select subject</option>
                          {assignmentSubjects.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <input
                        type="text"
                        placeholder="Assignment title *"
                        required
                        value={newAssignment.title}
                        onChange={(e) =>
                          setNewAssignment((p) => ({
                            ...p,
                            title: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />

                      <textarea
                        placeholder="Description (optional)"
                        rows={3}
                        value={newAssignment.description}
                        onChange={(e) =>
                          setNewAssignment((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />

                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Due Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={newAssignment.deadline}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            setNewAssignment((p) => ({
                              ...p,
                              deadline: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          isLoading={isSubmittingAssignment}
                          disabled={!assignCourse}
                        >
                          Create Assignment
                        </Button>
                      </div>
                    </form>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Assignments List */}
            {assignments.length === 0 ? (
              <Card>
                <EmptyState
                  icon={BookOpen}
                  title="No assignments yet"
                  description="Create your first assignment to get started"
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((assignment) => (
                  <motion.div
                    key={assignment.id}
                    whileHover={{ y: -2 }}
                    className="group"
                  >
                    <Card className="p-5 hover:shadow-md transition-shadow h-full">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {assignment.title}
                          </h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
                            {assignment.course_title ??
                              `Course #${assignment.course}`}
                          </p>
                          {assignment.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                        {assignment.deadline && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold shrink-0">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(assignment.deadline)}
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MY STUDENTS SECTION                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeSection === "students" && (
          <div className="space-y-6">
            <SectionHeader
              title="My Students"
              subtitle={`${uniqueStudentIds.length} students across ${mySubjects.length} subjects`}
              action={
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              }
            />

            {!subjectsReady ? (
              <Card className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </Card>
            ) : mySubjects.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Users}
                  title="No students assigned"
                  description="Contact admin to set up subject assignments"
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredSubjects.map((subject) => {
                  const isOpen = expandedSubject === subject.subject;

                  return (
                    <Card key={subject.subject} className="overflow-hidden">
                      <button
                        onClick={() =>
                          setExpandedSubject(isOpen ? null : subject.subject)
                        }
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            {subject.subject_display[0]}
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {subject.subject_display}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {subject.students.length} students
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="info">
                            {subject.students.length}
                          </Badge>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-gray-100 dark:border-gray-800"
                          >
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                              {subject.students.map((student, index) => {
                                const name =
                                  student.full_name ?? student.username;
                                const displayClass = student.class_section
                                  ? `${CL[student.class ?? ""] ?? student.class} (${student.class_section})`
                                  : (CL[student.class ?? ""] ??
                                      student.class) ||
                                    "N/A";

                                return (
                                  <div
                                    key={student.id}
                                    className={`flex items-center justify-between px-5 py-3 ${
                                      index % 2 === 0
                                        ? "bg-white dark:bg-gray-900"
                                        : "bg-gray-50/50 dark:bg-gray-800/20"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                        {getInitial(name)}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                          {name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          {student.student_id && (
                                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                              {student.student_id}
                                            </span>
                                          )}
                                          {displayClass && (
                                            <Badge
                                              variant="neutral"
                                              className="text-[10px] py-0"
                                            >
                                              {displayClass}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        loadStudentProgress(
                                          student.id,
                                          name,
                                          student.student_id ??
                                            `#${student.id}`,
                                          student.class ?? "",
                                        )
                                      }
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      View
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* STUDENT PROGRESS MODAL                                              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {progressStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setProgressStudent(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                    {getInitial(progressStudent.student_name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {progressStudent.student_name}
                    </h3>
                    <p className="text-indigo-100 text-sm">
                      {progressStudent.student_id} ·{" "}
                      {CL[progressStudent.student_class] ??
                        progressStudent.student_class}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setProgressStudent(null)}
                  className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingProgress ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : progressStudent.results.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="No results yet"
                    description="Results will appear here once published"
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Average Summary */}
                    {(() => {
                      const published = progressStudent.results.filter(
                        (r) => r.status === "published",
                      );
                      if (published.length === 0) return null;
                      const avg =
                        published.reduce((sum, r) => sum + r.total, 0) /
                        published.length;

                      return (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 flex items-center justify-between border border-blue-100 dark:border-blue-800">
                          <div>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              Overall Average
                            </p>
                            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                              {published.length} subjects
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-black text-blue-700 dark:text-blue-300">
                              {avg.toFixed(1)}
                            </p>
                            <p className="text-xs text-blue-500 font-medium">
                              /100
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Results List */}
                    <div className="space-y-2">
                      {progressStudent.results.map((result, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-xl ${
                            index % 2 === 0
                              ? "bg-gray-50 dark:bg-gray-800/50"
                              : "bg-white dark:bg-gray-900"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                              {result.subject}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">
                                CA: {result.ca_total}/40
                              </span>
                              <span className="text-xs text-gray-500">
                                Exam: {result.exam}/60
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  STATUS_STYLES[result.status]?.bg
                                } ${STATUS_STYLES[result.status]?.text}`}
                              >
                                {result.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                              {result.total}
                            </span>
                            {result.grade && (
                              <span
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold border ${
                                  GRADE_STYLES[result.grade]?.bg
                                } ${GRADE_STYLES[result.grade]?.text} ${
                                  GRADE_STYLES[result.grade]?.border
                                }`}
                              >
                                {result.grade}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TeacherLayout>
  );
};

export default SubjectInstructorDashboard;
