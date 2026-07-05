import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Loader2,
  TrendingUp,
  Award,
  BookOpen,
  FileText,
  BarChart3,
  Rocket,
} from "lucide-react";

interface Milestone {
  id: number;
  title: string;
  progress_percentage: number;
  related_to: string;
  course: number;
}

// ── Helper functions ──────────────────────────────────────────────────
const getRelatedIcon = (relatedTo: string): React.ReactNode => {
  const map: Record<string, React.ReactNode> = {
    enrollment: <BookOpen className="w-5 h-5" />,
    assignment: <FileText className="w-5 h-5" />,
    quiz: <BarChart3 className="w-5 h-5" />,
    project: <Rocket className="w-5 h-5" />,
  };
  return map[relatedTo] || <Flag className="w-5 h-5" />;
};

const getStatusColor = (progress: number): string => {
  if (progress === 100) return "text-emerald-600 dark:text-emerald-400";
  if (progress >= 75) return "text-blue-600 dark:text-blue-400";
  if (progress >= 50) return "text-amber-600 dark:text-amber-400";
  if (progress > 0) return "text-orange-600 dark:text-orange-400";
  return "text-gray-400 dark:text-gray-500";
};

const getStatusBadge = (progress: number): { label: string; color: string } => {
  if (progress === 100)
    return {
      label: "Completed 🎉",
      color:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    };
  if (progress >= 75)
    return {
      label: "Almost There",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    };
  if (progress >= 50)
    return {
      label: "Halfway",
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    };
  if (progress > 0)
    return {
      label: "In Progress",
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    };
  return {
    label: "Not Started",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };
};

// ── Main Component ──────────────────────────────────────────────────
const Milestones: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRelated, setFilterRelated] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api
      .get("/milestones/")
      .then((res) => {
        const data = res.data;
        setMilestones(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const relatedTypes = useMemo(
    () => [...new Set(milestones.map((m) => m.related_to))],
    [milestones],
  );

  const stats = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter(
      (m) => m.progress_percentage === 100,
    ).length;
    const inProgress = milestones.filter(
      (m) => m.progress_percentage > 0 && m.progress_percentage < 100,
    ).length;
    const notStarted = milestones.filter(
      (m) => m.progress_percentage === 0,
    ).length;
    const avgProgress =
      total > 0
        ? Math.round(
            milestones.reduce((sum, m) => sum + m.progress_percentage, 0) /
              total,
          )
        : 0;
    return { total, completed, inProgress, notStarted, avgProgress };
  }, [milestones]);

  const filtered = useMemo(() => {
    let result = milestones;
    if (filterRelated !== "all") {
      result = result.filter((m) => m.related_to === filterRelated);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((m) => m.title.toLowerCase().includes(q));
    }
    return result;
  }, [milestones, filterRelated, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<string, Milestone[]> = {};
    filtered.forEach((m) => {
      const key = m.related_to || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [filtered]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2
            size={40}
            className="animate-spin text-emerald-500 mx-auto mb-4"
          />
          <p className="text-slate-600 dark:text-slate-400">
            Loading milestones...
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
                <Flag className="w-8 h-8 text-emerald-500" />
                Milestones
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {milestones.length} milestones across your learning journey
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-3.5 h-3.5" />
                Completed: {stats.completed}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                <Clock className="w-3.5 h-3.5" />
                In Progress: {stats.inProgress}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <AlertCircle className="w-3.5 h-3.5" />
                Not Started: {stats.notStarted}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              icon: <Target className="w-5 h-5" />,
              label: "Total",
              value: stats.total,
              color: "blue",
            },
            {
              icon: <TrendingUp className="w-5 h-5" />,
              label: "Avg Progress",
              value: `${stats.avgProgress}%`,
              color: "emerald",
            },
            {
              icon: <CheckCircle className="w-5 h-5" />,
              label: "Completed",
              value: stats.completed,
              color: "green",
            },
            {
              icon: <Clock className="w-5 h-5" />,
              label: "In Progress",
              value: stats.inProgress,
              color: "amber",
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestones..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterRelated("all")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filterRelated === "all"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400"
              }`}
            >
              All ({stats.total})
            </button>
            {relatedTypes.map((type) => {
              const count = milestones.filter(
                (m) => m.related_to === type,
              ).length;
              return (
                <button
                  key={type}
                  onClick={() => setFilterRelated(type)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    filterRelated === type
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                  }`}
                >
                  {getRelatedIcon(type)}
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Milestones List */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
            >
              <Flag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No milestones found
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {milestones.length === 0
                  ? "Start your courses to unlock learning milestones! 🚀"
                  : "Try adjusting your filters or search term."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {getRelatedIcon(category)}
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                      ({items.length})
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {items.map((milestone, index) => {
                      const progress = milestone.progress_percentage;
                      const status = getStatusBadge(progress);
                      const color = getStatusColor(progress);
                      return (
                        <motion.div
                          key={milestone.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -2 }}
                          className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {milestone.title}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span
                                  className={`text-sm font-semibold ${color}`}
                                >
                                  {progress}%
                                </span>
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.color}`}
                                >
                                  {status.label}
                                </span>
                              </div>
                            </div>
                            <div className="w-full sm:w-48">
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    progress === 100
                                      ? "bg-emerald-500"
                                      : "bg-gradient-to-r from-emerald-500 to-teal-500"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Milestones;
