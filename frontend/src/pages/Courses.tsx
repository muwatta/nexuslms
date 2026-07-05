import React, { useEffect, useState } from "react";
import api from "../api";
import { getUserData, hasPermission } from "../utils/authUtils";
import { motion, AnimatePresence } from "framer-motion";

const canCreate = () => hasPermission("course.create");
const canDelete = () => hasPermission("course.delete");

const DEPT_ACCENT: Record<
  string,
  { a: string; b: string; icon: string; label: string }
> = {
  programming: {
    a: "#a3e635",
    b: "#818cf8",
    icon: "💻",
    label: "Digital School",
  },
  arabic: { a: "#f59e0b", b: "#ef4444", icon: "📖", label: "Arabic School" },
  western: { a: "#38bdf8", b: "#6366f1", icon: "🎓", label: "Western School" },
  default: { a: "#14b8a6", b: "#4f46e5", icon: "📚", label: "All Courses" },
};

const DEPT_OPTIONS = [
  { value: "western", label: "🎓 Western School" },
  { value: "arabic", label: "📖 Arabic School" },
  { value: "programming", label: "💻 Digital School" },
];

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [newCourse, setNewCourse] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const userData = getUserData();
  const userDept = userData?.department ?? "";
  const isAdmin = ["super_admin", "admin", "school_admin"].includes(
    userData?.role ?? "",
  );

  // Admins can switch departments; others are locked to their own
  const [activeDept, setActiveDept] = useState<string>(userDept || "western");
  const accent = DEPT_ACCENT[activeDept] ?? DEPT_ACCENT.default;

  const filtered = courses.filter(
    (c) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const loadCourses = (dept: string) => {
    setLoading(true);
    setError("");
    api
      .get("/courses/", { params: { department: dept, page_size: 500 } })
      .then((res) => setCourses(res.data?.results ?? res.data ?? []))
      .catch(() => setError("Failed to load courses"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourses(activeDept);
  }, [activeDept]);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/courses/", { ...newCourse, department: activeDept });
      setNewCourse({ title: "", description: "" });
      setShowForm(false);
      loadCourses(activeDept);
    } catch {
      setError("Failed to add course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this course?")) return;
    setDeleting(id);
    try {
      await api.delete(`/courses/${id}/`);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Failed to delete course");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50 dark:bg-[#0a0e1a]">
        <div className="text-center space-y-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto"
            style={{
              borderColor: `${accent.a} transparent transparent transparent`,
            }}
          />
          <p className="text-sm font-mono text-gray-400 dark:text-gray-500">
            Loading courses…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0e1a] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-mono text-gray-400 dark:text-gray-600 mb-3">
            Dashboard <span className="mx-1">›</span> Courses
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accent.a}20, ${accent.b}20)`,
                  border: `1px solid ${accent.a}30`,
                }}
              >
                {accent.icon}
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {accent.label}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
                  {filtered.length} course{filtered.length !== 1 ? "s" : ""}{" "}
                  available
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canCreate() && (
                <button
                  onClick={() => setShowForm((p) => !p)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: showForm ? "#ef444420" : `${accent.a}18`,
                    color: showForm ? "#ef4444" : accent.a,
                    border: `1px solid ${showForm ? "#ef444440" : accent.a + "35"}`,
                  }}
                >
                  {showForm ? "✕ Cancel" : "+ Add Course"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Department tabs — admins only */}
        {isAdmin && (
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none">
            {DEPT_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setActiveDept(d.value)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
                style={
                  activeDept === d.value
                    ? {
                        background: DEPT_ACCENT[d.value].a + "20",
                        color: DEPT_ACCENT[d.value].a,
                        border: `1px solid ${DEPT_ACCENT[d.value].a}40`,
                      }
                    : {
                        background: "#f1f5f9",
                        color: "#64748b",
                        border: "1px solid #e2e8f0",
                      }
                }
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        {/* Non-admin department label */}
        {!isAdmin && userDept && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold mb-6"
            style={{
              background: accent.a + "15",
              color: accent.a,
              border: `1px solid ${accent.a}30`,
            }}
          >
            {accent.icon} {accent.label} — Your Department
          </div>
        )}

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between"
              style={{
                background: "#ef444415",
                border: "1px solid #ef444430",
                color: "#ef4444",
              }}
            >
              ⚠️ {error}
              <button
                onClick={() => setError("")}
                className="text-xs opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add course form */}
        <AnimatePresence>
          {showForm && canCreate() && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <form
                onSubmit={handleAddCourse}
                className="rounded-2xl border p-6 space-y-4 bg-white dark:bg-[#111827] border-gray-200 dark:border-[#1e293b]"
              >
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  New Course — {accent.label}
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, title: e.target.value })
                    }
                    placeholder="e.g. English Language — JSS 1A"
                    required
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-white border border-gray-200 dark:border-[#1e293b] placeholder-gray-400 dark:placeholder-gray-600"
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = accent.a + "80")
                    }
                    onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    Description
                  </label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        description: e.target.value,
                      })
                    }
                    placeholder="What will students learn?"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-all bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-white border border-gray-200 dark:border-[#1e293b] placeholder-gray-400 dark:placeholder-gray-600"
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = accent.a + "80")
                    }
                    onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    style={{
                      background: accent.a + "20",
                      color: accent.a,
                      border: `1px solid ${accent.a}35`,
                    }}
                  >
                    {submitting ? "Saving…" : "Create Course"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${accent.label} courses…`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all bg-white dark:bg-[#111827] text-gray-900 dark:text-white border border-gray-200 dark:border-[#1e293b] placeholder-gray-400 dark:placeholder-gray-600"
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = accent.a + "60")
            }
            onBlur={(e) => (e.currentTarget.style.borderColor = "")}
          />
        </div>

        {/* Course grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">{accent.icon}</p>
            <p className="text-gray-900 dark:text-white font-semibold mb-1">
              {search
                ? "No courses match your search"
                : `No ${accent.label} courses yet`}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {canCreate()
                ? "Create the first course using the button above."
                : "Check back later."}
            </p>
          </div>
        ) : (
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className="group relative rounded-2xl border p-5 transition-all duration-200 cursor-pointer bg-white dark:bg-[#111827] border-gray-200 dark:border-[#1e293b] hover:shadow-lg"
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor =
                    accent.a + "50")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.borderColor = "")
                }
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black font-mono"
                    style={{
                      background: accent.a + "15",
                      color: accent.a,
                      border: `1px solid ${accent.a}25`,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.student_class && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
                        style={{
                          background: accent.b + "15",
                          color: accent.b,
                          border: `1px solid ${accent.b}25`,
                        }}
                      >
                        {c.student_class}
                      </span>
                    )}
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
                      style={{
                        background: "#10b98115",
                        color: "#10b981",
                        border: "1px solid #10b98125",
                      }}
                    >
                      active
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 leading-snug line-clamp-2">
                  {c.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed line-clamp-2 mb-4">
                  {c.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#1e293b]">
                  <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                    ID #{c.id}
                  </span>
                  {canDelete() && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.id);
                      }}
                      disabled={deleting === c.id}
                      className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30"
                    >
                      {deleting === c.id ? "…" : "Delete"}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Courses;
