import React, { useState } from "react";
import api from "../api";

const Analytics: React.FC = () => {
  const [courseId, setCourseId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (path: string) => {
    try {
      setLoading(true);
      setError(null);
      const resp = await api.get(path);
      setData(resp.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load analytics.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourse = () => {
    if (!courseId.trim()) {
      setError("Please enter a course ID.");
      return;
    }
    fetchAnalytics(`/analytics/course/${courseId.trim()}/`);
  };

  const fetchStudent = () => {
    if (!studentId.trim()) {
      setError("Please enter a student ID.");
      return;
    }
    fetchAnalytics(`/analytics/student/${studentId.trim()}/`);
  };

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
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-lg">Course analytics</h2>
              <input
                type="text"
                placeholder="Course ID"
                value={courseId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCourseId(e.target.value)
                }
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={fetchCourse}
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? "Loading…" : "Load course analytics"}
              </button>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-lg">Student analytics</h2>
              <input
                type="text"
                placeholder="Student ID"
                value={studentId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setStudentId(e.target.value)
                }
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={fetchStudent}
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? "Loading…" : "Load student analytics"}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {data ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-semibold">Analytics response</span>
                <span className="text-xs text-slate-500">Updated live</span>
              </div>
              <pre className="overflow-x-auto text-[0.95rem] leading-6">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          ) : (
            !error && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                Enter a course or student ID and click a button to load
                analytics.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
