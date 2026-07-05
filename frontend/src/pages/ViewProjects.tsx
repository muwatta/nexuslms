import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  CheckCircle,
  Archive,
  Rocket,
  Calendar,
  Clock,
  Search,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface Project {
  id: number;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  course: number;
}

// ── Helper functions ──────────────────────────────────────────────
const getStatusConfig = (status: string) => {
  const map: Record<
    string,
    { color: string; icon: React.ReactNode; label: string }
  > = {
    active: {
      color:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      icon: (
        <Rocket className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      ),
      label: "Active",
    },
    completed: {
      color:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      icon: (
        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      ),
      label: "Completed",
    },
    archived: {
      color:
        "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      icon: <Archive className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
      label: "Archived",
    },
  };
  return map[status] || map.active;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const calculateProgress = (start: string, end: string) => {
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  const now = Date.now();
  if (now < startDate) return 0;
  if (now > endDate) return 100;
  const total = endDate - startDate;
  const elapsed = now - startDate;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
};

// ── Main Component ──────────────────────────────────────────────
const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api
      .get("/projects/")
      .then((res) => {
        const data = res.data;
        setProjects(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statuses = useMemo(
    () => [...new Set(projects.map((p) => p.status))],
    [projects],
  );

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "active").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const archived = projects.filter((p) => p.status === "archived").length;
    return { total, active, completed, archived };
  }, [projects]);

  const filtered = useMemo(() => {
    let result = projects;
    if (filterStatus !== "all") {
      result = result.filter((p) => p.status === filterStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }
    return result;
  }, [projects, filterStatus, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2
            size={40}
            className="animate-spin text-purple-500 mx-auto mb-4"
          />
          <p className="text-slate-600 dark:text-slate-400">
            Loading projects...
          </p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-purple-500" />
                Projects
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {projects.length} projects across your courses
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                <Rocket className="w-3.5 h-3.5" />
                Active: {stats.active}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                <CheckCircle className="w-3.5 h-3.5" />
                Completed: {stats.completed}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <Archive className="w-3.5 h-3.5" />
                Archived: {stats.archived}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-shadow"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filterStatus === "all"
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-400"
              }`}
            >
              All ({stats.total})
            </button>
            {statuses.map((status) => {
              const count = projects.filter((p) => p.status === status).length;
              const { icon, label } = getStatusConfig(status);
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    filterStatus === status
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-400"
                  }`}
                >
                  {icon}
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Projects List */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
            >
              <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No projects found
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {projects.length === 0
                  ? "You haven't started any projects yet."
                  : "Try adjusting your filters or search term."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {filtered.map((project, index) => {
                const { color, icon, label } = getStatusConfig(project.status);
                const progress = calculateProgress(
                  project.start_date,
                  project.end_date,
                );
                const isActive = project.status === "active";
                const isOverdue =
                  isActive && new Date(project.end_date) < new Date();

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -2 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {project.title}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${color}`}
                          >
                            {icon}
                            {label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Start: {formatDate(project.start_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Due: {formatDate(project.end_date)}
                          </span>
                          {isOverdue && (
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                              Overdue
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {isActive && (
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600 dark:text-slate-400">
                                Progress
                              </span>
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                                style={{ width: `${Math.min(100, progress)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <button className="px-4 py-2 text-sm font-semibold text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                          <ExternalLink className="w-4 h-4 inline mr-1" />
                          View
                        </button>
                        {isActive && (
                          <button className="px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors shadow-lg shadow-purple-600/20">
                            Update
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Projects;
