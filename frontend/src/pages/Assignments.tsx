// frontend/src/pages/Assignments.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Role-aware assignments page:
//   Teacher (class/subject) — create assignments, view submissions, grade them
//   Student                 — view assignments, submit work, see grades
//   Admin / school_admin    — view all assignments across their dept
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../api";
import {
  getUserData,
  isAdmin as userIsAdmin,
  isTeacher as userIsTeacher,
  isStudent as userIsStudent,
} from "../utils/authUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  X,
  File,
  Calendar,
  BookOpen,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Course {
  id: number;
  title: string;
  student_class?: string;
  department?: string;
}

interface Assignment {
  id: number;
  title: string;
  description?: string;
  course: number;
  course_title?: string;
  course_department?: string;
  student_class?: string;
  deadline: string;
  total_marks: number;
  created_by_name?: string;
  submission_count?: number;
  my_submission?: Submission | null;
}

interface Submission {
  id: number;
  assignment: number;
  assignment_title?: string;
  student: number;
  student_name?: string;
  student_id?: string;
  file?: string;
  text_response?: string;
  score?: number | null;
  feedback?: string;
  status: "submitted" | "graded" | "late";
  submitted_at: string;
  graded_at?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const daysLeft = (d: string) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
const extract = (r: PromiseSettledResult<any>) =>
  r.status === "fulfilled"
    ? Array.isArray(r.value.data)
      ? r.value.data
      : (r.value.data?.results ?? [])
    : [];

const SCORE_COLOR = (score: number, max: number) => {
  const pct = (score / max) * 100;
  if (pct >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  submitted: {
    label: "Submitted",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  graded: {
    label: "Graded",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  late: {
    label: "Late",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
};

// ── Shared Components ─────────────────────────────────────────────────────────
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  sub?: string;
}> = ({ icon, title, sub }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
      {title}
    </h3>
    {sub && (
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{sub}</p>
    )}
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}> = ({ label, value, icon, color = "blue" }) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300",
    amber:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300",
    rose: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300",
  };
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${colorMap[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
};

const inputCls =
  "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-colors";

// TEACHER VIEW
const TeacherView: React.FC<{ notify: (ok: boolean, msg: string) => void }> = ({
  notify,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assignments" | "submissions">(
    "assignments",
  );
  const [showCreate, setShowCreate] = useState(false);
  const [gradingId, setGradingId] = useState<number | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: "", feedback: "" });
  const [grading, setGrading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Create form
  const [form, setForm] = useState({
    title: "",
    description: "",
    course: "",
    deadline: "",
  });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [aRes, sRes, cRes] = await Promise.allSettled([
      api.get("/assignments/", { params: { page_size: 200 } }),
      api.get("/assignment-submissions/", { params: { page_size: 200 } }),
      api.get("/courses/", { params: { page_size: 500 } }),
    ]);
    setAssignments(extract(aRes));
    setSubmissions(extract(sRes));
    setCourses(extract(cRes));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!form.title || !form.course || !form.deadline) {
      notify(false, "Title, course and due date are required");
      return;
    }
    setCreating(true);
    try {
      await api.post("/assignments/", {
        title: form.title,
        description: form.description || "",
        course: Number(form.course),
        deadline: form.deadline,
      });
      notify(true, "Assignment created");
      setShowCreate(false);
      setForm({ title: "", description: "", course: "", deadline: "" });
      load();
    } catch (e: any) {
      const err = e?.response?.data;
      const msg =
        typeof err === "string"
          ? err
          : (err?.detail ??
            err?.course?.[0] ??
            err?.title?.[0] ??
            JSON.stringify(err) ??
            "Failed to create assignment");
      notify(false, msg);
    } finally {
      setCreating(false);
    }
  };

  const handleGrade = async (submissionId: number) => {
    if (!gradeForm.score) {
      notify(false, "Enter a score");
      return;
    }
    setGrading(true);
    try {
      await api.patch(`/assignment-submissions/${submissionId}/`, {
        score: Number(gradeForm.score),
        feedback: gradeForm.feedback,
        status: "graded",
      });
      notify(true, "Submission graded ✅");
      setGradingId(null);
      setGradeForm({ score: "", feedback: "" });
      load();
    } catch (e: any) {
      notify(false, e?.response?.data?.detail ?? "Grading failed");
    } finally {
      setGrading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const totalSubmissions = submissions.length;
  const ungradedCount = submissions.filter(
    (s) => s.status === "submitted",
  ).length;
  const gradedCount = submissions.filter((s) => s.status === "graded").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Assignments"
          value={assignments.length}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Total Submissions"
          value={totalSubmissions}
          icon={<Users className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          label="Graded"
          value={gradedCount}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label="Pending Grade"
          value={ungradedCount}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
          {(["assignments", "submissions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors flex items-center gap-2
                ${activeTab === t ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              {t === "assignments" ? (
                <FileText className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              {t}
              {t === "submissions" && ungradedCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {ungradedCount}
                </span>
              )}
            </button>
          ))}
        </div>
        {activeTab === "assignments" && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </button>
        )}
      </div>

      {/* ASSIGNMENTS TAB */}
      {activeTab === "assignments" &&
        (assignments.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No assignments yet"
            sub="Click '+ New Assignment' to create one"
          />
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const subs = submissions.filter((s) => s.assignment === a.id);
              const graded = subs.filter((s) => s.status === "graded").length;
              const open = expandedId === a.id;
              const isPastDue = daysLeft(a.deadline) < 0;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => setExpandedId(open ? null : a.id)}
                    className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {a.title}
                        </h3>
                        {isPastDue && !subs.length && (
                          <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        {a.course_title}
                      </p>
                      {a.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {a.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3" />
                        {fmtDate(a.deadline)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {graded}/{subs.length} graded
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Expanded submissions */}
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-gray-100 dark:border-gray-800"
                      >
                        {subs.length > 0 ? (
                          <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {subs.map((s) => (
                              <div
                                key={s.id}
                                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {s.student_name}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 mt-0.5">
                                    <span className="text-xs text-gray-400">
                                      {fmtDateTime(s.submitted_at)}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                        STATUS_BADGE[s.status]?.className || ""
                                      }`}
                                    >
                                      {STATUS_BADGE[s.status]?.label ||
                                        s.status}
                                    </span>
                                    {s.text_response && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400 italic truncate max-w-[200px]">
                                        "{s.text_response}"
                                      </span>
                                    )}
                                    {s.file && (
                                      <a
                                        href={s.file}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                      >
                                        <File className="w-3 h-3" />
                                        Attachment
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0 flex items-center gap-3">
                                  {s.status === "graded" ? (
                                    <div className="text-right">
                                      <p
                                        className={`text-lg font-black ${SCORE_COLOR(s.score ?? 0, a.total_marks)}`}
                                      >
                                        {s.score}/{a.total_marks}
                                      </p>
                                      {s.feedback && (
                                        <p className="text-xs text-gray-400 max-w-[150px] truncate">
                                          {s.feedback}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setGradingId(s.id);
                                        setGradeForm({
                                          score: "",
                                          feedback: "",
                                        });
                                      }}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                    >
                                      Grade
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="px-5 py-3 text-xs text-gray-400">
                            No submissions yet
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ))}

      {/* SUBMISSIONS TAB */}
      {activeTab === "submissions" &&
        (submissions.length === 0 ? (
          <EmptyState icon="📥" title="No submissions yet" />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Assignment</th>
                    <th className="px-3 py-3 text-center">Submitted</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-center">Score</th>
                    <th className="px-3 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {submissions.map((s, i) => {
                    const asgn = assignments.find((a) => a.id === s.assignment);
                    return (
                      <tr
                        key={s.id}
                        className={
                          i % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800/40"
                        }
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">
                            {s.student_name}
                          </p>
                          {s.student_id && (
                            <p className="text-[10px] text-gray-400 font-mono">
                              {s.student_id}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[180px] truncate">
                          {s.assignment_title ??
                            asgn?.title ??
                            `#${s.assignment}`}
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-gray-400">
                          {fmtDate(s.submitted_at)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              STATUS_BADGE[s.status]?.className || ""
                            }`}
                          >
                            {STATUS_BADGE[s.status]?.label || s.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {s.score != null ? (
                            <span
                              className={`font-black text-sm ${SCORE_COLOR(s.score, asgn?.total_marks ?? 100)}`}
                            >
                              {s.score}/{asgn?.total_marks ?? 100}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {s.status !== "graded" ? (
                            <button
                              onClick={() => {
                                setGradingId(s.id);
                                setGradeForm({ score: "", feedback: "" });
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              Grade
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setGradingId(s.id);
                                setGradeForm({
                                  score: String(s.score ?? ""),
                                  feedback: s.feedback ?? "",
                                });
                              }}
                              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                            >
                              <Edit className="w-3 h-3 inline mr-1" />
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {/* ── Create Assignment Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <Modal
            onClose={() => setShowCreate(false)}
            title="📋 Create Assignment"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Essay on the Civil War"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Course *
                </label>
                <select
                  value={form.course}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, course: e.target.value }))
                  }
                  className={inputCls}
                >
                  <option value="">— Select course —</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  placeholder="Instructions for students…"
                  className={inputCls + " resize-none"}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Due Date *
                </label>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deadline: e.target.value }))
                  }
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {creating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Assignment"
                )}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Grade Modal ── */}
      <AnimatePresence>
        {gradingId !== null &&
          (() => {
            const sub = submissions.find((s) => s.id === gradingId);
            const asgn = assignments.find((a) => a.id === sub?.assignment);
            return (
              <Modal
                onClose={() => setGradingId(null)}
                title="✏️ Grade Submission"
              >
                {sub && (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4 space-y-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                        {sub.student_name}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {asgn?.title}
                      </p>
                      {sub.text_response && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic border-l-2 border-gray-300 pl-2">
                          "{sub.text_response}"
                        </p>
                      )}
                      {sub.file && (
                        <a
                          href={sub.file}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          <File className="w-3 h-3" />
                          View submitted file
                        </a>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Score *{" "}
                          <span className="font-normal text-gray-400">
                            (out of {asgn?.total_marks ?? 100})
                          </span>
                        </label>
                        <input
                          type="number"
                          value={gradeForm.score}
                          min={0}
                          max={asgn?.total_marks ?? 100}
                          onChange={(e) =>
                            setGradeForm((f) => ({
                              ...f,
                              score: e.target.value,
                            }))
                          }
                          className={inputCls}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Feedback
                        </label>
                        <textarea
                          value={gradeForm.feedback}
                          onChange={(e) =>
                            setGradeForm((f) => ({
                              ...f,
                              feedback: e.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Optional feedback for the student…"
                          className={inputCls + " resize-none"}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() => setGradingId(null)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleGrade(gradingId)}
                        disabled={grading}
                        className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        {grading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving…
                          </>
                        ) : (
                          "Save Grade"
                        )}
                      </button>
                    </div>
                  </>
                )}
              </Modal>
            );
          })()}
      </AnimatePresence>
    </div>
  );
};

// ── Modal reusable component ──────────────────────────────────────────────────
const Modal: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}> = ({ children, onClose, title }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <motion.div
      initial={{ scale: 0.95, y: 10 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-black text-gray-900 dark:text-white">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close modal"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

// STUDENT VIEW
const StudentView: React.FC<{ notify: (ok: boolean, msg: string) => void }> = ({
  notify,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "submitted" | "graded"
  >("all");
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [subForms, setSubForms] = useState<
    Record<number, { text: string; file: File | null }>
  >({});
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/assignments/", { params: { page_size: 200 } });
      const d = r.data;
      setAssignments(Array.isArray(d) ? d : (d?.results ?? []));
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (assignmentId: number) => {
    const sf = subForms[assignmentId] ?? { text: "", file: null };
    if (!sf.text && !sf.file) {
      notify(false, "Add a response or attach a file");
      return;
    }
    setSubmitting(assignmentId);
    try {
      const fd = new FormData();
      fd.append("assignment", String(assignmentId));
      if (sf.text) fd.append("text_response", sf.text);
      if (sf.file) fd.append("file", sf.file);
      await api.post("/assignment-submissions/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      notify(true, "Assignment submitted ✅");
      setSubForms((f) => {
        const n = { ...f };
        delete n[assignmentId];
        return n;
      });
      load();
    } catch (e: any) {
      notify(false, e?.response?.data?.detail ?? "Submission failed");
    } finally {
      setSubmitting(null);
    }
  };

  const filtered = assignments.filter((a) => {
    if (filter === "pending") return !a.my_submission;
    if (filter === "submitted") return a.my_submission?.status === "submitted";
    if (filter === "graded") return a.my_submission?.status === "graded";
    return true;
  });

  const pendingCount = assignments.filter((a) => !a.my_submission).length;
  const gradedCount = assignments.filter(
    (a) => a.my_submission?.status === "graded",
  ).length;

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total"
          value={assignments.length}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          label="Graded"
          value={gradedCount}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 w-fit">
        {(["all", "pending", "submitted", "graded"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
              ${filter === f ? "bg-teal-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Assignments list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📝"
          title={`No ${filter === "all" ? "" : filter} assignments`}
          sub={filter === "pending" ? "You're all caught up! 🎉" : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const sub = a.my_submission;
            const days = daysLeft(a.deadline);
            const isPastDue = days < 0;
            const sf = subForms[a.id] ?? { text: "", file: null };
            const busy = submitting === a.id;

            const statusColor =
              sub?.status === "graded"
                ? "border-emerald-400 dark:border-emerald-500"
                : sub
                  ? "border-blue-400 dark:border-blue-500"
                  : isPastDue
                    ? "border-rose-400 dark:border-rose-500"
                    : "border-gray-200 dark:border-gray-700";

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-gray-900 rounded-2xl border-2 shadow-sm overflow-hidden transition-colors ${statusColor}`}
              >
                <div className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {a.title}
                      </h3>
                      <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                        {a.course_title}
                      </p>
                      {a.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {a.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full
                        ${isPastDue && !sub ? "bg-rose-100 text-rose-600" : days <= 2 && !sub ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}
                      >
                        {isPastDue && !sub
                          ? "⚠️ Overdue"
                          : days === 0
                            ? "🔥 Today"
                            : `${days}d left`}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {fmtDate(a.deadline)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {a.total_marks} marks
                      </p>
                    </div>
                  </div>
                </div>

                {/* Graded result */}
                {sub?.status === "graded" && (
                  <div className="px-5 pb-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex items-center justify-between border border-emerald-200 dark:border-emerald-800">
                      <div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                          Graded
                        </p>
                        {sub.feedback && (
                          <p className="text-sm text-emerald-700 dark:text-emerald-300 italic mt-1">
                            "{sub.feedback}"
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-3xl font-black ${SCORE_COLOR(sub.score ?? 0, a.total_marks)}`}
                        >
                          {sub.score}
                        </p>
                        <p className="text-xs text-gray-400">
                          / {a.total_marks}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submitted but not yet graded */}
                {sub?.status === "submitted" && (
                  <div className="px-5 pb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-3 flex items-center gap-3 border border-blue-200 dark:border-blue-800">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        Submitted {fmtDateTime(sub.submitted_at)} — awaiting
                        grade
                      </p>
                    </div>
                  </div>
                )}

                {/* Submission form */}
                {!sub && (
                  <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                    <textarea
                      value={sf.text}
                      onChange={(e) =>
                        setSubForms((f) => ({
                          ...f,
                          [a.id]: { ...sf, text: e.target.value },
                        }))
                      }
                      placeholder="Type your response here…"
                      rows={3}
                      className={inputCls + " resize-none"}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt,image/*"
                          ref={(el) => {
                            fileRefs.current[a.id] = el;
                          }}
                          onChange={(e) =>
                            setSubForms((f) => ({
                              ...f,
                              [a.id]: {
                                ...sf,
                                file: e.target.files?.[0] ?? null,
                              },
                            }))
                          }
                        />
                        <Upload className="w-4 h-4" />
                        {sf.file ? (
                          <span className="text-teal-600 font-medium truncate max-w-[120px]">
                            {sf.file.name}
                          </span>
                        ) : (
                          "Attach file"
                        )}
                      </label>
                      <button
                        onClick={() => handleSubmit(a.id)}
                        disabled={busy || (!sf.text && !sf.file)}
                        className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-teal-600/20"
                      >
                        {busy ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting…
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Submit
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ADMIN VIEW
const AdminView: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/assignments/", { params: { page_size: 500 } })
      .then((r) => {
        const d = r.data;
        setAssignments(Array.isArray(d) ? d : (d?.results ?? []));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.course_title ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assignments by title or course…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No assignments found"
          sub="Try adjusting your search"
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-white text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Course</th>
                  <th className="px-3 py-3 text-center">Due</th>
                  <th className="px-3 py-3 text-center">Marks</th>
                  <th className="px-3 py-3 text-center">Submissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((a, i) => (
                  <tr
                    key={a.id}
                    className={
                      i % 2 === 0 ? "" : "bg-gray-50 dark:bg-gray-800/40"
                    }
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-[200px] truncate">
                      {a.title}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[180px] truncate">
                      {a.course_title}
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-400 whitespace-nowrap">
                      {fmtDate(a.deadline)}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                      {a.total_marks}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {a.submission_count ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// MAIN PAGE
const Assignments: React.FC = () => {
  const userData = getUserData();
  const role = userData?.role ?? "";
  const dept = userData?.department ?? "";

  const isTeacher = userIsTeacher();
  const isStudent = userIsStudent();
  const isAdmin = userIsAdmin();

  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const notify = useCallback((ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const DEPT_COLOR: Record<string, string> = {
    western: "from-blue-700 to-blue-500",
    arabic: "from-emerald-700 to-emerald-500",
    programming: "from-violet-700 to-violet-500",
  };
  const heroBg = DEPT_COLOR[dept] ?? "from-gray-700 to-gray-500";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-[60px]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium text-white flex items-center gap-2
              ${toast.ok ? "bg-emerald-600" : "bg-rose-600"}`}
          >
            {toast.ok ? "✅" : "❌"} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <div className={`bg-gradient-to-r ${heroBg} px-6 py-8`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-black text-white">Assignments</h1>
              <p className="text-sm text-white/70 mt-1">
                {isTeacher
                  ? "Create assignments and grade student submissions"
                  : isStudent
                    ? "View your assignments and submit your work"
                    : "All assignments across your department"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isTeacher ? (
          <TeacherView notify={notify} />
        ) : isStudent ? (
          <StudentView notify={notify} />
        ) : isAdmin ? (
          <AdminView />
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🔒</p>
            <p>You don't have access to this page.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;
