import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import BackButton from "../components/BackButton";
import { getUserData } from "../utils/authUtils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}
interface UserProfile {
  id: number;
  user: ApiUser;
  role: string;
  department: string;
  student_class?: string;
  class_section?: string;
  teacher_type?: string;
  instructor_type?: string;
  stream?: string;
  student_id?: string;
  bio?: string;
  phone?: string;
  address?: string;
  parent_email?: string;
  is_archived: boolean;
  created_at: string;
}
interface Stats {
  total: number;
  students: number;
  teachers: number;
  admins: number;
  parents: number;
  non_teaching: number;
  western: number;
  arabic: number;
  programming: number;
}
interface FormData {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department: string;
  student_class: string;
  class_section: string;
  teacher_type: string;
  teacher_class: string;
  teacher_subjects: string[];
  bio: string;
  phone: string;
  address: string;
  parent_email: string;
}

const BLANK_FORM: FormData = {
  username: "",
  password: "",
  first_name: "",
  last_name: "",
  email: "",
  role: "student",
  department: "western",
  student_class: "",
  class_section: "",
  teacher_type: "",
  teacher_class: "",
  teacher_subjects: [],
  bio: "",
  phone: "",
  address: "",
  parent_email: "",
};

// ─── Role badge colours ───────────────────────────────────────────────────────
const ROLE_BADGE: Record<string, string> = {
  super_admin: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  admin:
    "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  school_admin:
    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  teacher: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  non_teaching:
    "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300",
  student:
    "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  parent: "bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300",
  visitor: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
};

const SUPER_ONLY_ROLES = ["admin", "super_admin"];

// ─── Action button ────────────────────────────────────────────────────────────
const BTN_COLORS: Record<string, string> = {
  blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40",
  amber:
    "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40",
  orange:
    "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40",
  red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40",
  indigo:
    "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40",
};
const Btn: React.FC<{
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ color, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${BTN_COLORS[color] ?? BTN_COLORS.blue}`}
  >
    {children}
  </button>
);

// ─── Parse DRF errors ─────────────────────────────────────────────────────────
const parseError = (err: any): string => {
  const data = err?.response?.data;
  if (!data) return err?.message ?? "Unknown error";
  if (typeof data === "string") return data;
  if (data.detail) return String(data.detail);
  const msgs: string[] = [];
  Object.entries(data).forEach(([field, val]) => {
    const list = Array.isArray(val) ? val : [val];
    list.forEach((m) => msgs.push(`${field}: ${m}`));
  });
  return msgs.join(" · ") || "Request failed";
};

const inputCls = `w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
  rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white
  focus:outline-none focus:ring-2 focus:ring-teal-500
  disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400`;
const labelCls =
  "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1";

const SUBJECT_OPTIONS: [string, string][] = [
  ["english_language", "English Language"],
  ["mathematics", "Mathematics"],
  ["basic_science", "Basic Science"],
  ["basic_technology", "Basic Technology"],
  ["social_studies", "Social Studies"],
  ["civic_education", "Civic Education"],
  ["agricultural_science", "Agricultural Science"],
  ["computer_studies_ict", "Computer Studies / ICT"],
  ["physical_health_education", "Physical & Health Education"],
  ["cultural_creative_arts", "Cultural & Creative Arts"],
  ["french", "French"],
  ["arabic", "Arabic"],
  ["yoruba", "Yoruba"],
  ["religious_studies", "Religious Studies"],
  ["business_studies", "Business Studies"],
  ["biology", "Biology"],
  ["chemistry", "Chemistry"],
  ["physics", "Physics"],
  ["further_mathematics", "Further Mathematics"],
  ["geography", "Geography"],
  ["literature_in_english", "Literature in English"],
  ["government", "Government"],
  ["financial_accounting", "Financial Accounting"],
  ["commerce", "Commerce"],
  ["economics", "Economics"],
  ["marketing", "Marketing"],
  ["digital_technologies", "Digital Technologies"],
];

// ─── Component ────────────────────────────────────────────────────────────────
const ManageUsers: React.FC = () => {
  const callerData = getUserData();
  const callerRole = callerData?.role ?? "";
  const callerDept = callerData?.department ?? "western";
  const isSuperAdmin = callerRole === "super_admin";
  const isSchoolAdmin = callerRole === "school_admin";

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(BLANK_FORM);
  const [classChoices, setClassChoices] = useState<
    { value: string; label: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [subjectModal, setSubjectModal] = useState<UserProfile | null>(null);
  const [subjectAssigns, setSubjectAssigns] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");

  const notify = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page_size: "200" };
      if (filterRole !== "all") params.role = filterRole;
      if (filterDept !== "all") params.department = filterDept;
      if (search.trim()) params.search = search.trim();
      if (showArchived) params.archived = "true";
      const [usersRes, statsRes] = await Promise.allSettled([
        api.get("/admin/users/", { params }),
        api.get("/admin/users/stats/"),
      ]);
      if (usersRes.status === "fulfilled") {
        const d = usersRes.value.data;
        setProfiles(Array.isArray(d) ? d : (d?.results ?? []));
      }
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
    } catch {
      notify(false, "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filterRole, filterDept, search, showArchived]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Class choices ──────────────────────────────────────────────────────────
  useEffect(() => {
    const dept = form.department || callerDept;
    api
      .get(`/class-choices/?department=${dept}`)
      .then((res) => {
        const cls = res.data.classes ?? [];
        setClassChoices(cls);
        if (
          form.role === "student" &&
          !cls.find((c: any) => c.value === form.student_class)
        )
          setForm((f) => ({ ...f, student_class: cls[0]?.value ?? "" }));
      })
      .catch(() => {});
  }, [form.department, form.role, callerDept]);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const handleInput = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "department" && isSchoolAdmin) return;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...BLANK_FORM, department: callerDept, student_class: "" });
    setShowForm(true);
  };

  const openEdit = (p: UserProfile) => {
    setEditingId(p.id);
    setForm({
      username: p.user.username,
      password: "",
      first_name: p.user.first_name ?? "",
      last_name: p.user.last_name ?? "",
      email: p.user.email ?? "",
      role: p.role,
      department: p.department ?? "western",
      student_class: p.student_class ?? "",
      class_section: p.class_section ?? "",
      teacher_class:
        p.role === "teacher" && p.teacher_type === "class"
          ? (p.student_class ?? "")
          : "",
      teacher_subjects: [],
      teacher_type: p.teacher_type ?? p.instructor_type ?? "",
      bio: p.bio ?? "",
      phone: p.phone ?? "",
      address: p.address ?? "",
      parent_email: p.parent_email ?? "",
    });
    setShowForm(true);
  };

  const openSubjectAssign = async (p: UserProfile) => {
    setSubjectModal(p);
    try {
      const [assignRes] = await Promise.all([
        api.get("/subject-assignments/", {
          params: { teacher: p.user.id, page_size: 200 },
        }),
      ]);
      const assigns = Array.isArray(assignRes.data)
        ? assignRes.data
        : (assignRes.data?.results ?? []);
      setSubjectAssigns(assigns);
    } catch {
      notify(false, "Failed to load assignments");
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/admin/users/${editingId}/`, {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          role: form.role,
          department: form.department,
          bio: form.bio,
          phone: form.phone,
          address: form.address,
          parent_email: form.parent_email,
          student_class:
            form.role === "student"
              ? form.student_class
              : form.role === "teacher" && form.teacher_type === "class"
                ? form.teacher_class
                : "",
          class_section: form.role === "student" ? form.class_section : "",
          teacher_type: form.role === "teacher" ? form.teacher_type : "",
        });
        notify(true, "User updated successfully");
      } else {
        await api.post("/admin/users/", {
          username: form.username,
          password: form.password,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          role: form.role,
          department: form.department,
          bio: form.bio || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          parent_email: form.parent_email || undefined,
          student_class:
            form.role === "student"
              ? form.student_class
              : form.role === "teacher" && form.teacher_type === "class"
                ? form.teacher_class
                : undefined,
          teacher_type: form.role === "teacher" ? form.teacher_type : undefined,
        });
        notify(true, "User created successfully");

        // Auto-create SubjectAssignment rows for subject teachers
        if (
          form.role === "teacher" &&
          form.teacher_type === "subject" &&
          form.teacher_subjects.length > 0 &&
          form.teacher_class
        ) {
          try {
            const usersRes = await api.get("/admin/users/", {
              params: { username: form.username, page_size: 5 },
            });
            const users = usersRes.data?.results ?? usersRes.data ?? [];
            const newUser = users.find(
              (u: any) =>
                u.user?.username === form.username ||
                u.username === form.username,
            );
            if (newUser) {
              const teacherId = newUser.user?.id ?? newUser.id;
              const studentsRes = await api.get("/profiles/", {
                params: {
                  student_class: form.teacher_class,
                  role: "student",
                  page_size: 200,
                },
              });
              const students =
                studentsRes.data?.results ?? studentsRes.data ?? [];
              const assignments = students.flatMap((s: any) =>
                form.teacher_subjects.map((subj: string) => ({
                  student: s.user?.id ?? s.id,
                  teacher: teacherId,
                  subject: subj,
                })),
              );
              if (assignments.length > 0) {
                await Promise.allSettled(
                  assignments.map((a: any) =>
                    api.post("/subject-assignments/", a),
                  ),
                );
                notify(
                  true,
                  `User created + ${assignments.length} subject assignment${assignments.length !== 1 ? "s" : ""} saved`,
                );
              }
            }
          } catch {
            notify(
              false,
              "Teacher created but subject assignments could not be saved. Set manually.",
            );
          }
        }
      }
      closeForm();
      fetchUsers();
    } catch (err: any) {
      notify(false, parseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete / Archive / Password ────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.delete(`/admin/users/${target.id}/`);
      notify(true, `"${target.user.username}" permanently deleted`);
      fetchUsers();
    } catch (err: any) {
      notify(false, parseError(err));
    }
  };

  const toggleArchive = async (p: UserProfile) => {
    try {
      await api.post(
        p.is_archived
          ? `/admin/users/${p.id}/restore/`
          : `/admin/users/${p.id}/archive/`,
      );
      notify(true, p.is_archived ? "User restored" : "User archived");
      fetchUsers();
    } catch (err: any) {
      notify(false, parseError(err));
    }
  };

  const resetPassword = async (p: UserProfile) => {
    const pwd = window.prompt(
      `Set new password for "@${p.user.username}"\n(minimum 6 characters):`,
    );
    if (!pwd) return;
    if (pwd.length < 6) {
      notify(false, "Password must be at least 6 characters");
      return;
    }
    try {
      await api.post(`/admin/users/${p.id}/set_password/`, { password: pwd });
      notify(true, `Password updated for @${p.user.username}`);
    } catch (err: any) {
      notify(false, parseError(err));
    }
  };

  const syncGroups = async () => {
    if (!selected.length) return;
    try {
      const userIds = profiles
        .filter((p) => selected.includes(p.id))
        .map((p) => p.user.id);
      const res = await api.post("/admin/sync-groups/", { user_ids: userIds });
      notify(true, `Synced ${res.data.processed.length} users`);
      setSelected([]);
    } catch (err: any) {
      notify(false, parseError(err));
    }
  };

  const toggleSelect = (id: number) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  const allSelected =
    profiles.length > 0 && selected.length === profiles.length;
  const fullName = (u: ApiUser) =>
    `${u.first_name} ${u.last_name}`.trim() || u.username;
  const initial = (u: ApiUser) =>
    (u.first_name?.[0] ?? u.username[0]).toUpperCase();
  const canEdit = (p: UserProfile) =>
    isSuperAdmin || !SUPER_ONLY_ROLES.includes(p.role);
  const canDelete = (p: UserProfile) =>
    isSuperAdmin || !SUPER_ONLY_ROLES.includes(p.role);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="mb-2">
              <BackButton />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              👥 User Management
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isSchoolAdmin
                ? "Managing your department's users"
                : "Full CRUD — all changes validated server-side"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:mt-8">
            {selected.length > 0 && (
              <button
                onClick={syncGroups}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
              >
                🔄 Sync ({selected.length})
              </button>
            )}
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors
                ${
                  showArchived
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                }`}
            >
              📦 {showArchived ? "Hide Archived" : "Archived"}
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
            >
              ➕ Add User
            </button>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`p-3.5 rounded-xl text-sm font-medium border
                ${
                  toast.ok
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200"
                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200"
                }`}
            >
              {toast.ok ? "✅" : "❌"} {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total",
                value: stats.total,
                icon: "👥",
                bg: "bg-slate-100 dark:bg-slate-800",
                text: "text-slate-700 dark:text-slate-200",
              },
              {
                label: "Students",
                value: stats.students,
                icon: "🎓",
                bg: "bg-green-50 dark:bg-green-900/20",
                text: "text-green-700 dark:text-green-300",
              },
              {
                label: "Teachers",
                value: stats.teachers,
                icon: "👨‍🏫",
                bg: "bg-blue-50 dark:bg-blue-900/20",
                text: "text-blue-700 dark:text-blue-300",
              },
              {
                label: "Admins",
                value: stats.admins,
                icon: "⚙️",
                bg: "bg-red-50 dark:bg-red-900/20",
                text: "text-red-700 dark:text-red-300",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}
              >
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className={`text-2xl font-bold leading-none ${s.text}`}>
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍  Search name, username, email, student ID…"
            className={`${inputCls} flex-1`}
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={inputCls + " sm:w-40"}
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="non_teaching">Non-Teaching Staff</option>
            <option value="school_admin">School Admins</option>
            <option value="admin">Admins</option>
            <option value="parent">Parents</option>
            <option value="visitor">Visitors</option>
          </select>
          {!isSchoolAdmin && (
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className={inputCls + " sm:w-40"}
            >
              <option value="all">All Depts</option>
              <option value="western">Western</option>
              <option value="arabic">Arabic</option>
              <option value="programming">Programming</option>
            </select>
          )}
        </div>

        {/* User table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-9 h-9 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-20 text-gray-400 dark:text-gray-500">
              <p className="text-3xl mb-2">👤</p>
              <p className="text-sm">No users match your filters</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked ? profiles.map((p) => p.id) : [],
                            )
                          }
                          className="w-4 h-4 accent-teal-600 cursor-pointer"
                        />
                      </th>
                      {[
                        "Name & Email",
                        "Username",
                        "Role",
                        "Dept",
                        "Class / Type",
                        "ID",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {profiles.map((p) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${p.is_archived ? "opacity-40" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.includes(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="w-4 h-4 accent-teal-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {initial(p.user)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {fullName(p.user)}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {p.user.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          @{p.user.username}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[p.role] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {p.role.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">
                          {p.department ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                          {p.role === "teacher" ? (
                            p.teacher_type === "class" ? (
                              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                                Class Teacher{" "}
                                {p.student_class
                                  ? `— ${p.student_class.toUpperCase().replace(/_/g, " ")}`
                                  : "(no class)"}
                              </span>
                            ) : (
                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                                Subject Teacher
                              </span>
                            )
                          ) : p.student_class ? (
                            p.class_section ? (
                              `${p.student_class} (${p.class_section})`
                            ) : (
                              p.student_class
                            )
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">
                          {p.student_id ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-nowrap">
                            {canEdit(p) && (
                              <Btn color="blue" onClick={() => openEdit(p)}>
                                ✏️
                              </Btn>
                            )}
                            {p.role === "teacher" &&
                              p.teacher_type !== "class" && (
                                <Btn
                                  color="indigo"
                                  onClick={() => openSubjectAssign(p)}
                                >
                                  📚
                                </Btn>
                              )}
                            <Btn color="amber" onClick={() => resetPassword(p)}>
                              🔑
                            </Btn>
                            <Btn
                              color="orange"
                              onClick={() => toggleArchive(p)}
                            >
                              {p.is_archived ? "♻️" : "📦"}
                            </Btn>
                            {canDelete(p) && (
                              <Btn
                                color="red"
                                onClick={() => setDeleteTarget(p)}
                              >
                                🗑️
                              </Btn>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y dark:divide-gray-700">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 ${p.is_archived ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="mt-1 w-4 h-4 accent-teal-600 shrink-0"
                      />
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                        {initial(p.user)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {fullName(p.user)}
                          </p>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[p.role] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {p.role.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          @{p.user.username}
                          {p.department && ` · ${p.department}`}
                          {p.student_class && ` · ${p.student_class}`}
                        </p>
                        {p.user.email && (
                          <p className="text-xs text-gray-400 truncate">
                            {p.user.email}
                          </p>
                        )}
                        <div className="flex gap-1.5 mt-2.5 flex-wrap">
                          {canEdit(p) && (
                            <Btn color="blue" onClick={() => openEdit(p)}>
                              ✏️ Edit
                            </Btn>
                          )}
                          <Btn color="amber" onClick={() => resetPassword(p)}>
                            🔑 Pwd
                          </Btn>
                          <Btn color="orange" onClick={() => toggleArchive(p)}>
                            {p.is_archived ? "♻️ Restore" : "📦 Archive"}
                          </Btn>
                          {canDelete(p) && (
                            <Btn color="red" onClick={() => setDeleteTarget(p)}>
                              🗑️ Delete
                            </Btn>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* CREATE / EDIT MODAL */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="form-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
              onClick={closeForm}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 shrink-0">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingId ? "✏️ Edit User" : "➕ Create User"}
                  </h2>
                  <button
                    onClick={closeForm}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
                >
                  {/* Identity */}
                  <div>
                    <p className={labelCls + " mb-3"}>Identity</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>First Name</label>
                        <input
                          name="first_name"
                          value={form.first_name}
                          onChange={handleInput}
                          placeholder="Fatima"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Last Name</label>
                        <input
                          name="last_name"
                          value={form.last_name}
                          onChange={handleInput}
                          placeholder="Al-Rashid"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          Username <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="username"
                          value={form.username}
                          onChange={handleInput}
                          required
                          disabled={!!editingId}
                          placeholder="fatima123"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Email</label>
                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleInput}
                          placeholder="user@example.com"
                          className={inputCls}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>
                          {editingId ? (
                            "New Password — leave blank to keep current"
                          ) : (
                            <>
                              <>Password</>{" "}
                              <span className="text-red-500">*</span>
                            </>
                          )}
                        </label>
                        <input
                          name="password"
                          type="password"
                          value={form.password}
                          onChange={handleInput}
                          required={!editingId}
                          placeholder="Min 6 characters"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role & School */}
                  <div>
                    <p className={labelCls + " mb-3"}>Role & School</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>
                          Role <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="role"
                          value={form.role}
                          onChange={handleInput}
                          className={inputCls}
                        >
                          <option value="student">Student</option>
                          <option value="parent">Parent</option>
                          <option value="teacher">Teacher</option>
                          <option value="non_teaching">
                            Non-Teaching Staff
                          </option>
                          <option value="visitor">Visitor</option>
                          <option value="school_admin">School Admin</option>
                          {isSuperAdmin && <option value="admin">Admin</option>}
                          {isSuperAdmin && (
                            <option value="super_admin">Super Admin</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Department</label>
                        <select
                          name="department"
                          value={form.department}
                          onChange={handleInput}
                          disabled={isSchoolAdmin}
                          className={inputCls}
                        >
                          <option value="western">🌍 Western School</option>
                          <option value="arabic">🕌 Arabic School</option>
                          <option value="programming">💻 Programming</option>
                        </select>
                        {isSchoolAdmin && (
                          <p className="text-xs text-gray-400 mt-1">
                            Locked to your department
                          </p>
                        )}
                      </div>

                      {form.role === "teacher" && (
                        <>
                          {/* Teacher Type */}
                          <div>
                            <label className={labelCls}>
                              Teacher Type{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="teacher_type"
                              value={form.teacher_type}
                              onChange={handleInput}
                              className={inputCls}
                            >
                              <option value="">— Select type —</option>
                              <option value="subject">Subject Teacher</option>
                              <option value="class">
                                Class Teacher (Homeroom)
                              </option>
                            </select>
                          </div>

                          {/* Class Teacher */}
                          {form.teacher_type === "class" && (
                            <div>
                              <label className={labelCls}>
                                Homeroom Class{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={form.teacher_class}
                                onChange={(e) =>
                                  setForm((f) => ({
                                    ...f,
                                    teacher_class: e.target.value,
                                  }))
                                }
                                className={inputCls}
                              >
                                <option value="">— Select class —</option>
                                {classChoices.map((c) => (
                                  <option key={c.value} value={c.value}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                              <p className="text-[10px] text-gray-400 mt-1">
                                Responsible for all students in this class. Can
                                review results and generate report cards.
                              </p>
                            </div>
                          )}

                          {/* Subject Teacher */}
                          {form.teacher_type === "subject" && (
                            <>
                              <div>
                                <label className={labelCls}>
                                  Assigned Class{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={form.teacher_class}
                                  onChange={(e) =>
                                    setForm((f) => ({
                                      ...f,
                                      teacher_class: e.target.value,
                                    }))
                                  }
                                  className={inputCls}
                                >
                                  <option value="">— Select class —</option>
                                  {classChoices.map((c) => (
                                    <option key={c.value} value={c.value}>
                                      {c.label}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  The class this teacher teaches their
                                  subject(s) in.
                                </p>
                              </div>
                              <div className="sm:col-span-2">
                                <label className={labelCls}>
                                  Subject(s){" "}
                                  <span className="text-red-500">*</span>
                                  <span className="ml-1 text-[10px] text-gray-400 font-normal">
                                    (hold Ctrl/Cmd for multiple)
                                  </span>
                                </label>
                                <select
                                  multiple
                                  size={7}
                                  value={form.teacher_subjects}
                                  onChange={(e) => {
                                    const sel = Array.from(
                                      e.target.selectedOptions,
                                    ).map((o) => o.value);
                                    setForm((f) => ({
                                      ...f,
                                      teacher_subjects: sel,
                                    }));
                                  }}
                                  className={inputCls + " h-auto"}
                                >
                                  {SUBJECT_OPTIONS.map(([val, lbl]) => (
                                    <option key={val} value={val}>
                                      {lbl}
                                    </option>
                                  ))}
                                </select>
                                {form.teacher_subjects.length > 0 && (
                                  <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
                                    ✅ {form.teacher_subjects.length} subject
                                    {form.teacher_subjects.length !== 1
                                      ? "s"
                                      : ""}{" "}
                                    selected: {form.teacher_subjects.join(", ")}
                                  </p>
                                )}
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  Students in the selected class will be
                                  assigned to this teacher for these subjects.
                                </p>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {form.role === "student" && (
                        <div>
                          <label className={labelCls}>Class</label>
                          <select
                            name="student_class"
                            value={form.student_class}
                            onChange={handleInput}
                            className={inputCls}
                          >
                            {classChoices.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {form.role === "student" && (
                        <div>
                          <label className={labelCls}>
                            Section{" "}
                            <span className="ml-1 text-[10px] text-gray-400 font-normal">
                              (optional)
                            </span>
                          </label>
                          <input
                            name="class_section"
                            value={form.class_section}
                            onChange={handleInput}
                            placeholder="e.g. A  or  leave blank"
                            maxLength={10}
                            className={inputCls}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">
                            Sections are organisational only. Same subjects for
                            all sections of a class.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional info */}
                  <div>
                    <p className={labelCls + " mb-3"}>Additional Info</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Phone</label>
                        <input
                          name="phone"
                          value={form.phone}
                          onChange={handleInput}
                          placeholder="+234…"
                          className={inputCls}
                        />
                      </div>
                      {form.role === "student" && (
                        <div>
                          <label className={labelCls}>Parent Email</label>
                          <input
                            name="parent_email"
                            type="email"
                            value={form.parent_email}
                            onChange={handleInput}
                            placeholder="parent@example.com"
                            className={inputCls}
                          />
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Address</label>
                        <textarea
                          name="address"
                          value={form.address}
                          onChange={handleInput}
                          rows={2}
                          placeholder="Street, City…"
                          className={inputCls + " resize-none"}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Bio</label>
                        <textarea
                          name="bio"
                          value={form.bio}
                          onChange={handleInput}
                          rows={2}
                          placeholder="Short bio…"
                          className={inputCls + " resize-none"}
                        />
                      </div>
                    </div>
                  </div>
                </form>

                <div className="flex gap-3 px-6 py-4 border-t dark:border-gray-700 shrink-0">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit as any}
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white transition-colors"
                  >
                    {submitting
                      ? "Saving…"
                      : editingId
                        ? "💾 Save Changes"
                        : "✨ Create User"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DELETE CONFIRM MODAL */}
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              key="delete-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setDeleteTarget(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center"
              >
                <div className="text-5xl mb-3">⚠️</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Delete User?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Permanently delete{" "}
                  <strong className="text-gray-900 dark:text-white">
                    @{deleteTarget.user.username}
                  </strong>{" "}
                  and all their data?{" "}
                  <span className="text-red-500 font-medium">
                    This cannot be undone.
                  </span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    🗑️ Delete Forever
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SUBJECT ASSIGNMENT MODAL */}
        <AnimatePresence>
          {subjectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setSubjectModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
                  <div>
                    <h2 className="font-black text-gray-900 dark:text-white">
                      📚 Subject Assignments
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {subjectModal.user.first_name}{" "}
                      {subjectModal.user.last_name} · {subjectModal.department}
                    </p>
                  </div>
                  <button
                    onClick={() => setSubjectModal(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                        {subjectAssigns.length} subject
                        {subjectAssigns.length !== 1 ? "s" : ""} assigned
                      </p>
                      <p className="text-xs text-indigo-500 dark:text-indigo-400">
                        Across{" "}
                        {
                          Array.from(
                            new Set(
                              subjectAssigns
                                .map((a: any) => a.student_class)
                                .filter(Boolean),
                            ),
                          ).length
                        }{" "}
                        class(es)
                      </p>
                    </div>
                  </div>

                  {subjectAssigns.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                        Current Assignments
                      </p>
                      {Array.from(
                        new Set(
                          subjectAssigns.map(
                            (a: any) => a.subject ?? a.course_title ?? "",
                          ),
                        ),
                      ).map((subj: any) => (
                        <div
                          key={subj}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <span className="text-green-500 text-sm">✓</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {subj}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
                      🔧 To reassign subjects
                    </p>
                    <div className="space-y-2 text-xs text-blue-600 dark:text-blue-400">
                      <p>Run the fix command for this teacher:</p>
                      <code className="block bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded font-mono text-[11px]">
                        python manage.py fix_ibrahim_assignments --username{" "}
                        {subjectModal.user.username} --class jss2 --subjects
                        mathematics english_language
                      </code>
                      <p className="mt-2">
                        Or re-onboard via Edit → change subjects and class.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3 border-t dark:border-gray-700">
                  <button
                    onClick={() => setSubjectModal(null)}
                    className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ManageUsers;
