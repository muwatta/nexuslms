import React, { useState } from "react";
import api from "../api";

const Analytics: React.FC = () => {
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);

  const fetchAnalytics = async (path: string) => {
    setLoading(true);
    setError(null);
    setNoResults(false);
    setData(null);

    try {
      const resp = await api.get(path);
      const result = resp.data;

      const hasCourseData = result && (result.course_title || result.course_id);
      const hasStudentData =
        result && (result.student_username || result.student_id);

      if (hasCourseData || hasStudentData) {
        setData(result);
      } else {
        setNoResults(true);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNoResults(true);
      } else {
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Failed to load analytics.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCourse = () => {
    if (!courseId.trim()) {
      setError("Please enter a course title or ID.");
      return;
    }
    fetchAnalytics(`/analytics/course/${encodeURIComponent(courseId.trim())}/`);
  };

  const fetchStudent = () => {
    if (!studentId.trim()) {
      setError("Please enter a student name, username, or ID.");
      return;
    }
    fetchAnalytics(
      `/analytics/student/${encodeURIComponent(studentId.trim())}/`,
    );
  };

  const formatValue = (value: number | null | string) =>
    value === null || value === undefined ? "—" : value;

  const renderCourseSummary = () => (
    <div className="space-y-4 rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5 shadow-sm transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Course analytics summary
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Results for the most relevant course match.
          </p>
        </div>
        <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
          Live
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-100 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Course title
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
            {formatValue(data.course_title)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-100 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Course ID
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
            {formatValue(data.course_id)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-100 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Enrollments
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {formatValue(data.total_enrollments)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-100 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Quiz submissions
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {formatValue(data.total_quiz_submissions)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-100 dark:border-slate-700">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Average quiz score
        </p>
        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
          {data.average_quiz_score === null
            ? "No submissions yet"
            : `${data.average_quiz_score.toFixed(2)}%`}
        </p>
      </div>
    </div>
  );

  const renderStudentSummary = () => (
    <div className="space-y-4 rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5 shadow-sm transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Student analytics summary
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Results for the student match you searched.
          </p>
        </div>
        <span className="rounded-full bg-teal-100 dark:bg-teal-900/30 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
          Live
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-100 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Student username
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
            {formatValue(data.student_username)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-100 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Student ID
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
            {formatValue(data.student_id)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-100 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Quiz submissions
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {formatValue(data.total_quiz_submissions)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-100 dark:border-slate-700">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Average quiz score
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {data.average_quiz_score === null
              ? "No submissions yet"
              : `${data.average_quiz_score.toFixed(2)}%`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900/80 p-4 border border-slate-100 dark:border-slate-700">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Enrolled courses
        </p>
        {Array.isArray(data.enrolled_courses) &&
        data.enrolled_courses.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {data.enrolled_courses.map((course: any) => (
              <li
                key={course.course__id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2"
              >
                <span className="font-medium text-slate-900 dark:text-white">
                  {course.course__title}
                </span>
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  ID: {course.course__id}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No enrolled courses found.
          </p>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => {
    if (!data) return null;
    if (data.course_title) return renderCourseSummary();
    if (data.student_username) return renderStudentSummary();

    return (
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-900 dark:text-white shadow-sm transition-colors">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="font-semibold">Analytics response</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Updated live
          </span>
        </div>
        <pre className="overflow-x-auto text-[0.95rem] leading-6 dark:text-slate-300">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  const NoResults = () => (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-6 text-center shadow-sm transition-colors">
      <div className="flex flex-col items-center gap-2">
        <span className="text-4xl">🔍</span>
        <p className="text-sm font-medium text-slate-700 dark:text-white">
          No results found
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Try adjusting your search term or check the input.
        </p>
      </div>
    </div>
  );

  return (
    <div className="app-shell p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="app-card p-6 space-y-4">
          <div>
            <h1 className="app-page-title">📊 Analytics</h1>
            <p className="app-page-subtitle">
              View course or student analytics data pulled directly from the
              server.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-4 shadow-sm transition-colors">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
                Course analytics
              </h2>
              <input
                type="text"
                placeholder="Course title or ID"
                value={courseId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCourseId(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search by course title or numeric course ID.
              </p>
              <button
                onClick={fetchCourse}
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 dark:bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Loading…" : "Load course analytics"}
              </button>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-4 shadow-sm transition-colors">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
                Student analytics
              </h2>
              <input
                type="text"
                placeholder="Student name, username or ID"
                value={studentId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setStudentId(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search by student username, name, or student ID.
              </p>
              <button
                onClick={fetchStudent}
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 dark:bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Loading…" : "Load student analytics"}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300 transition-colors">
              {error}
            </div>
          )}

          {noResults && <NoResults />}

          {data && !noResults && renderAnalytics()}

          {!data && !noResults && !error && (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/40 p-6 text-sm text-slate-500 dark:text-slate-400 transition-colors">
              Enter a course or student ID and click a button to load analytics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
