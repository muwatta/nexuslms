// frontend/src/pages/ForgotPassword.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../api";

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<"email" | "verify" | "reset" | "success">(
    "email",
  );
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/password-reset-request/", { email });
      setMessage("Verification code sent to your email");
      setStep("verify");
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "Failed to send reset code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/verify-otp/", { email, otp });
      setStep("reset");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/password-reset-confirm/", {
        email,
        otp,
        new_password: newPassword,
      });
      setStep("success");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = (fieldName: string) => `
    w-full bg-slate-50 dark:bg-slate-800/50 border-2 rounded-xl px-4 py-3.5 pl-12
    transition-all duration-200 outline-none
    ${
      focusedField === fieldName
        ? "border-blue-500 bg-white dark:bg-slate-800 shadow-lg shadow-blue-500/20"
        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
    }
    text-slate-900 dark:text-white placeholder:text-slate-400
  `;

  return (
    <Layout showBackButton backTo="/login" showNextButton nextTo="/login">
      <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-400/20 to-violet-400/20 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 dark:shadow-black/50 border border-white/20 dark:border-slate-700/50 overflow-hidden">
            <div className="relative px-8 pt-10 pb-6">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
              >
                <Lock className="w-8 h-8 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-2"
              >
                {step === "email" && "Reset Password"}
                {step === "verify" && "Verify Email"}
                {step === "reset" && "New Password"}
                {step === "success" && "Success!"}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-slate-500 dark:text-slate-400"
              >
                {step === "email" &&
                  "Enter your email to receive a verification code"}
                {step === "verify" &&
                  "Enter the 6-digit code sent to your email"}
                {step === "reset" && "Create a strong new password"}
                {step === "success" &&
                  "Your password has been reset successfully"}
              </motion.p>
            </div>

            <div className="px-8 pb-8">
              <AnimatePresence mode="wait">
                {step === "email" && (
                  <motion.form
                    key="email"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleRequestReset}
                    className="space-y-5"
                  >
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Enter your email address"
                        className={inputClasses("email")}
                        required
                      />
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        >
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {error}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      disabled={loading || !email}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Code</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}

                {step === "verify" && (
                  <motion.form
                    key="verify"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleVerifyOTP}
                    className="space-y-5"
                  >
                    <div className="relative">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        onFocus={() => setFocusedField("otp")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Enter 6-digit code"
                        className={`${inputClasses("otp")} text-center text-2xl tracking-widest font-mono`}
                        maxLength={6}
                        required
                      />
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                      Didn't receive the code?{" "}
                      <button
                        type="button"
                        onClick={() => setStep("email")}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Resend
                      </button>
                    </p>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        >
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {error}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify Code</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}

                {step === "reset" && (
                  <motion.form
                    key="reset"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleResetPassword}
                    className="space-y-5"
                  >
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onFocus={() => setFocusedField("newPassword")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="New password"
                        className={`${inputClasses("newPassword")} pr-12`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Confirm new password"
                        className={inputClasses("confirmPassword")}
                        required
                      />
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        >
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {error}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      type="submit"
                      disabled={loading || !newPassword || !confirmPassword}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Resetting...</span>
                        </>
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6"
                  >
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>

                    <p className="text-slate-600 dark:text-slate-300">
                      Your password has been successfully reset. You can now log
                      in with your new password.
                    </p>

                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back to Login
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>

              {step !== "success" && (
                <p className="mt-8 text-center text-slate-600 dark:text-slate-400">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                  >
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
