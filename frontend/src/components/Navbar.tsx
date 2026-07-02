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
import styles from "./Navbar.module.css";

interface NavItem {
  to?: string;
  label: string;
  icon: string;
  permission?: string;
  alwaysShow?: boolean;
  children?: NavItem[];
  divider?: boolean;
}

// ── Role-based nav builder ──
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

  // Admin / super_admin / school_admin
  return [
    { to: "/dashboard", label: "Dashboard", icon: "🏠", alwaysShow: true },
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

// ── Dept accent colours ──
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
      .catch(() => {
        if (active) setError("Could not load profile");
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

  return (
    <>
      {/* ── Top bar ── */}
      {/* ── Top bar ── */}
      <nav
        className={styles.navbar}
        style={
          {
            "--accent-from": accent.from,
            "--accent-to": accent.to,
          } as React.CSSProperties
        }
      >
        <div className={styles.navbarInner}>
          <div className={styles.leftSection}>
            {isAuthenticated && (
              <button
                onClick={() => setDrawerOpen((p) => !p)}
                className={styles.hamburger}
              >
                ☰
              </button>
            )}
            <Link to="/" className={styles.logoLink}>
              <div className={styles.logoBox}>M</div>
              <span className={styles.logoText}>Muwatta</span>
            </Link>
          </div>

          <div className={styles.rightSection}>
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <>
                <Link to="/login" className={styles.navLink}>
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`${styles.navLink} ${styles.navLinkSignup}`}
                >
                  Sign Up
                </Link>
              </>
            )}
            <button
              onClick={() => setDarkMode((p) => !p)}
              className={styles.darkToggle}
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Backdrop ── */}
      {drawerOpen && (
        <div className={styles.backdrop} onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── Drawer ── */}
      {/* stylelint-disable-next-line */}
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <div
        ref={drawerRef}
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`}
        style={
          {
            "--accent-from": accent.from,
            "--accent-to": accent.to,
          } as React.CSSProperties
        }
      >
        {/* User strip */}
        {liveUser && (
          <div className={styles.drawerUserStrip}>
            <div className={styles.userStripInner}>
              <div className={styles.userAvatar}>{initials}</div>
              {/* stylelint-disable-next-line */}
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              <div style={{ minWidth: 0 }}>
                <p className={styles.userName}>
                  {displayName || liveUser.username}
                </p>
                <div className={styles.userBadgeGroup}>
                  <span className={styles.userBadge}>
                    {role.replace(/_/g, " ")}
                  </span>
                  {dept && <span className={styles.userDept}>{dept}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className={styles.drawerNav}>
          {navItems.map((item) => {
            const active = isActive(item.to);

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
                    className={`${styles.drawerNavItem} ${anyActive ? styles.drawerNavItemActive : ""}`}
                  >
                    <span className={styles.drawerNavIcon}>{item.icon}</span>
                    <span className={styles.drawerNavLabel}>{item.label}</span>
                    <span
                      className={`${styles.drawerNavArrow} ${
                        isOpen ? styles.drawerNavArrowOpen : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div className={styles.drawerSubNav}>
                      {visibleChildren.map((child) => {
                        const childActive = !!isActive(child.to);
                        return (
                          <Link
                            key={child.to}
                            to={child.to ?? "/"}
                            className={`${styles.drawerSubItem} ${
                              childActive ? styles.drawerSubItemActive : ""
                            }`}
                          >
                            <span className={styles.drawerSubIcon}>
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

            // Regular link
            return (
              <Link
                key={item.to}
                to={item.to!}
                className={`${styles.drawerNavItem} ${
                  active ? styles.drawerNavItemActive : ""
                }`}
              >
                <span className={styles.drawerNavIcon}>{item.icon}</span>
                {item.label}
                {active && <span className={styles.activeDot} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer logout */}
        <div className={styles.drawerFooter}>
          <button onClick={handleLogoutClick} className={styles.logoutBtn}>
            <span className={styles.logoutIcon}>🚪</span>
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;
