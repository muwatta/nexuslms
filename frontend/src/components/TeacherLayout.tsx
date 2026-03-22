// frontend/src/components/TeacherLayout.tsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserData } from "../utils/authUtils";
import { motion, AnimatePresence } from "framer-motion";

interface TeacherLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const TeacherLayout: React.FC<TeacherLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = getUserData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const teacherName = userData?.firstName
    ? `${userData.firstName} ${userData.lastName ?? ""}`.trim()
    : (userData?.username ?? "Teacher");
  const dept = userData?.department ?? "western";
  const teacherType = userData?.teacher_type ?? "subject";

  const initials =
    teacherName
      .split(" ")
      .map((n: string) => n[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "TA";

  const DEPT_THEME: Record<
    string,
    { bg: string; light: string; accent: string; icon: string }
  > = {
    western: {
      bg: "bg-blue-900",
      light: "bg-blue-800",
      accent: "#3b82f6",
      icon: "🏛️",
    },
    arabic: {
      bg: "bg-emerald-900",
      light: "bg-emerald-800",
      accent: "#10b981",
      icon: "🕌",
    },
    programming: {
      bg: "bg-violet-900",
      light: "bg-violet-800",
      accent: "#8b5cf6",
      icon: "💻",
    },
  };
  const theme = DEPT_THEME[dept] ?? DEPT_THEME.western;

  type SidebarItem = {
    label: string;
    icon: string;
    section?: string;
    path?: string;
    disabled?: boolean;
  };
  type SidebarSection = { title: string; items: SidebarItem[] };

  const sections: SidebarSection[] = [
    {
      title: "RESULT MANAGEMENT",
      items: [
        { label: "Result Entry", icon: "📊", section: "entry" },
        { label: "Load Score [Online]", icon: "🌐", section: "entry" },
        { label: "Load Score [Excel]", icon: "📥", disabled: true },
        { label: "Subject Spreadsheet", icon: "📋", disabled: true },
        { label: "Load Remark", icon: "💬", disabled: true },
      ],
    },
    {
      title: "REPORTS",
      items: [
        { label: "Student Report Card", icon: "📄", disabled: true },
        { label: "Class Report (Batch)", icon: "🗂️", disabled: true },
        { label: "Class Term Sheet", icon: "📊", disabled: true },
        { label: "Session Sheet", icon: "📈", disabled: true },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        { label: "Send Result via SMS", icon: "📱", disabled: true },
        { label: "Send Result Link", icon: "🔗", disabled: true },
        { label: "Comment Bank", icon: "💡", disabled: true },
      ],
    },
    {
      title: "ASSIGNMENTS",
      items: [{ label: "My Assignments", icon: "📝", section: "assignments" }],
    },
    {
      title: "ACCOUNT",
      items: [
        { label: "My Profile", icon: "👤", path: "/profile" },
        { label: "AI Help", icon: "🤖", path: "/ai" },
      ],
    },
  ];

  const handleItem = (item: SidebarItem) => {
    if (item.disabled) return;
    if (item.path) {
      navigate(item.path);
      setMobileOpen(false);
      return;
    }
    if (item.section && onSectionChange) {
      onSectionChange(item.section);
      setMobileOpen(false);
    }
  };

  const SidebarContent = () => (
    <div
      className={`flex flex-col h-full ${theme.bg} text-white`}
      style={{ width: collapsed ? 56 : 240 }}
    >
      {/* School header */}
      <div className={`${theme.light} px-3 py-4 shrink-0`}>
        <div className="flex items-center gap-2.5">
          <span className="text-2xl shrink-0">{theme.icon}</span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-black text-sm leading-tight truncate">
                Muwatta Academy
              </p>
              <p className="text-xs text-white/60 capitalize">{dept} Dept</p>
            </div>
          )}
        </div>
        {/* Teacher card */}
        {!collapsed && (
          <div className="mt-3 flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-black shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{teacherName}</p>
              <p className="text-[10px] text-white/50 capitalize">
                {teacherType} Teacher
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {sections.map((sec) => (
          <div key={sec.title} className="mb-1">
            {!collapsed && (
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                {sec.title}
              </p>
            )}
            {sec.items.map((item) => {
              const isActive = item.section && activeSection === item.section;
              return (
                <button
                  key={item.label}
                  onClick={() => handleItem(item)}
                  disabled={item.disabled}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all
                    ${
                      item.disabled
                        ? "text-white/25 cursor-not-allowed"
                        : isActive
                          ? "bg-white/15 text-white font-semibold border-l-2 border-white/60"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <span className="text-sm w-5 text-center shrink-0">
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="text-xs truncate flex-1">
                        {item.label}
                      </span>
                      {item.disabled && (
                        <span className="text-[9px] text-white/20 shrink-0 bg-white/5 px-1.5 py-0.5 rounded">
                          soon
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Logout */}
      <div className="shrink-0 border-t border-white/10 p-2">
        <button
          onClick={() => {
            localStorage.removeItem("user_data");
            window.location.href = "/login";
          }}
          className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
        >
          <span className="text-sm w-5 text-center shrink-0">🚪</span>
          {!collapsed && <span className="text-xs">Logout</span>}
        </button>
        {!collapsed && (
          <p className="text-[10px] text-white/20 text-center mt-1">
            NexusLMS · {new Date().getFullYear()}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <motion.div
        animate={{ width: collapsed ? 56 : 240 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex flex-col shrink-0 overflow-hidden"
      >
        <SidebarContent />
      </motion.div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full z-50 md:hidden"
              style={{ width: 240 }}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div
          className={`${theme.light} text-white px-4 py-2.5 flex items-center justify-between shrink-0 shadow-md`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCollapsed((v) => !v);
                setMobileOpen((v) => !v);
              }}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <div className="space-y-1">
                <div className="w-4 h-0.5 bg-white rounded" />
                <div className="w-3 h-0.5 bg-white rounded" />
                <div className="w-4 h-0.5 bg-white rounded" />
              </div>
            </button>
            <div>
              <p className="text-sm font-bold tracking-wide hidden sm:block">
                {teacherName.toUpperCase()}
              </p>
              <p className="text-xs text-white/60 hidden sm:block capitalize">
                {teacherType} teacher · {dept}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 hidden sm:block">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black cursor-pointer"
              style={{
                background: theme.accent + "40",
                border: `1px solid ${theme.accent}60`,
              }}
              onClick={() => navigate("/profile")}
            >
              {initials}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default TeacherLayout;
