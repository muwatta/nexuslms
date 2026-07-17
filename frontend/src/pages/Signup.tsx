// pages/Signup.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  GraduationCap,
  Building2,
  Phone,
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../api";

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    email: "",
    role: "student",
    department: "western",
    student_class: "JSS1",
    bio: "",
    phone: "",
    parent_email: "",
  });

  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [classChoices, setClassChoices] = useState<
    { value: string; label: string }[]
  >([]);
  const [currentStep, setCurrentStep] = useState(1);

  const departments = [
    {
      value: "western",
      label: "Western School",
      icon: "🌍",
      color: "from-blue-500 to-cyan-400",
      desc: "English & International Curriculum",
    },
    {
      value: "arabic",
      label: "Arabic School",
      icon: "🕌",
      color: "from-emerald-500 to-teal-400",
      desc: "Arabic Language & Islamic Studies",
    },
    {
      value: "programming",
      label: "Programming",
      icon: "💻",
      color: "from-violet-500 to-purple-400",
      desc: "Coding & Tech Skills",
    },
  ];

  const roles = [
    {
      value: "student",
      label: "Student",
      icon: GraduationCap,
      desc: "Start learning",
    },
    { value: "parent", label: "Parent", icon: Users, desc: "Monitor progress" },
    {
      value: "teacher",
      label: "Teacher",
      icon: BookOpen,
      desc: "Join our faculty",
    },
  ];

  useEffect(() => {
    const fetchClassChoices = async () => {
      try {
        const response = await api.get(
          `/class-choices/?department=${formData.department}`,
        );
        setClassChoices(response.data.classes);
        if (
          response.data.classes.length > 0 &&
          !response.data.classes.find(
            (c: { value: string; label: string }) =>
              c.value === formData.student_class,
          )
        ) {
          setFormData((prev) => ({
            ...prev,
            student_class: response.data.classes[0].value,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch class choices:", err);
      }
    };
    if (formData.role === "student") {
      fetchClassChoices();
    }
  }, [formData.department, formData.role]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === "student" && {
          department: formData.department,
          student_class: formData.student_class,
          bio: formData.bio,
          phone: formData.phone,
          parent_email: formData.parent_email,
        }),
      };
      await api.post("/register/", payload);
      setMessage("✅ Registration successful! Please login.");
      setFormData({
        first_name: "",
        last_name: "",
        username: "",
        password: "",
        email: "",
        role: "student",
        department: "western",
        student_class: "JSS1",
        bio: "",
        phone: "",
        parent_email: "",
      });
      setCurrentStep(1);
    } catch (err: any) {
      setMessage("❌ " + (err.response?.data?.error || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return (
        formData.first_name &&
        formData.last_name &&
        formData.username &&
        formData.email &&
        formData.password
      );
    }
    if (currentStep === 2 && formData.role === "student") {
      return formData.department && formData.student_class;
    }
    return true;
  };

  const nextStep = () => {
    if (isStepValid() && currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const inputClasses = (fieldName: string) => `
    w-full bg-gray-50 dark:bg-gray-900/50 border-2 rounded-xl px-4 py-3 pl-11
    transition-all duration-200 outline-none
    ${
      focusedField === fieldName
        ? "border-blue-500 bg-white dark:bg-gray-800 shadow-lg shadow-blue-500/20"
        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
    }
    text-gray-900 dark:text-white placeholder:text-gray-400
  `;

  return (
    <Layout showBackButton backTo="/" showNextButton nextTo="/login">
      <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-2xl"
        >
          {/* Glass Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="relative px-8 pt-8 pb-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/20 dark:to-purple-600/20 border-b border-slate-200 dark:border-slate-800">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 mb-4">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Create Your Account
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Join thousands of students achieving excellence
                </p>
              </motion.div>

              {/* Progress Steps */}
              <div className="flex justify-center mt-6 gap-2">
                {[1, 2].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      step <= currentStep
                        ? "w-8 bg-blue-500"
                        : "w-4 bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Role Selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                          I want to join as a...
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {roles.map((role) => {
                            const Icon = role.icon;
                            return (
                              <button
                                key={role.value}
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    role: role.value,
                                  }))
                                }
                                className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 text-center
                                  ${
                                    formData.role === role.value
                                      ? "border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                                  }`}
                              >
                                <Icon className="w-6 h-6" />
                                <div>
                                  <div className="text-sm font-semibold">
                                    {role.label}
                                  </div>
                                  <div className="text-xs opacity-70">
                                    {role.desc}
                                  </div>
                                </div>
                                {formData.role === role.value && (
                                  <motion.div
                                    layoutId="role-check"
                                    className="absolute top-2 right-2"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                  </motion.div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField("first_name")}
                            onBlur={() => setFocusedField(null)}
                            required
                            placeholder="First Name"
                            className={inputClasses("first_name")}
                          />
                        </div>
                        <div className="relative">
                          <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            onFocus={() => setFocusedField("last_name")}
                            onBlur={() => setFocusedField(null)}
                            required
                            placeholder="Last Name"
                            className={inputClasses("last_name")}
                          />
                        </div>
                      </div>

                      {/* Username & Email */}
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField("username")}
                          onBlur={() => setFocusedField(null)}
                          required
                          placeholder="Username"
                          className={inputClasses("username")}
                        />
                      </div>

                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField(null)}
                          required
                          placeholder="Email Address"
                          className={inputClasses("email")}
                        />
                      </div>

                      {/* Password */}
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          required
                          placeholder="Password"
                          className={inputClasses("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && formData.role === "student" && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Department Selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                          Select Your Department
                        </label>
                        <div className="space-y-3">
                          {departments.map((dept) => (
                            <button
                              key={dept.value}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  department: dept.value,
                                }))
                              }
                              className={`w-full relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group text-left
                                ${
                                  formData.department === dept.value
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                                }`}
                            >
                              <div
                                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${dept.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}
                              >
                                {dept.icon}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-slate-900 dark:text-white text-lg">
                                  {dept.label}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  {dept.desc}
                                </div>
                              </div>
                              {formData.department === dept.value && (
                                <CheckCircle2 className="w-6 h-6 text-blue-500 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Class Selection */}
                      <div className="relative">
                        <BookOpen className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                        <select
                          name="student_class"
                          value={formData.student_class}
                          onChange={handleInputChange}
                          className={`${inputClasses("student_class")} appearance-none cursor-pointer`}
                        >
                          {classChoices.map((cls) => (
                            <option
                              key={cls.value}
                              value={cls.value}
                              className="bg-white dark:bg-slate-800"
                            >
                              {cls.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Bio */}
                      <div>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Tell us about yourself (optional)..."
                          className="w-full bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all resize-none outline-none"
                        />
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Phone Number"
                            className={inputClasses("phone")}
                          />
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                          <input
                            type="email"
                            name="parent_email"
                            value={formData.parent_email}
                            onChange={handleInputChange}
                            placeholder="Parent's Email"
                            className={inputClasses("parent_email")}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex items-center gap-3 p-4 rounded-xl ${
                        message.includes("✅")
                          ? "bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400"
                          : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {message.includes("✅") ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                      <span className="text-sm font-medium">
                        {message.replace(/[✅❌]\s*/, "")}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Back
                    </button>
                  )}

                  {currentStep === 1 && formData.role === "student" ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid()}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        (currentStep === 2 &&
                          formData.role === "student" &&
                          !isStepValid())
                      }
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          Create Account
                          <Sparkles className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="text-blue-600 hover:text-blue-500 font-semibold transition-colors"
                  >
                    Sign in
                  </a>
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Signup;
