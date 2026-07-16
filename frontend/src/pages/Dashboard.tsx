import React, { useEffect, useState } from "react";
import api from "../api";
import WesternDashboard from "./WesternDashboard";
import ArabicDashboard from "./ArabicDashboard";
import DigitalDashboard from "./ProgrammingDashboard";
import { getUserData } from "../utils/authUtils";

const Dashboard: React.FC = () => {
  const [department, setDepartment] = useState<string | null>(
    () => getUserData()?.department ?? null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/profiles/me/")
      .then((res) => {
        setDepartment(res.data?.department || "western");
      })
      .catch(() => {
        setDepartment("western");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="app-card w-full max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Preparing your dashboard
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Loading your learning space…
          </p>
        </div>
      </div>
    );
  }

  switch (department) {
    case "arabic":
      return <ArabicDashboard />;
    case "programming":
    case "digital":
      return <DigitalDashboard />;
    case "western":
    default:
      return <WesternDashboard />;
  }
};

export default Dashboard;
