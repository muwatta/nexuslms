// frontend/src/pages/Payments.tsx

import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import {
  getUserData,
  isAdmin as userIsAdmin,
  isTeacher as userIsTeacher,
  isStudent as userIsStudent,
} from "../utils/authUtils";
import { motion, AnimatePresence } from "framer-motion";

interface Payment {
  id: number;
  student: number;
  student_name?: string;
  student_id?: string;
  amount: number;
  description?: string;
  status: "pending" | "successful" | "failed" | "verified";
  receipt?: string;
  created_at: string;
  verified_by_name?: string;
}

const STATUS_STYLE: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  successful:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  verified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    n,
  );

const Payments: React.FC = () => {
  const userData = getUserData();
  const role = userData?.role ?? "";
  const isAdmin = userIsAdmin();
  const isTeacher = userIsTeacher();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "successful" | "verified" | "failed"
  >("all");
  const [search, setSearch] = useState("");

  // Upload receipt modal
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    amount: "",
    description: "",
    receipt: null as File | null,
  });
  const [uploading, setUploading] = useState(false);

  // Verify modal
  const [verifyId, setVerifyId] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);

  const notify = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get("/payments/", { params: { page_size: 200 } });
      const d = r.data;
      const list = Array.isArray(d)
        ? d
        : Array.isArray(d?.results)
          ? d.results
          : [];
      setPayments(list);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async () => {
    if (!uploadForm.amount) {
      notify(false, "Enter an amount");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("amount", uploadForm.amount);
      if (uploadForm.description)
        fd.append("description", uploadForm.description);
      if (uploadForm.receipt) fd.append("receipt", uploadForm.receipt);
      await api.post("/payments/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      notify(true, "Payment submitted");
      setShowUpload(false);
      setUploadForm({ amount: "", description: "", receipt: null });
      load();
    } catch (e: any) {
      notify(false, e?.response?.data?.detail ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (id: number) => {
    setVerifying(true);
    try {
      await api.post(`/payments/${id}/verify/`);
      notify(true, "Payment verified");
      setVerifyId(null);
      load();
    } catch (e: any) {
      notify(false, e?.response?.data?.detail ?? "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const filtered = payments.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.student_name ?? "").toLowerCase().includes(q) ||
        (p.student_id ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPending = payments.filter((p) => p.status === "pending").length;
  const totalVerified = payments.filter((p) =>
    ["verified", "successful"].includes(p.status),
  ).length;
  const totalAmount = payments
    .filter((p) => ["verified", "successful"].includes(p.status))
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-[60px]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium text-white
              ${toast.ok ? "bg-green-600" : "bg-red-600"}`}
          >
            {toast.ok ? "✅" : "❌"} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              💳 Payments
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isAdmin || isTeacher
                ? "Manage and verify student payments"
                : "Your payment history"}
            </p>
          </div>
          {!isAdmin && !isTeacher && (
            <button
              onClick={() => setShowUpload(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              + Submit Payment
            </button>
          )}
        </div>

        {/* Stats */}
        {(isAdmin || isTeacher) && (
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Total Payments",
                value: payments.length,
                color: "text-gray-700 dark:text-gray-200",
              },
              {
                label: "Pending",
                value: totalPending,
                color: "text-amber-600",
              },
              {
                label: "Verified",
                value: totalVerified,
                color: "text-green-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center shadow-sm"
              >
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
            {(
              ["all", "pending", "successful", "verified", "failed"] as const
            ).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors
                  ${filter === f ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or description…"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 font-semibold">❌ {error}</p>
              <button
                onClick={load}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">💳</p>
              <p className="font-semibold text-gray-600 dark:text-gray-300">
                No payments found
              </p>
              {!isAdmin && !isTeacher && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
                >
                  Submit your first payment
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white text-xs">
                  <tr>
                    {(isAdmin || isTeacher) && (
                      <th className="px-4 py-3 text-left">Student</th>
                    )}
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    {(isAdmin || isTeacher) && (
                      <th className="px-4 py-3 text-center">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50"} hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors`}
                    >
                      {(isAdmin || isTeacher) && (
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">
                            {p.student_name ?? `#${p.student}`}
                          </p>
                          {p.student_id && (
                            <p className="text-[10px] text-gray-400 font-mono">
                              {p.student_id}
                            </p>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                        {p.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-white">
                        {fmt(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_STYLE[p.status] ?? ""}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(p.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </td>
                      {(isAdmin || isTeacher) && (
                        <td className="px-4 py-3 text-center">
                          {p.status === "pending" ? (
                            <button
                              onClick={() => setVerifyId(p.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              Verify
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600">
                              —
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Total strip */}
        {totalAmount > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-5 py-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              Total Verified
            </p>
            <p className="text-xl font-black text-green-700 dark:text-green-300">
              {fmt(totalAmount)}
            </p>
          </div>
        )}
      </div>

      {/* Upload Receipt Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Submit Payment
                </h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    Amount (₦) *
                  </label>
                  <input
                    type="number"
                    value={uploadForm.amount}
                    onChange={(e) =>
                      setUploadForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    Description
                  </label>
                  <input
                    type="text"
                    value={uploadForm.description}
                    onChange={(e) =>
                      setUploadForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="e.g. First Term School Fees"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    Receipt (PDF/Image)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setUploadForm((f) => ({
                        ...f,
                        receipt: e.target.files?.[0] ?? null,
                      }))
                    }
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-blue-700"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUpload(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {uploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Payment"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verify Confirm Modal */}
      <AnimatePresence>
        {verifyId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            >
              <p className="text-4xl mb-3">✅</p>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                Verify Payment?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                This will mark the payment as verified and notify the student.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setVerifyId(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerify(verifyId!)}
                  disabled={verifying}
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {verifying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payments;
