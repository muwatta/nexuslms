// frontend/src/pages/ParentPortal.tsx
// Parent can view their child's results, report cards, assignments and attendance.

import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { getUserData } from "../utils/authUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface Child {
  id: number;
  student_id: string;
  student_class: string;
  department: string;
  user: {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
  };
}
interface Result {
  id: number;
  course_title: string;
  term: string;
  academic_year: string;
  test1: number;
  test2: number;
  assignment: number;
  midterm: number;
  ca_total: number;
  exam: number;
  total: number;
  grade: string;
  position: number | null;
  remark: string;
  status: string;
}
interface ReportCard {
  id: number;
  term: string;
  academic_year: string;
  student_class: string;
  average_score: number;
  position_in_class: number | null;
  class_size: number;
  total_score: number;
  is_published: boolean;
  remarks: string;
}
interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  course_title?: string;
}

const GRADE_BG: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  B: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  D: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  E: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  F: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200",
};

const TERMS = ["First Term", "Second Term", "Third Term"];
const YEARS = Array.from({ length: 6 }, (_, i) => {
  const y = new Date().getFullYear() + 1 - i;
  return `${y}/${y + 1}`;
});
const getCurrentYear = () => {
  const n = new Date();
  return n.getMonth() >= 8
    ? `${n.getFullYear()}/${n.getFullYear() + 1}`
    : `${n.getFullYear() - 1}/${n.getFullYear()}`;
};

const ParentPortal: React.FC = () => {
  const userData = getUserData();
  const parentName = userData?.firstName
    ? `${userData.firstName} ${userData.lastName ?? ""}`.trim()
    : (userData?.username ?? "Parent");

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState("First Term");
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [activeTab, setActiveTab] = useState<
    "results" | "report" | "assignments"
  >("results");
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const notify = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Load children ─────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    api
      .get("/profiles/", { params: { role: "student", page_size: 200 } })
      .then((r) => {
        const d = r.data;
        const list: Child[] = Array.isArray(d) ? d : (d?.results ?? []);
        setChildren(list);
        if (list.length > 0) setSelectedChild(list[0]);
      })
      .catch(() =>
        notify(
          false,
          "Failed to load children. Check parent_email is set on student profiles.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  // ── Load results for selected child ──────────────────────────────────────
  const loadResults = useCallback(async () => {
    if (!selectedChild) return;
    setResultsLoading(true);
    try {
      const [resRes, cardRes, assignRes] = await Promise.allSettled([
        api.get("/results/", {
          params: {
            student: selectedChild.id,
            term: selectedTerm,
            academic_year: selectedYear,
            page_size: 200,
          },
        }),
        api.get("/report-cards/", {
          params: {
            student: selectedChild.id,
            term: selectedTerm,
            academic_year: selectedYear,
          },
        }),
        api.get("/assignments/", {
          params: { student_class: selectedChild.student_class, page_size: 50 },
        }),
      ]);
      if (resRes.status === "fulfilled") {
        const d = resRes.value.data;
        setResults(
          (Array.isArray(d) ? d : (d?.results ?? [])).filter(
            (r: any) => r.status === "published",
          ),
        );
      }
      if (cardRes.status === "fulfilled") {
        const d = cardRes.value.data;
        setReportCards(Array.isArray(d) ? d : (d?.results ?? []));
      }
      if (assignRes.status === "fulfilled") {
        const d = assignRes.value.data;
        setAssignments(Array.isArray(d) ? d : (d?.results ?? []));
      }
    } catch {
      notify(false, "Failed to load child data");
    } finally {
      setResultsLoading(false);
    }
  }, [selectedChild, selectedTerm, selectedYear]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const childName = (c: Child) =>
    `${c.user.first_name} ${c.user.last_name}`.trim() || c.user.username;
  const reportCard = reportCards[0] ?? null;
  const totalScore = results.reduce((s, r) => s + r.total, 0);
  const avgScore = results.length ? totalScore / results.length : 0;

  const ordinal = (n: number) =>
    n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-medium
              ${toast.ok ? "bg-emerald-600" : "bg-rose-600"} text-white`}
          >
            {toast.ok ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-cyan-600 text-white px-6 py-5 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-teal-200 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Parent Portal
            </p>
            <h1 className="text-2xl sm:text-3xl font-black mt-0.5">
              Welcome back, {parentName}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-teal-200">
              <span className="font-bold text-white">{children.length}</span>{" "}
              child{children.length !== 1 ? "ren" : ""} registered
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
          </div>
        ) : children.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-16 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-2">
              No children linked
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Ask the school admin to add your email address to your child's
              profile under "Parent Email".
            </p>
          </div>
        ) : (
          <>
            {/* Child selector - DROPDOWN */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label
                htmlFor="child-select"
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Select Child:
              </label>
              <div className="relative flex-1 max-w-xs">
                <select
                  id="child-select"
                  value={selectedChild?.id ?? ""}
                  onChange={(e) => {
                    const child = children.find(
                      (c) => c.id === Number(e.target.value),
                    );
                    setSelectedChild(child || null);
                  }}
                  className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {childName(c)} ({c.student_id})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {selectedChild && (
              <>
                {/* Child info card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
                        {(
                          selectedChild.user.first_name?.[0] ??
                          selectedChild.user.username[0]
                        ).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {childName(selectedChild)}
                        </h2>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2.5 py-0.5 rounded-full font-semibold">
                            <GraduationCap className="w-3 h-3" />
                            {selectedChild.student_id}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-semibold capitalize">
                            <BookOpen className="w-3 h-3" />
                            {selectedChild.student_class?.replace(/_/g, " ")}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full capitalize">
                            <User className="w-3 h-3" />
                            {selectedChild.department}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Quick stats */}
                    {results.length > 0 && (
                      <div className="flex gap-4 text-center shrink-0">
                        <div>
                          <p className="text-2xl font-black text-teal-600">
                            {avgScore.toFixed(1)}
                          </p>
                          <p className="text-xs text-slate-400">Average</p>
                        </div>
                        {reportCard?.position_in_class && (
                          <div>
                            <p className="text-2xl font-black text-blue-600">
                              {reportCard.position_in_class}
                              <sup className="text-sm">
                                {ordinal(reportCard.position_in_class)}
                              </sup>
                            </p>
                            <p className="text-xs text-slate-400">Position</p>
                          </div>
                        )}
                        <div>
                          <p className="text-2xl font-black text-slate-700 dark:text-slate-200">
                            {results.length}
                          </p>
                          <p className="text-xs text-slate-400">Subjects</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Term/Year selector */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      {TERMS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  {resultsLoading && (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading…
                    </span>
                  )}
                </div>

                {/* Tab navigation */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <div className="flex border-b border-slate-200 dark:border-slate-700 px-2 pt-2 gap-1 bg-slate-50 dark:bg-slate-800/50">
                    {[
                      { id: "results", label: "Results", icon: FileText },
                      { id: "report", label: "Report Card", icon: Award },
                      {
                        id: "assignments",
                        label: "Assignments",
                        icon: BookOpen,
                      },
                    ].map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setActiveTab(t.id as any)}
                          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors -mb-px ${
                            activeTab === t.id
                              ? "bg-white dark:bg-slate-900 border border-b-white dark:border-slate-700 dark:border-b-slate-900 text-teal-600 dark:text-teal-400"
                              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-5">
                    {/* RESULTS TAB */}
                    {activeTab === "results" &&
                      (results.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <p className="font-semibold text-slate-600 dark:text-slate-300">
                            No published results for {selectedTerm}{" "}
                            {selectedYear}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Results appear once teachers enter and admin
                            publishes them
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-800 text-white text-xs">
                              <tr>
                                <th className="px-3 py-3 text-left">Subject</th>
                                <th className="px-2 py-3 text-center">1st</th>
                                <th className="px-2 py-3 text-center">2nd</th>
                                <th className="px-2 py-3 text-center">Assg</th>
                                <th className="px-2 py-3 text-center">Mid</th>
                                <th className="px-2 py-3 text-center">CA</th>
                                <th className="px-2 py-3 text-center">Exam</th>
                                <th className="px-2 py-3 text-center font-bold">
                                  Total
                                </th>
                                <th className="px-2 py-3 text-center">Grd</th>
                                <th className="px-2 py-3 text-center">Pos</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {results.map((r, i) => (
                                <tr
                                  key={r.id}
                                  className={
                                    i % 2 === 0
                                      ? "bg-white dark:bg-slate-900"
                                      : "bg-slate-50 dark:bg-slate-800/50"
                                  }
                                >
                                  <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-[160px] truncate">
                                    {r.course_title}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-slate-500">
                                    {r.test1}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-slate-500">
                                    {r.test2}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-slate-500">
                                    {r.assignment}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-slate-500">
                                    {r.midterm}
                                  </td>
                                  <td className="px-2 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">
                                    {r.ca_total}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-slate-500">
                                    {r.exam}
                                  </td>
                                  <td className="px-2 py-2.5 text-center font-black text-slate-900 dark:text-white">
                                    {r.total}
                                  </td>
                                  <td className="px-2 py-2.5 text-center">
                                    {r.grade && (
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-black ${GRADE_BG[r.grade]}`}
                                      >
                                        {r.grade}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-2 py-2.5 text-center text-xs text-slate-400">
                                    {r.position
                                      ? `${r.position}${ordinal(r.position)}`
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700">
                              <tr>
                                <td
                                  className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200"
                                  colSpan={6}
                                >
                                  Total ({results.length} subjects)
                                </td>
                                <td className="px-2 py-2.5 text-center font-black text-teal-600 text-base">
                                  {totalScore.toFixed(0)}
                                </td>
                                <td className="px-2 py-2.5 text-center font-bold text-slate-600 text-xs">
                                  Avg: {avgScore.toFixed(1)}
                                </td>
                                <td colSpan={2} />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ))}

                    {/* REPORT CARD TAB */}
                    {activeTab === "report" &&
                      (!reportCard ? (
                        <div className="text-center py-12">
                          <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <p className="font-semibold text-slate-600 dark:text-slate-300">
                            No report card for {selectedTerm} {selectedYear}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Generated after results are published and positions
                            computed
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Report header */}
                          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-5 text-white shadow-md">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div>
                                <p className="text-xs text-teal-100 uppercase tracking-wider flex items-center gap-2">
                                  <Award className="w-4 h-4" />
                                  Term Report Card
                                </p>
                                <h3 className="text-xl font-black mt-0.5">
                                  {reportCard.term} · {reportCard.academic_year}
                                </h3>
                                <p className="text-sm text-teal-100 mt-1">
                                  Class:{" "}
                                  {reportCard.student_class?.replace(/_/g, " ")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-4xl font-black">
                                  {reportCard.average_score.toFixed(1)}
                                </p>
                                <p className="text-xs text-teal-200">
                                  Average Score
                                </p>
                                {reportCard.position_in_class && (
                                  <p className="text-sm font-bold mt-1 flex items-center justify-end gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    {reportCard.position_in_class}
                                    {ordinal(
                                      reportCard.position_in_class,
                                    )} of {reportCard.class_size}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Remarks */}
                          {reportCard.remarks && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3">
                              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Teacher's Remarks
                              </p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {reportCard.remarks}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}

                    {/* ASSIGNMENTS TAB */}
                    {activeTab === "assignments" &&
                      (assignments.length === 0 ? (
                        <div className="text-center py-12">
                          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <p className="font-semibold text-slate-600 dark:text-slate-300">
                            No assignments found
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {assignments.map((a) => {
                            const isDue =
                              a.due_date && new Date(a.due_date) < new Date();
                            return (
                              <motion.div
                                key={a.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              >
                                <div>
                                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                                    {a.title}
                                  </p>
                                  {a.course_title && (
                                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                                      {a.course_title}
                                    </p>
                                  )}
                                  {a.description && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                      {a.description}
                                    </p>
                                  )}
                                </div>
                                {a.due_date && (
                                  <span
                                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex items-center gap-1
                                    ${isDue ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"}`}
                                  >
                                    <Clock className="w-3 h-3" />
                                    {isDue ? "Overdue" : "Due"}{" "}
                                    {new Date(a.due_date).toLocaleDateString(
                                      "en-GB",
                                      { day: "numeric", month: "short" },
                                    )}
                                  </span>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParentPortal;
