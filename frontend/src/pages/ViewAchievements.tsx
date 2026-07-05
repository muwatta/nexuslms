import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Trophy,
  Star,
  Medal,
  CheckCircle,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";

interface Achievement {
  id: number;
  student: number;
  course: number;
  title: string;
  achievement_type: string;
  date_earned: string;
}

// ── Helper 
const getIconForType = (type: string): React.ReactNode => {
  const map: Record<string, React.ReactNode> = {
    certificate: <Award className="w-6 h-6 text-emerald-500" />,
    badge: <Medal className="w-6 h-6 text-blue-500" />,
    award: <Trophy className="w-6 h-6 text-amber-500" />,
    milestone: <Star className="w-6 h-6 text-purple-500" />,
    completion: <CheckCircle className="w-6 h-6 text-green-500" />,
  };
  return map[type] || <Sparkles className="w-6 h-6 text-yellow-500" />;
};

const getBgColor = (type: string): string => {
  const map: Record<string, string> = {
    certificate:
      "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    badge:
      "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    award:
      "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    milestone:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    completion:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  };
  return (
    map[type] ||
    "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
  );
};

const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    api
      .get("/achievements/")
      .then((res) => {
        const data = res.data;
        setAchievements(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const achievementTypes = useMemo(
    () => [...new Set(achievements.map((a) => a.achievement_type))],
    [achievements],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return achievements;
    return achievements.filter((a) => a.achievement_type === filter);
  }, [achievements, filter]);

  const stats = useMemo(() => {
    const total = achievements.length;
    const byType = achievementTypes.map((type) => ({
      type,
      count: achievements.filter((a) => a.achievement_type === type).length,
    }));
    return { total, byType };
  }, [achievements, achievementTypes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2
            size={40}
            className="animate-spin text-yellow-500 mx-auto mb-4"
          />
          <p className="text-slate-600 dark:text-slate-400">
            Loading achievements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" />
                Achievements
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {achievements.length} earned across your learning journey
              </p>
            </div>
            {/* Stats summary */}
            <div className="flex flex-wrap gap-2">
              {stats.byType.map(({ type, count }) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {getIconForType(type)}
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filter === "all"
                ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-yellow-400"
            }`}
          >
            All ({achievements.length})
          </button>
          {achievementTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                filter === type
                  ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-yellow-400"
              }`}
            >
              {getIconForType(type)}
              {type} (
              {achievements.filter((a) => a.achievement_type === type).length})
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
            >
              <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No achievements yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Keep learning and you'll earn achievements along the way! 🚀
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border ${getBgColor(
                    achievement.achievement_type,
                  )} hover:shadow-xl transition-all duration-300`}
                >
                  {/* Icon & type badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">
                      {getIconForType(achievement.achievement_type)}
                    </div>
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {achievement.achievement_type}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                    {achievement.title}
                  </h3>

                  {/* Date */}
                  <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    {new Date(achievement.date_earned).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </div>

                  {/* Decorative line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl bg-gradient-to-r from-yellow-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Achievements;
