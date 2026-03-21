import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../api";
import { getUserData, setUserData, UserData } from "../utils/authUtils";
import BackButton from "../components/BackButton";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Edit2,
  Save,
  X,
  Loader2,
  GraduationCap,
  Building2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfile {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  role: string;
  department?: string;
  student_class?: string;
  student_id?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

type FormField = keyof Omit<UserProfileFormData, "bio"> | "bio";

interface UserProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; label: string }
> = {
  admin: {
    color:
      "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800",
    icon: <Building2 className="w-3 h-3" />,
    label: "Administrator",
  },
  super_admin: {
    color:
      "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800",
    icon: <Building2 className="w-3 h-3" />,
    label: "Super Admin",
  },
  instructor: {
    color:
      "bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-800",
    icon: <GraduationCap className="w-3 h-3" />,
    label: "Instructor",
  },
  school_admin: {
    color:
      "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800",
    icon: <Building2 className="w-3 h-3" />,
    label: "School Admin",
  },
  student: {
    color:
      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    icon: <User className="w-3 h-3" />,
    label: "Student",
  },
};

// ─── Utilities ────────────────────────────────────────────────────────────────
const getInitials = (profile: UserProfile | null): string => {
  if (!profile) return "U";
  const { first_name, last_name, username } = profile.user;
  if (first_name && last_name)
    return `${first_name[0]}${last_name[0]}`.toUpperCase();
  if (first_name) return first_name[0].toUpperCase();
  return username?.[0]?.toUpperCase() ?? "U";
};

const getDisplayName = (profile: UserProfile | null): string => {
  if (!profile) return "";
  const { first_name, last_name, username } = profile.user;
  if (first_name && last_name) return `${first_name} ${last_name}`;
  if (first_name) return first_name;
  return username ?? "";
};

const formatRole = (role: string): string => {
  return (
    ROLE_CONFIG[role]?.label ||
    role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

// ─── Components ───────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  value: string;
  field: FormField;
  type?: "text" | "email" | "tel" | "textarea";
  icon?: React.ReactNode;
  editing: boolean;
  onChange: (field: FormField, value: string) => void;
  placeholder?: string;
}

const FormField: React.FC<FormFieldProps> = React.memo(
  ({
    label,
    value,
    field,
    type = "text",
    icon,
    editing,
    onChange,
    placeholder,
  }) => {
    const inputClasses = `
    w-full px-3 py-2.5 text-sm 
    bg-white dark:bg-gray-800
    border border-gray-200 dark:border-gray-600
    rounded-lg 
    focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
    dark:focus:ring-blue-500/20 dark:focus:border-blue-400
    transition-all duration-200
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    ${icon ? "pl-10" : ""}
  `;

    return (
      <div className="group">
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
        <div className="relative">
          {icon && !editing && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </span>
          )}
          {editing ? (
            type === "textarea" ? (
              <textarea
                value={value}
                onChange={(e) => onChange(field, e.target.value)}
                rows={3}
                placeholder={placeholder}
                className={`${inputClasses} resize-none`}
              />
            ) : (
              <input
                type={type}
                value={value}
                onChange={(e) => onChange(field, e.target.value)}
                placeholder={placeholder}
                className={inputClasses}
              />
            )
          ) : (
            <div
              className={`
            px-3 py-2.5 text-sm rounded-lg min-h-[42px] flex items-center
            ${
              value
                ? "bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100"
                : "bg-gray-50/50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-500 italic"
            }
            ${icon ? "pl-10" : ""}
            border border-transparent
          `}
            >
              {value || "Not set"}
            </div>
          )}
        </div>
      </div>
    );
  },
);

FormField.displayName = "FormField";

interface AlertProps {
  message: string;
  type: "success" | "error";
  onDismiss?: () => void;
}

const Alert: React.FC<AlertProps> = ({ message, type, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.95 }}
    className={`
      mb-6 p-4 rounded-xl flex items-start gap-3
      ${
        type === "success"
          ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
          : "bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800"
      }
    `}
  >
    {type === "success" ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
    ) : (
      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
    )}
    <div className="flex-1">
      <p
        className={`text-sm font-medium ${type === "success" ? "text-emerald-800 dark:text-emerald-200" : "text-rose-800 dark:text-rose-200"}`}
      >
        {message}
      </p>
    </div>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [formData, setFormData] = useState<UserProfileFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  });

  // ── Derived State ───────────────────────────────────────────────────────────
  const roleConfig = useMemo(() => {
    if (!profile) return null;
    return (
      ROLE_CONFIG[profile.role] || {
        color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
        icon: <User className="w-3 h-3" />,
        label: formatRole(profile.role),
      }
    );
  }, [profile?.role]);

  const hasStudentInfo = useMemo(
    () => profile?.student_id || profile?.student_class,
    [profile],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFieldChange = useCallback((field: FormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const applyProfile = useCallback((data: UserProfile) => {
    setProfile(data);
    setFormData({
      first_name: data.user?.first_name ?? "",
      last_name: data.user?.last_name ?? "",
      email: data.user?.email ?? "",
      phone: data.phone ?? "",
      address: data.address ?? "",
      bio: data.bio ?? "",
    });
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/profiles/me/");
      applyProfile(res.data);
    } catch {
      try {
        const res = await api.get("/profiles/");
        const profiles = res.data?.results ?? res.data;
        if (Array.isArray(profiles) && profiles.length > 0) {
          applyProfile(profiles[0]);
        } else {
          setMessage({ text: "Failed to load profile data", type: "error" });
        }
      } catch {
        setMessage({ text: "Failed to load profile data", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  const handleSave = useCallback(async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.patch("/profiles/update_me/", {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        bio: formData.bio.trim(),
      });

      const updated: UserProfile = res.data;
      applyProfile(updated);

      // Sync localStorage
      const stored = getUserData();
      if (stored) {
        const synced: UserData = {
          ...stored,
          firstName: updated.user?.first_name ?? stored.firstName,
          lastName: updated.user?.last_name ?? stored.lastName,
          email: updated.user?.email ?? stored.email,
        };
        setUserData(synced);
      }

      setEditing(false);
      setMessage({ text: "Profile updated successfully!", type: "success" });

      // Auto-dismiss success message
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ??
        Object.values(err?.response?.data ?? {})[0] ??
        "Failed to update profile. Please try again.";
      setMessage({ text: String(detail), type: "error" });
    } finally {
      setSaving(false);
    }
  }, [profile, formData, applyProfile]);

  const handleCancel = useCallback(() => {
    if (profile) applyProfile(profile);
    setEditing(false);
    setMessage(null);
  }, [profile, applyProfile]);

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editing) return;
      if (e.key === "Escape") {
        handleCancel();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editing, handleCancel, handleSave]);

  // ── Render States ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Loading profile...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 sm:p-6">
        <BackButton />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-center"
        >
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-200 mb-1">
            Failed to load profile
          </h3>
          <p className="text-rose-700 dark:text-rose-300 text-sm">
            Please try refreshing the page or contact support.
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="p-3 sm:p-6 max-w-5xl mx-auto"
    >
      <div className="mb-4 sm:mb-6">
        <BackButton />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header Banner */}
        <div className="h-32 sm:h-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        </div>

        <div className="px-4 sm:px-8 pb-8">
          {/* Avatar & Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 sm:-mt-16 mb-6">
            <motion.div whileHover={{ scale: 1.02 }} className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl ring-4 ring-white dark:ring-gray-900 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg">
                {getInitials(profile)}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-900 rounded-full"
                title="Online"
              />
            </motion.div>

            <div className="flex gap-2 sm:mb-2">
              {!editing ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-600/20 disabled:shadow-none"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Identity Section */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {getDisplayName(profile) || (
                <span className="text-gray-400 font-normal text-lg">
                  Complete your profile
                </span>
              )}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">
              @{profile.user.username}
            </p>

            <div className="flex flex-wrap gap-2">
              {roleConfig && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${roleConfig.color}`}
                >
                  {roleConfig.icon}
                  {roleConfig.label}
                </span>
              )}
              {profile.department && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                  <Building2 className="w-3 h-3" />
                  {profile.department.charAt(0).toUpperCase() +
                    profile.department.slice(1)}
                </span>
              )}
            </div>
          </div>

          {/* Alert Messages */}
          <AnimatePresence mode="wait">
            {message && (
              <Alert
                message={message.text}
                type={message.type}
                onDismiss={() => setMessage(null)}
              />
            )}
          </AnimatePresence>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column: Student Info & Bio */}
            <div className="lg:col-span-1 space-y-6">
              <AnimatePresence>
                {hasStudentInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800"
                  >
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Academic Information
                    </h3>
                    <div className="space-y-3">
                      {profile.student_id && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            Student ID
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono bg-white dark:bg-gray-900 px-2 py-1 rounded">
                            {profile.student_id}
                          </span>
                        </div>
                      )}
                      {profile.student_class && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            Class
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {profile.student_class}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  About
                </h3>
                <FormField
                  label="Bio"
                  value={formData.bio}
                  field="bio"
                  type="textarea"
                  editing={editing}
                  onChange={handleFieldChange}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {/* Right Column: Personal Information */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    label="First Name"
                    value={formData.first_name}
                    field="first_name"
                    editing={editing}
                    onChange={handleFieldChange}
                    icon={<User className="w-4 h-4" />}
                    placeholder="Enter first name"
                  />
                  <FormField
                    label="Last Name"
                    value={formData.last_name}
                    field="last_name"
                    editing={editing}
                    onChange={handleFieldChange}
                    icon={<User className="w-4 h-4" />}
                    placeholder="Enter last name"
                  />
                  <FormField
                    label="Email Address"
                    value={formData.email}
                    field="email"
                    type="email"
                    editing={editing}
                    onChange={handleFieldChange}
                    icon={<Mail className="w-4 h-4" />}
                    placeholder="your@email.com"
                  />
                  <FormField
                    label="Phone Number"
                    value={formData.phone}
                    field="phone"
                    type="tel"
                    editing={editing}
                    onChange={handleFieldChange}
                    icon={<Phone className="w-4 h-4" />}
                    placeholder="+1 (555) 000-0000"
                  />
                  <div className="sm:col-span-2">
                    <FormField
                      label="Address"
                      value={formData.address}
                      field="address"
                      type="textarea"
                      editing={editing}
                      onChange={handleFieldChange}
                      icon={<MapPin className="w-4 h-4" />}
                      placeholder="Enter your full address"
                    />
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts Hint */}
              {editing && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center"
                >
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-mono">
                    Ctrl+S
                  </kbd>{" "}
                  to save or{" "}
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-mono">
                    Esc
                  </kbd>{" "}
                  to cancel
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
