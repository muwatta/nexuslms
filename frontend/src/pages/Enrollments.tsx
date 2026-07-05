import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  GraduationCap,
  Search,
  Filter,
  XCircle,
} from "lucide-react";

interface Enrollment {
  id: number;
  course: number;
  course_title: string;
  course_department?: string;
  student?: number;
  student_name?: string;
  academic_year: string;
  status: "active" | "pending" | "completed" | "dropped" | "promoted";
  enrolled_at: string;
  term?: string;
}

const isDev = import.meta.env?.DEV || import.meta.env?.MODE === "development";

const Enrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/enrollments/");
      const data = response.data;
      const list = Array.isArray(data) ? data : data.results || data.data || [];

      // Validate and clean data
      const valid = list
        .filter((item: any) => item.id && item.course)
        .map((item: any) => {
          // --- FIX: Normalise status ---
          const rawStatus = (item.status || "").toString().toLowerCase().trim();
          const validStatuses = [
            "active",
            "pending",
            "completed",
            "dropped",
            "promoted",
          ];
          const status = validStatuses.includes(rawStatus)
            ? rawStatus
            : "pending";

          // In development, log unexpected statuses to help debug
          if (isDev && rawStatus && !validStatuses.includes(rawStatus)) {
            console.warn(
              `[Enrollments] Unknown status "${item.status}" → normalised to "pending"`,
            );
          }

          return {
            id: item.id,
            course: item.course,
            course_title: item.course_title || `Course #${item.course}`,
            course_department: item.course_department,
            student: item.student,
            student_name: item.student_name,
            academic_year: item.academic_year || "N/A",
            status: status,
            enrolled_at: item.enrolled_at || new Date().toISOString(),
            term: item.term,
          };
        });

      setEnrollments(valid);

      const discarded = list.filter((item: any) => !item.id || !item.course);
      if (discarded.length > 0 && isDev) {
        console.warn(
          `[Enrollments] ${discarded.length} records discarded due to missing id/course`,
        );
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Failed to load enrollments. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Computed stats
  const stats = useMemo(() => {
    const total = enrollments.length;
    const active = enrollments.filter((e) => e.status === "active").length;
    const pending = enrollments.filter((e) => e.status === "pending").length;
    const completed = enrollments.filter(
      (e) => e.status === "completed",
    ).length;
    const dropped = enrollments.filter((e) => e.status === "dropped").length;
    return { total, active, pending, completed, dropped };
  }, [enrollments]);

  // Filter and search
  const filtered = useMemo(() => {
    let result = enrollments;
    if (filterStatus !== "all") {
      result = result.filter((e) => e.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((e) => e.course_title.toLowerCase().includes(q));
    }
    return result;
  }, [enrollments, filterStatus, searchQuery]);

  // Status badge helper
  const getStatusConfig = (status: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode }> = {
      active: {
        color:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        icon: (
          <CheckCircle2
            size={14}
            className="text-emerald-600 dark:text-emerald-400"
          />
        ),
      },
      pending: {
        color:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        icon: (
          <Clock size={14} className="text-amber-600 dark:text-amber-400" />
        ),
      },
      completed: {
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        icon: (
          <GraduationCap
            size={14}
            className="text-blue-600 dark:text-blue-400"
          />
        ),
      },
      dropped: {
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        icon: <XCircle size={14} className="text-red-600 dark:text-red-400" />,
      },
      promoted: {
        color:
          "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
        icon: (
          <GraduationCap
            size={14}
            className="text-violet-600 dark:text-violet-400"
          />
        ),
      },
    };
    return map[status] || map.pending;
  };

  // Render loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2
            size={40}
            className="animate-spin text-blue-600 mx-auto mb-4"
          />
          <p className="text-slate-600 dark:text-slate-400">
            Loading enrollments...
          </p>
        </div>
      </div>
    );
  }

  // Render error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
            Error Loading Enrollments
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchEnrollments}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                My Enrollments
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {enrollments.length} courses enrolled
              </p>
            </div>
            {enrollments.length > 0 && (
              <div className="flex items-center gap-2 text-sm bg-white dark:bg-slate-900 rounded-xl px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">
                  Active:
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.active}
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Pending:
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {stats.pending}
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Completed:
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {stats.completed}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
              <option value="promoted">Promoted</option>
            </select>
          </div>
        </div>

        {/* Enrollments List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            {enrollments.length === 0 ? (
              <>
                <BookOpen size={48} className="text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No Enrollments Found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  You haven't enrolled in any courses yet.
                </p>
                <a
                  href="/courses"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Courses
                </a>
              </>
            ) : (
              <>
                <AlertCircle
                  size={48}
                  className="text-slate-300 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No matching enrollments
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Try adjusting your filters or search term.
                </p>
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setSearchQuery("");
                  }}
                  className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {filtered.map((enrollment, index) => {
                const { color, icon } = getStatusConfig(enrollment.status);
                return (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {enrollment.course_title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}
                              >
                                {icon}
                                {enrollment.status.charAt(0).toUpperCase() +
                                  enrollment.status.slice(1)}
                              </span>
                              {enrollment.course_department && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  {enrollment.course_department}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {enrollment.academic_year}
                          </span>
                          {enrollment.term && (
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {enrollment.term}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-slate-400 dark:text-slate-500 block">
                          Enrolled{" "}
                          {new Date(
                            enrollment.enrolled_at,
                          ).toLocaleDateString()}
                        </span>
                        {enrollment.student_name && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">
                            {enrollment.student_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Enrollments;
