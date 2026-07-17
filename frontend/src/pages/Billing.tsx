import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Check,
  AlertTriangle,
  Building2,
  Users,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import api from "../api";
import { useTenant } from "../hooks/useTenant";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "15,000",
    period: "/month",
    features: [
      "Up to 200 students",
      "Up to 30 teachers",
      "Up to 100 courses",
      "All departments",
      "Basic analytics",
      "Email support",
    ],
    limits: { students: 200, teachers: 30, courses: 100 },
  },
  {
    id: "pro",
    name: "Professional",
    price: "35,000",
    period: "/month",
    popular: true,
    features: [
      "Up to 500 students",
      "Up to 80 teachers",
      "Up to 300 courses",
      "All departments",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
    ],
    limits: { students: 500, teachers: 80, courses: 300 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "80,000",
    period: "/month",
    features: [
      "Up to 5,000 students",
      "Up to 500 teachers",
      "Up to 2,000 courses",
      "All departments",
      "Full analytics suite",
      "Dedicated support",
      "Custom branding",
      "API access",
    ],
    limits: { students: 5000, teachers: 500, courses: 2000 },
  },
];

const Billing: React.FC = () => {
  const navigate = useNavigate();
  const { school, refreshSchool } = useTenant();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(true);
      setMessage("");
      const res = await api.post("/billing/initialize/", {
        plan: planId,
        callback_url: `${window.location.origin}/billing?verify=1`,
      });

      const { authorization_url } = res.data;
      if (authorization_url) {
        window.location.href = authorization_url;
      }
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Failed to initialize payment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    if (reference) {
      verifyPayment(reference);
    }
  }, []);

  const verifyPayment = async (reference: string) => {
    try {
      setLoading(true);
      await api.post("/billing/verify/", { reference });
      setMessage("Payment verified! Your plan has been activated.");
      await refreshSchool();
      window.history.replaceState({}, "", "/billing");
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Payment verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const planColor = (planId: string) => {
    switch (planId) {
      case "starter":
        return "border-slate-200 dark:border-slate-700";
      case "pro":
        return "border-teal-400 dark:border-teal-500 ring-2 ring-teal-400/30";
      case "enterprise":
        return "border-indigo-400 dark:border-indigo-500";
      default:
        return "border-slate-200 dark:border-slate-700";
    }
  };

  const trialDaysLeft = () => {
    if (!school?.trial_ends_at) return 0;
    const diff = new Date(school.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Billing & Plans
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage your subscription and billing for {school?.name || "your school"}.
          </p>
        </div>

        {/* Current Plan Status */}
        {school && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Current Plan:{" "}
                  <span className="capitalize text-teal-600 dark:text-teal-400">
                    {school.plan}
                  </span>
                </h2>
                {school.plan === "free" && school.trial_ends_at && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <AlertTriangle size={14} className="inline mr-1" />
                    {trialDaysLeft() > 0
                      ? `${trialDaysLeft()} days left in free trial`
                      : "Free trial expired"}
                  </p>
                )}
                {school.expires_at && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Renews: {new Date(school.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Users size={14} /> {school.max_students} students
                </div>
                <div className="flex items-center gap-1">
                  <Building2 size={14} /> {school.max_teachers} teachers
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen size={14} /> {school.max_courses} courses
                </div>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-sm ${
              message.includes("activated") || message.includes("verified")
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = school?.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-slate-900 rounded-xl border-2 p-6 transition-all hover:shadow-lg ${planColor(plan.id)} ${
                  isCurrent ? "opacity-100" : "opacity-100"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {plan.name}
                </h3>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    ₦{plan.price}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {plan.period}
                  </span>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                    >
                      <Check
                        size={16}
                        className="text-teal-500 mt-0.5 shrink-0"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || isCurrent}
                  className={`mt-6 w-full py-3 rounded-lg font-semibold text-sm transition-colors ${
                    isCurrent
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : plan.popular
                        ? "bg-teal-600 hover:bg-teal-700 text-white"
                        : "bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900"
                  }`}
                >
                  {isCurrent
                    ? "Current Plan"
                    : loading
                      ? "Processing..."
                      : "Subscribe"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Billing;
