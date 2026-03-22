// frontend/src/components/Navbar.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  handleLogout,
  getUserData,
  resolvePermissions,
  getDashboardRouteByRole,
} from "../utils/authUtils";
import { Link, useLocation } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import api from "../api";

interface NavItem {
  to?: string;
  label: string;
  icon: string;
  alwaysShow?: boolean;
  children?: NavItem[];
}

const DEPT_LABEL: Record<string, string> = {
  western: "Western Education",
  arabic: "Arabic/Islamic Studies",
  programming: "Digital Technology",
};

const DEPT_ACCENT: Record<string, { from: string; to: string }> = {
  western: { from: "#1d4ed8", to: "#0ea5e9" },
  arabic: { from: "#065f46", to: "#10b981" },
  programming: { from: "#5b21b6", to: "#8b5cf6" },
};

const DEFAULT_ACCENT = { from: "#0f766e", to: "#4f46e5" };

// ── Role-based nav ─────────────────────────────────────────────────────────────
function buildNav(
  role: string,
  dept: string,
  teacherType: string | null,
): NavItem[] {
  // ── Teacher ─────────────────────────────────────────────────────────────────
  if (role === "teacher" || role === "instructor") {
    const dashRoute =
      teacherType === "class"
        ? "/class-teacher-dashboard"
        : teacherType === "subject"
          ? "/subject-teacher-dashboard"
          : "/dashboard";

    return [
      { to: dashRoute, label: "Dashboard", icon: "🏠", alwaysShow: true },
      {
        to: "/assignments",
        label: "Assignments",
        icon: "📝",
        alwaysShow: true,
      },
      { to: "/courses", label: "Courses", icon: "📚", alwaysShow: true },
      { to: "/ai", label: "AI Help", icon: "🤖", alwaysShow: true },
      { to: "/profile", label: "Profile", icon: "👤", alwaysShow: true },
    ];
  }

  // ── Student ─────────────────────────────────────────────────────────────────
  if (role === "student") {
    return [
      { to: "/dashboard", label: "Dashboard", icon: "🏠", alwaysShow: true },
      { to: "/courses", label: "Courses", icon: "📚", alwaysShow: true },
      {
        to: "/assignments",
        label: "Assignments",
        icon: "📝",
        alwaysShow: true,
      },
      { to: "/quizzes", label: "Quizzes", icon: "🧠", alwaysShow: true },
      { to: "/ai", label: "AI Help", icon: "🤖", alwaysShow: true },
      { to: "/profile", label: "Profile", icon: "👤", alwaysShow: true },
    ];
  }

  // ── Parent ──────────────────────────────────────────────────────────────────
  if (role === "parent") {
    return [
      {
        to: "/parent-portal",
        label: "My Children",
        icon: "👨‍👩‍👧",
        alwaysShow: true,
      },
      { to: "/ai", label: "AI Help", icon: "🤖", alwaysShow: true },
      { to: "/profile", label: "Profile", icon: "👤", alwaysShow: true },
    ];
  }

  // ── School Admin ─────────────────────────────────────────────────────────────
  if (role === "school_admin") {
    const deptRoute =
      dept === "western"
        ? "/western-dashboard"
        : dept === "arabic"
          ? "/arabic-dashboard"
          : dept === "programming"
            ? "/digital-dashboard"
            : "/dashboard";

    return [
      { to: deptRoute, label: "Dashboard", icon: "🏠", alwaysShow: true },
      {
        label: "Academic",
        icon: "📖",
        children: [
          { to: "/courses", label: "All Courses", icon: "📚" },
          { to: "/assignments", label: "Assignments", icon: "📝" },
          { to: "/quizzes", label: "Quizzes", icon: "🧠" },
          { to: "/enrollments", label: "Enrollments", icon: "🎓" },
        ],
      },
      {
        label: "Student Life",
        icon: "🏆",
        children: [
          { to: "/achievements", label: "Achievements", icon: "🏆" },
          { to: "/projects", label: "Projects", icon: "🗂️" },
          { to: "/milestones", label: "Milestones", icon: "🚀" },
        ],
      },
      {
        label: "Admin",
        icon: "⚙️",
        children: [
          { to: "/manage-users", label: "Manage Users", icon: "👥" },
          { to: "/payments", label: "Payments", icon: "💳" },
          { to: "/analytics", label: "Analytics", icon: "📊" },
        ],
      },
      { to: "/ai", label: "AI Help", icon: "🤖", alwaysShow: true },
      { to: "/profile", label: "Profile", icon: "👤", alwaysShow: true },
    ];
  }

  // ── Super Admin / Admin ──────────────────────────────────────────────────────
  return [
    {
      to: "/super-admin-portal",
      label: "Dashboard",
      icon: "🏠",
      alwaysShow: true,
    },
    {
      to: "/admin-dashboard",
      label: "Admin Panel",
      icon: "⚙️",
      alwaysShow: true,
    },
    {
      label: "Departments",
      icon: "🏫",
      children: [
        { to: "/western-dashboard", label: "Western School", icon: "🏛️" },
        { to: "/arabic-dashboard", label: "Arabic School", icon: "🕌" },
        { to: "/digital-dashboard", label: "Digital School", icon: "💻" },
      ],
    },
    {
      label: "Academic",
      icon: "📖",
      children: [
        { to: "/courses", label: "All Courses", icon: "📚" },
        { to: "/assignments", label: "Assignments", icon: "📝" },
        { to: "/quizzes", label: "Quizzes", icon: "🧠" },
        { to: "/enrollments", label: "Enrollments", icon: "🎓" },
      ],
    },
    {
      label: "Student Life",
      icon: "🏆",
      children: [
        { to: "/achievements", label: "Achievements", icon: "🏆" },
        { to: "/projects", label: "Projects", icon: "🗂️" },
        { to: "/milestones", label: "Milestones", icon: "🚀" },
        { to: "/parent-portal", label: "Parent Portal", icon: "👨‍👩‍👧" },
      ],
    },
    {
      label: "Admin",
      icon: "🔑",
      children: [
        { to: "/manage-users", label: "Manage Users", icon: "👥" },
        { to: "/payments", label: "Payments", icon: "💳" },
        { to: "/analytics", label: "Analytics", icon: "📊" },
      ],
    },
    { to: "/ai", label: "AI Help", icon: "🤖", alwaysShow: true },
    { to: "/profile", label: "Profile", icon: "👤", alwaysShow: true },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("dark_mode") === "true",
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [liveUser, setLiveUser] = useState<any>(() => getUserData());

  const isAuthenticated = !!localStorage.getItem("user_data");
  const drawerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const SESSION_KEY = "navbar_profile_fetched";

  const role = liveUser?.role ?? "";
  const dept = liveUser?.department ?? "";
  const teacherType =
    liveUser?.teacher_type ?? liveUser?.instructor_type ?? null;
  const accent = DEPT_ACCENT[dept] ?? DEFAULT_ACCENT;

  // Close on route change
  useEffect(() => {
    setOpenMenu(null);
    setDrawerOpen(false);
  }, [location.pathname]);

  // Fetch profile once per session
  useEffect(() => {
    if (!isAuthenticated) return;
    const cached = getUserData();
    if (cached) setLiveUser(cached);
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "true");
    api
      .get("/profiles/me/")
      .then((res) => {
        const p = res.data;
        const u = p.user || {};
        const r = p.role ?? "";
        const d = p.department ?? "";
        const tt = p.teacher_type ?? p.instructor_type ?? null;
        const norm = {
          id: p.id,
          username: u.username ?? "",
          firstName: u.first_name ?? "",
          lastName: u.last_name ?? "",
          first_name: u.first_name ?? "",
          last_name: u.last_name ?? "",
          email: u.email ?? "",
          role: r,
          department: d,
          teacher_type: tt,
          instructor_type: tt,
          student_class: p.student_class,
          student_id: p.student_id,
          phone: p.phone,
          bio: p.bio,
          permissions: resolvePermissions(r, d),
        };
        setLiveUser(norm);
        localStorage.setItem("user_data", JSON.stringify(norm));
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Cross-tab logout
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === "user_data" && !e.newValue) window.location.href = "/login";
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("dark_mode", String(darkMode));
  }, [darkMode]);

  // Close drawer on outside click
  useEffect(() => {
    if (!drawerOpen) return;
    const h = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node))
        setDrawerOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [drawerOpen]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleLogoutClick = useCallback(async () => {
    await handleLogout();
  }, []);

  const isActive = (to?: string) =>
    !!to &&
    (location.pathname === to ||
      (to !== "/dashboard" && to !== "/" && location.pathname.startsWith(to)));

  const navItems = buildNav(role, dept, teacherType);

  const initials = liveUser
    ? (
        ((liveUser.firstName || liveUser.first_name)?.[0] ?? "") +
        ((liveUser.lastName || liveUser.last_name)?.[0] ?? "")
      ).toUpperCase() || (liveUser.username?.[0] ?? "?").toUpperCase()
    : "?";

  const displayName = liveUser
    ? [
        liveUser.firstName || liveUser.first_name,
        liveUser.lastName || liveUser.last_name,
      ]
        .filter(Boolean)
        .join(" ") || liveUser.username
    : "";

  // ── Link styles ──────────────────────────────────────────────────────────────
  const linkStyle = (active: boolean, sub = false): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: sub ? "8px 12px 8px 36px" : "10px 14px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: sub ? "13px" : "14px",
    fontWeight: sub ? 400 : 500,
    color: active ? (sub ? accent.from : "white") : "#374151",
    background: active
      ? sub
        ? `${accent.from}12`
        : `linear-gradient(135deg, ${accent.from}, ${accent.to})`
      : "transparent",
    borderLeft: sub
      ? `3px solid ${active ? accent.from : "transparent"}`
      : "none",
    transition: "all 0.15s",
  });

  const groupBtnStyle = (anyActive: boolean): React.CSSProperties => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: anyActive
      ? `linear-gradient(135deg, ${accent.from}, ${accent.to})`
      : "transparent",
    color: anyActive ? "white" : "#374151",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    textAlign: "left",
    transition: "all 0.15s",
  });

  return (
    <>
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <nav
        style={{
          background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: "60px",
          boxShadow: "0 1px 20px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            height: "100%",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isAuthenticated && (
              <button
                onClick={() => setDrawerOpen((p) => !p)}
                style={{
                  color: "white",
                  width: "36px",
                  height: "36px",
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ☰
              </button>
            )}
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "16px",
                }}
              >
                M
              </div>
              <span
                style={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: "16px",
                  letterSpacing: "-0.3px",
                }}
              >
                Muwatta
              </span>
            </Link>
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  style={{
                    color: "white",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 500,
                    marginLeft: "8px",
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
            <button
              onClick={() => setDarkMode((p) => !p)}
              title="Toggle dark mode"
              style={{
                width: "36px",
                height: "36px",
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── Drawer ─────────────────────────────────────────────────────────── */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          height: "calc(100% - 60px)",
          width: "280px",
          zIndex: 50,
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
        }}
        className="bg-white dark:bg-gray-900"
      >
        {/* User strip */}
        {liveUser && (
          <div
            style={{
              padding: "14px 18px",
              background: `linear-gradient(135deg, ${accent.from}18, ${accent.to}10)`,
              borderBottom: `1px solid ${accent.from}25`,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "15px",
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${accent.from}40`,
                }}
              >
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  className="text-gray-900 dark:text-white"
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName || liveUser.username}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    marginTop: "3px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      background: `${accent.from}18`,
                      color: accent.from,
                      padding: "1px 8px",
                      borderRadius: "20px",
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    {role.replace(/_/g, " ")}
                  </span>
                  {dept && (
                    <span
                      className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
                      style={{
                        fontSize: "11px",
                        padding: "1px 8px",
                        borderRadius: "20px",
                        fontWeight: 500,
                      }}
                    >
                      {DEPT_LABEL[dept] ?? dept}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav
          style={{ flex: 1, padding: "8px" }}
          className="text-gray-700 dark:text-gray-200"
        >
          {navItems.map((item) => {
            // ── Group with children ──────────────────────────────────────
            if (item.children) {
              const isOpen = openMenu === item.label;
              const anyActive = item.children.some((c) => isActive(c.to));

              return (
                <div key={item.label}>
                  <button
                    onClick={() =>
                      setOpenMenu((p) => (p === item.label ? null : item.label))
                    }
                    style={groupBtnStyle(anyActive)}
                    onMouseEnter={(e) => {
                      if (!anyActive)
                        (e.currentTarget as HTMLElement).style.background =
                          darkMode ? "#1f2937" : "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      if (!anyActive)
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                    }}
                  >
                    <span
                      style={{
                        fontSize: "17px",
                        width: "22px",
                        textAlign: "center",
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span
                      style={{
                        fontSize: "10px",
                        opacity: 0.6,
                        transition: "transform 0.2s",
                        display: "inline-block",
                        transform: isOpen ? "rotate(180deg)" : "none",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1px",
                        marginBottom: "2px",
                      }}
                    >
                      {item.children.map((child) => {
                        const active = isActive(child.to);
                        return (
                          <Link
                            key={child.to}
                            to={child.to ?? "/"}
                            style={linkStyle(active, true)}
                            onMouseEnter={(e) => {
                              if (!active)
                                (
                                  e.currentTarget as HTMLElement
                                ).style.background = darkMode
                                  ? "#1f2937"
                                  : "#f9fafb";
                            }}
                            onMouseLeave={(e) => {
                              if (!active)
                                (
                                  e.currentTarget as HTMLElement
                                ).style.background = active
                                  ? `${accent.from}12`
                                  : "transparent";
                            }}
                          >
                            <span
                              style={{
                                fontSize: "14px",
                                width: "18px",
                                textAlign: "center",
                              }}
                            >
                              {child.icon}
                            </span>
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // ── Regular link ─────────────────────────────────────────────
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to!}
                style={linkStyle(active)}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background = darkMode
                      ? "#1f2937"
                      : "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                <span
                  style={{
                    fontSize: "17px",
                    width: "22px",
                    textAlign: "center",
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <span
                    style={{
                      marginLeft: "auto",
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "white",
                      flexShrink: 0,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          style={{ flexShrink: 0, borderTop: "1px solid", padding: "8px" }}
          className="border-gray-100 dark:border-gray-800"
        >
          <button
            onClick={handleLogoutClick}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "transparent",
              color: "#dc2626",
              border: "none",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "#fef2f2")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background =
                "transparent")
            }
          >
            <span
              style={{ fontSize: "17px", width: "22px", textAlign: "center" }}
            >
              🚪
            </span>
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;
