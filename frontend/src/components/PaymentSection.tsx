import React, { useEffect, useState } from "react";
import api from "../api";

interface Profile {
  id: number;
  role: string;
  user: { username: string };
}

interface Payment {
  id: number;
  student: number;
  amount: number;
  reference: string;
  status: string;
  receipt?: string;
  created_at: string;
}

interface Props {
  profile: Profile;
}

const PaymentSection: React.FC<Props> = ({ profile }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const load = () => {
    api
      .get("/payments/")
      .then((res) => setPayments(res.data))
      .catch(() => setPayments([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleFile = async (id: number, file: File) => {
    const fd = new FormData();
    fd.append("receipt", file);
    setUploadingId(id);
    try {
      await api.patch(`/payments/${id}/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingId(null);
    }
  };

  const verify = async (id: number, status: string) => {
    try {
      await api.patch(`/payments/${id}/`, { status });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const [showNew, setShowNew] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createPayment = async () => {
    try {
      await api.post("/payments/", {
        amount: newAmount,
        reference: `manual-${Date.now()}`,
      });
      setNewAmount("");
      setShowNew(false);
      load();
    } catch (e) {
      console.error(e);
      setError("Failed to create payment. Please try again.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      {(profile.role === "student" || profile.role === "parent") && (
        <div className="mb-2">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mb-2">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          )}
          {showNew ? (
            <div className="flex gap-2">
              <input
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="amount"
                className="border p-1"
              />
              <button
                onClick={createPayment}
                className="px-2 py-1 bg-green-600 text-white rounded"
              >
                Create
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="px-2 py-1 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNew(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              New Payment
            </button>
          )}
        </div>
      )}

      {payments.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No payment records</p>
      ) : (
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th className="p-2">Amount</th>
              <th className="p-2">Ref</th>
              <th className="p-2">Status</th>
              <th className="p-2">Receipt</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.amount}</td>
                <td className="p-2">{p.reference}</td>
                <td className="p-2 capitalize">{p.status}</td>
                <td className="p-2">
                  {p.receipt ? (
                    <a href={p.receipt} target="_blank" rel="noreferrer">
                      view
                    </a>
                  ) : (
                    <span className="text-gray-500">none</span>
                  )}
                </td>
                <td className="p-2">
                  {profile.role === "student" && !p.receipt && (
                    <label className="inline-block px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFile(p.id, e.target.files[0]);
                          }
                        }}
                      />
                      {uploadingId === p.id ? "Uploading..." : "Upload"}
                    </label>
                  )}
                  {(profile.role === "teacher" ||
                    profile.role === "instructor" ||
                    profile.role === "admin") &&
                    p.status === "pending" && (
                      <>
                        <button
                          onClick={() => verify(p.id, "successful")}
                          className="text-green-600 mr-2"
                        >
                          ✅
                        </button>
                        <button
                          onClick={() => verify(p.id, "failed")}
                          className="text-red-600"
                        >
                          ❌
                        </button>
                      </>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PaymentSection;
