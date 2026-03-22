// frontend/src/components/Navbar.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  handleLogout,
  getUserData,
  resolvePermissions,
} from "../utils/authUtils";
import { Link, useLocation } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
import api from "../api";

interface NavItem {
  to?: string;
  label: string;
  icon: string;
  permission?: string;
  alwaysShow?: boolean;
  children?: NavItem[];
  divider?: boolean; // show a divider before this item
}

// ── Role-based nav builder ────────────────────────────────────────────────────
function buildNav(role: string): NavItem[] {
  const isTeacher = role === "teacher" || role === "instructor";
  const isStudent = role === "student";
  const isParent = role === "parent";

  if (isTeacher) {
    return [
      { to: "/dashboard", label: "Dashboard", icon: "🏠", alwaysShow: true },
      {
        to: "/assignments",
        label: "Assignments",
        icon: "📝",
        permission: "assignment.view",
      },
      { to: "/ai", label: "AI Help", icon: "🤖", alwaysShow: true },
      { to: "/profile", label: "Profile", icon: "👤", alwaysShow: true },
    ];
  }

  if (isStudent) {
    return [
      { to: "/dashboard", label: "Dashboard", icon: "🏠", alwaysShow: true },
      {
        to: "/courses",
        label: "Courses",
        icon: "📚",
        permission: "course.view",
      },
      {
        to: "/assignments",
        label: "Assignments",
        icon: "📝",
        permission: "assignment.view",
      },
      { to: "/ai", label: "AI Help", icon: "🤖", alwaysShow: true },
      { to: "/profile", label: "Profile", icon: "👤", alwaysShow: true },
    ];
  }

  if (isParent) {
    return [
      { to: "/dashboard", label: "Dashboard", icon: "🏠", alwaysShow: true },
      {
        to: "/parent-portal",
        label: "Parent Portal",
        icon: "👨‍👩‍👧",
        alwaysShow: true,
      },
      { to: "/ai", label: "AI Help", icon: "🤖", alwaysShow: true },
      { to: "/profile", label: "Profile", icon: "👤", alwaysShow: true },
    ];
  }

  // ── Admin / super_admin / school_admin ────────────────────────────────────
  return [
    { to: "/dashboard", label: "Dashboard", icon: "🏠", alwaysShow: true },
    // Academic dropdown
    {
      label: "Academic",
      icon: "📖",
      permission: "course.view",
      children: [
        {
          to: "/courses",
          label: "All Courses",
          icon: "📚",
          permission: "course.view",
        },
        {
          to: "/assignments",
          label: "Assignments",
          icon: "📝",
          permission: "assignment.view",
        },
        {
          to: "/quizzes",
          label: "Quizzes",
          icon: "🧠",
          permission: "quiz.view",
        },
        {
          to: "/enrollments",
          label: "Enrollments",
          icon: "🎓",
          permission: "enrollment.view",
        },
      ],
    },
    // Student Life dropdown
    {
      label: "Student Life",
      icon: "🏆",
      permission: "course.view",
      children: [
        {
          to: "/achievements",
          label: "Achievements",
          icon: "🏆",
          permission: "course.view",
        },
        {
          to: "/projects",
          label: "Projects",
          icon: "🗂️",
          permission: "course.view",
        },
        {
          to: "/milestones",
          label: "Milestones",
          icon: "🚀",
          permission: "course.view",
        },
        {
          to: "/parent-portal",
          label: "Parent Portal",
          icon: "👨‍👩‍👧",
          permission: "grade.view",
        },
      ],
    },
    // Finance & Admin dropdown
    {
      label: "Admin",
      icon: "⚙️",
      permission: "user.create",
      children: [
        {
          to: "/manage-users",
          label: "Manage Users",
          icon: "👥",
          permission: "user.create",
        },
        {
          to: "/payments",
          label: "Payments",
          icon: "💳",
          permission: "payment.view",
        },
        {
          to: "/analytics",
          label: "Analytics",
          icon: "📊",
          permission: "analytics.view",
        },
      ],
    },
    { to: "/ai", label: "AI Help", icon: "🤖", alwaysShow: true },
    { to: "/profile", label: "Profile", icon: "👤", alwaysShow: true },
  ];
}

// ── Dept accent colours
const DEPT_ACCENT: Record<string, { from: string; to: string }> = {
  western: { from: "#1d4ed8", to: "#0ea5e9" },
  arabic: { from: "#065f46", to: "#10b981" },
  programming: { from: "#5b21b6", to: "#8b5cf6" },
};

const Navbar: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem("dark_mode") === "true",
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [liveUser, setLiveUser] = useState<any>(() => getUserData());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!localStorage.getItem("user_data");
  const drawerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const SESSION_KEY = "navbar_profile_fetched";

  const role = liveUser?.role ?? "";
  const dept = liveUser?.department ?? "";
  const accent = DEPT_ACCENT[dept] ?? { from: "#14b8a6", to: "#4f46e5" };

  // Auto-close dropdown on route change
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
    setLoading(true);
    sessionStorage.setItem(SESSION_KEY, "true");
    let active = true;
    api
      .get("/profiles/me/")
      .then((res) => {
        if (!active) return;
        const p = res.data;
        const u = p.user || {};
        const r = p.role ?? "";
        const d = p.department;
        const norm = {
          id: p.id,
          username: u.username ?? "",
          email: u.email ?? "",
          firstName: u.first_name ?? "",
          lastName: u.last_name ?? "",
          first_name: u.first_name ?? "",
          last_name: u.last_name ?? "",
          role: r,
          department: d,
          teacher_type: p.teacher_type ?? p.instructor_type,
          instructor_type: p.instructor_type ?? p.teacher_type,
          phone: p.phone,
          bio: p.bio,
          permissions: resolvePermissions(r, d),
        };
        setLiveUser(norm);
        localStorage.setItem("user_data", JSON.stringify(norm));
      })
      .catch((err) => {
        if (!active) {
          setError("Could not load profile");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
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

  // Permissions
  const perms = liveUser?.permissions
    ? new Set<string>(liveUser.permissions)
    : new Set<string>(resolvePermissions(role, dept));

  const canShow = (item: NavItem): boolean => {
    if (item.alwaysShow) return true;
    if (!item.permission) return true;
    return perms.has(item.permission);
  };

  const navItems = buildNav(role).filter(canShow);

  const initials = liveUser
    ? (
        (liveUser.firstName?.[0] ?? liveUser.first_name?.[0] ?? "") +
        (liveUser.lastName?.[0] ?? liveUser.last_name?.[0] ?? "")
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

  const isActive = (to?: string) =>
    to &&
    (location.pathname === to ||
      (to !== "/dashboard" && location.pathname.startsWith(to)));

  const drawerLink = (active: boolean, sub = false): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: sub ? "8px 16px 8px 40px" : "10px 16px",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: sub ? "13px" : "14px",
    fontWeight: sub ? 400 : 500,
    color: active ? (sub ? "#0d9488" : "white") : sub ? "#6b7280" : "#374151",
    background: active
      ? sub
        ? "#f0fdfa"
        : `linear-gradient(135deg, ${accent.from}, ${accent.to})`
      : "transparent",
    transition: "all 0.15s",
    borderLeft:
      sub && active
        ? `3px solid ${accent.from}`
        : sub
          ? "3px solid transparent"
          : "none",
  });

  return (
    <>
      {/* ── Topbar─ */}
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
            maxWidth: "100%",
          }}
        >
          {/* Left: hamburger + logo */}
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
                  fontWeight: "black",
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

          {/* Right: actions */}
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

      {/* ── Backdrop ────────────────────────────────────────────────────── */}
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

      {/* ── Slide-out Drawer ─────────────────────────────────────────────── */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          height: "calc(100% - 60px)",
          width: "280px",
          zIndex: 50,
          background: "white",
          boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
        className="dark:bg-gray-900"
      >
        {/* User strip */}
        {liveUser && (
          <div
            style={{
              padding: "14px 18px",
              background: `linear-gradient(135deg, ${accent.from}15, ${accent.to}10)`,
              borderBottom: `1px solid ${accent.from}20`,
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
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#111827",
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
                    gap: "6px",
                    marginTop: "2px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      background: `${accent.from}15`,
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
                      style={{
                        fontSize: "11px",
                        background: "#f3f4f6",
                        color: "#6b7280",
                        padding: "1px 8px",
                        borderRadius: "20px",
                        fontWeight: 500,
                        textTransform: "capitalize",
                      }}
                    >
                      {dept}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav
          style={{
            flex: 1,
            padding: "10px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item.to);

            // ── Dropdown group ─────────────────────────────────────────
            if (item.children) {
              const visibleChildren = item.children.filter(canShow);
              if (visibleChildren.length === 0) return null;
              const isOpen = openMenu === item.label;
              const anyActive = visibleChildren.some((c) => isActive(c.to));

              return (
                <div key={item.label}>
                  <button
                    onClick={() =>
                      setOpenMenu((p) => (p === item.label ? null : item.label))
                    }
                    style={{
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
                    }}
                    onMouseEnter={(e) => {
                      if (!anyActive)
                        (e.currentTarget as HTMLElement).style.background =
                          "#f9fafb";
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
                        opacity: 0.7,
                        transition: "transform 0.2s",
                        display: "inline-block",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Children */}
                  {isOpen && (
                    <div
                      style={{
                        paddingLeft: "8px",
                        marginTop: "2px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1px",
                      }}
                    >
                      {visibleChildren.map((child) => {
                        const childActive = !!isActive(child.to);
                        return (
                          <Link
                            key={child.to}
                            to={child.to ?? "/"}
                            style={drawerLink(childActive, true)}
                            onMouseEnter={(e) => {
                              if (!childActive)
                                (
                                  e.currentTarget as HTMLElement
                                ).style.background = "#f9fafb";
                            }}
                            onMouseLeave={(e) => {
                              if (!childActive)
                                (
                                  e.currentTarget as HTMLElement
                                ).style.background = "transparent";
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

            return (
              <Link
                key={item.to}
                to={item.to!}
                style={drawerLink(!!active)}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLElement).style.background =
                      "#f9fafb";
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
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider + logout */}
        <div
          style={{
            flexShrink: 0,
            borderTop: "1px solid #f3f4f6",
            padding: "10px",
          }}
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
