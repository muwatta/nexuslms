import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { getUserData } from "../utils/authUtils";
import ManageUsers from "./ManageUsers";
import styles from "./SuperAdminPortal.module.css";

interface AuditEntry {
  id: number;
  action: string;
  model_name?: string;
  object_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user?: { username: string };
}
interface DeptStats {
  students: number;
  instructors: number;
  courses: number;
  enrollments: number;
}
interface SystemSnapshot {
  western: DeptStats;
  arabic: DeptStats;
  programming: DeptStats;
  unassigned: DeptStats;
}
interface ProfileRow {
  id: number;
  role: string;
  department: string | null;
  student_class?: string;
  user: {
    username: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
}

const DEPTS = [
  {
    id: "western",
    label: "Western School",
    icon: "🏛️",
    route: "/western-dashboard",
    desc: "Western Education System",
  },
  {
    id: "arabic",
    label: "Arabic School",
    icon: "🕌",
    route: "/arabic-dashboard",
    desc: "Arabic Language & Islamic Studies",
  },
  {
    id: "programming",
    label: "Digital School",
    icon: "💻",
    route: "/digital-dashboard",
    desc: "Programming & Technology",
  },
] as const;

const ROLE_COLOR: Record<string, string> = {
  super_admin: "#ef4444",
  admin: "#f97316",
  school_admin: "#f59e0b",
  instructor: "#3b82f6",
  teacher: "#0ea5e9",
  student: "#10b981",
  parent: "#ec4899",
};

const ACTION_ICON: Record<string, string> = {
  create: "➕",
  update: "✏️",
  delete: "🗑️",
  archive: "📦",
  restore: "♻️",
  promote: "⬆️",
};

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div className={styles.avatar}>{(name?.[0] ?? "?").toUpperCase()}</div>
);

const Pill: React.FC<{ role: string }> = ({ role }) => {
  const c = ROLE_COLOR[role] ?? "#6b7280";
  return (
    <span className={`${styles.pill} ${styles[role]}`}>
      {role.replace(/_/g, " ")}
    </span>
  );
};

const SuperAdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const userData = getUserData();

  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [allProfiles, setAllProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "departments" | "users" | "settings" | "audit"
  >("departments");
  const [userSearch, setUserSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [syncingGroups, setSyncingGroups] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!userData || userData.role !== "super_admin")
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-4xl mb-3">🚫</p>
          <p className="text-red-400 font-semibold">
            Super Admin access required.
          </p>
        </div>
      </div>
    );

  const extract = (r: PromiseSettledResult<any>) => {
    if (r.status === "rejected") return [];
    const d = r.value.data;
    if (d && Array.isArray(d.results)) return d.results;
    if (Array.isArray(d)) return d;
    return [];
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [
        profilesRes,
        auditRes,
        westernCoursesRes,
        arabicCoursesRes,
        programmingCoursesRes,
        enrollRes,
      ] = await Promise.allSettled([
        api.get("/admin/users/", { params: { page_size: "200" } }),
        api.get("/audit-logs/", { params: { page_size: "100" } }),
        api.get("/courses/", {
          params: { department: "western", page_size: 500 },
        }),
        api.get("/courses/", {
          params: { department: "arabic", page_size: 500 },
        }),
        api.get("/courses/", {
          params: { department: "programming", page_size: 500 },
        }),
        api.get("/enrollments/", { params: { page_size: "1000" } }),
      ]);

      const extract = (r: PromiseSettledResult<any>) => {
        if (r.status === "rejected") return [];
        const d = r.value.data;
        if (d && Array.isArray(d.results)) return d.results;
        if (Array.isArray(d)) return d;
        return [];
      };

      const apiErrors: string[] = [];
      [
        profilesRes,
        westernCoursesRes,
        arabicCoursesRes,
        programmingCoursesRes,
        enrollRes,
      ].forEach((res, idx) => {
        if (res.status === "rejected") {
          const endpoints = [
            "/admin/users/",
            "/courses/?dept=western",
            "/courses/?dept=arabic",
            "/courses/?dept=programming",
            "/enrollments/",
          ];
          const e = res.reason;
          const status = e?.response?.status;
          const detail = e?.response?.data?.detail ?? e?.message ?? "unknown";
          console.error(`[SAP] ${endpoints[idx]} FAILED`, status, detail);
          apiErrors.push(
            `${endpoints[idx]} → HTTP ${status ?? "?"}: ${detail}`,
          );
        }
      });
      if (apiErrors.length > 0) setError(apiErrors.join(" | "));

      const profiles: ProfileRow[] = extract(profilesRes);
      const westernCourses = extract(westernCoursesRes);
      const arabicCourses = extract(arabicCoursesRes);
      const programmingCourses = extract(programmingCoursesRes);
      const allCourses = [
        ...westernCourses,
        ...arabicCourses,
        ...programmingCourses,
      ];
      const enrollments = extract(enrollRes);

      setAllProfiles(profiles);

      const snap: SystemSnapshot = {
        western: {
          students: 0,
          instructors: 0,
          courses: westernCourses.length,
          enrollments: 0,
        },
        arabic: {
          students: 0,
          instructors: 0,
          courses: arabicCourses.length,
          enrollments: 0,
        },
        programming: {
          students: 0,
          instructors: 0,
          courses: programmingCourses.length,
          enrollments: 0,
        },
        unassigned: {
          students: 0,
          instructors: 0,
          courses: 0,
          enrollments: 0,
        },
      };

      profiles.forEach((p) => {
        const d = (p.department || "unassigned") as keyof SystemSnapshot;
        if (!snap[d]) return;
        if (p.role === "student") snap[d].students++;
        if (["instructor", "teacher"].includes(p.role)) snap[d].instructors++;
      });

      enrollments.forEach((e: any) => {
        const courseId = e.course?.id ?? e.course;
        const course = allCourses.find((c: any) => c.id === courseId);
        const department = course?.department ?? "unassigned";
        if (snap[department as keyof SystemSnapshot]) {
          snap[department as keyof SystemSnapshot].enrollments++;
        }
      });

      setSnapshot(snap);

      if (auditRes.status === "fulfilled") {
        const raw = auditRes.value.data?.results ?? auditRes.value.data ?? [];
        setAuditLogs(raw.slice(0, 100));
      }
      setLastUpdated(new Date());
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ??
        e?.response?.statusText ??
        e?.message ??
        "Unknown error";
      const status = e?.response?.status ? ` (HTTP ${e.response.status})` : "";
      setError(`Failed to load portal data: ${msg}${status}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enterDept = async (dept: (typeof DEPTS)[number]) => {
    navigate(dept.route);
    api
      .post("/audit-logs/", {
        action: "update",
        model_name: "Department",
        object_id: dept.id,
        new_values: { accessed: dept.label },
      })
      .catch(() => {});
  };

  const filtered = allProfiles.filter((p) => {
    if (filterRole !== "all" && p.role !== filterRole) return false;
    const departmentValue = p.department?.trim() || null;
    if (filterDept !== "all") {
      if (filterDept === "unassigned") {
        if (departmentValue !== null) return false;
      } else if (departmentValue !== filterDept) {
        return false;
      }
    }
    const q = userSearch.toLowerCase();
    return (
      !q ||
      [
        p.user?.username,
        p.user?.first_name,
        p.user?.last_name,
        p.user?.email,
      ].some((f) => f?.toLowerCase().includes(q))
    );
  });

  const fullName = (p: ProfileRow) =>
    `${p.user.first_name} ${p.user.last_name}`.trim() || p.user.username;

  const syncRoleGroups = async () => {
    if (!allProfiles.length) return;
    setSyncingGroups(true);
    setSyncMessage(null);
    try {
      const res = await api.post("/admin/sync-groups/", {
        user_ids: allProfiles.map((p) => p.id),
      });
      const processed = res.data?.processed?.length ?? 0;
      setSyncMessage(
        processed > 0
          ? `Synced ${processed} users to their role-based groups.`
          : "No users were updated.",
      );
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ??
        e?.response?.statusText ??
        e?.message ??
        "Role-group sync failed";
      setSyncMessage(`Sync failed: ${msg}`);
    } finally {
      setSyncingGroups(false);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-11 h-11 rounded-full border-[3px] border-t-transparent animate-spin mx-auto border-teal-500" />
          <p className="text-slate-400 text-sm">Loading portal…</p>
        </div>
      </div>
    );

  const TABS = [
    { id: "departments" as const, label: "🏫 Departments" },
    { id: "users" as const, label: `👥 All Users (${allProfiles.length})` },
    { id: "settings" as const, label: "⚙️ Admin Settings" },
    { id: "audit" as const, label: `📋 Audit Log (${auditLogs.length})` },
  ];

  // Helper to get department-specific class name
  const deptClass = (id: string) =>
    `dept${id.charAt(0).toUpperCase() + id.slice(1)}` as keyof typeof styles;
  const filterPillClass = (id: string) =>
    `filterPill${id.charAt(0).toUpperCase() + id.slice(1)}` as keyof typeof styles;

  return (
    <div className={styles.header}>
      <div className={styles.headerBgPattern} />
      <div className={styles.headerGlow1} />
      <div className={styles.headerGlow2} />
      <div className={styles.headerContent}>
        <div className="flex items-center gap-4">
          <div className={styles.logoBadge}>SA</div>
          <div>
            <h1 className={styles.title}>Super Admin Portal</h1>
            <p className={styles.subtitle}>
              Full system access ·{" "}
              {userData.firstName
                ? `${userData.firstName} ${userData.lastName ?? ""}`.trim()
                : userData.username}
            </p>
            {lastUpdated && (
              <p className={styles.updated}>
                {refreshing ? <span className={styles.spinner} /> : null}
                Updated {lastUpdated.toLocaleTimeString()}
                {" · "}
                <span className={styles.userCount}>
                  {allProfiles.length} users loaded
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={styles.headerBadge}>🔑 Super Admin</span>
          <button
            onClick={() => navigate("/admin-dashboard")}
            className={styles.headerBtn}
          >
            ⚙️ Admin Dashboard
          </button>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className={styles.headerRefresh}
          >
            {refreshing ? "⏳" : "🔄"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsInner}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`${styles.tab} ${
                activeSection === tab.id ? styles.tabActive : ""
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.mainContent}>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={styles.errorBanner}
            >
              ⚠️ {error}
              <button
                onClick={() => setError(null)}
                className={styles.errorClose}
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeSection === "departments" && (
              <div className="space-y-8">
                {/* Global summary strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Total Users",
                      value: allProfiles.length,
                      class: "statTotal",
                      icon: "👤",
                    },
                    {
                      label: "Students",
                      value: allProfiles.filter((p) => p.role === "student")
                        .length,
                      class: "statStudents",
                      icon: "👨‍🎓",
                    },
                    {
                      label: "Instructors",
                      value: allProfiles.filter((p) =>
                        ["instructor", "teacher"].includes(p.role),
                      ).length,
                      class: "statInstructors",
                      icon: "👨‍🏫",
                    },
                    {
                      label: "Admins",
                      value: allProfiles.filter((p) =>
                        ["school_admin", "admin", "super_admin"].includes(
                          p.role,
                        ),
                      ).length,
                      class: "statAdmins",
                      icon: "🔑",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`rounded-2xl p-4 border ${styles[s.class as keyof typeof styles]}`}
                    >
                      <div className="text-xl mb-1">{s.icon}</div>
                      <div className={styles.statValue}>{s.value}</div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dept cards */}
                <div>
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Department Access
                  </h2>
                  <div className={styles.deptGrid}>
                    {DEPTS.map((dept, i) => {
                      const stats = snapshot?.[dept.id] ?? null;
                      return (
                        <motion.div
                          key={dept.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`${styles.deptCard} ${styles[deptClass(dept.id)]}`}
                          onClick={() => enterDept(dept)}
                        >
                          <div className={styles.deptGradientBar} />
                          <div className={styles.deptCardInner}>
                            <div className={styles.deptHeader}>
                              <span className={styles.deptIcon}>
                                {dept.icon}
                              </span>
                              <span className={styles.deptAccessBadge}>
                                Full Access
                              </span>
                            </div>

                            <h3 className={styles.deptTitle}>{dept.label}</h3>
                            <p className={styles.deptDesc}>{dept.desc}</p>

                            {stats && (
                              <div className={styles.deptStats}>
                                {[
                                  {
                                    label: "Students",
                                    value: stats.students,
                                    icon: "👨‍🎓",
                                  },
                                  {
                                    label: "Instructors",
                                    value: stats.instructors,
                                    icon: "👨‍🏫",
                                  },
                                  {
                                    label: "Courses",
                                    value: stats.courses,
                                    icon: "📚",
                                  },
                                  {
                                    label: "Enrollments",
                                    value: stats.enrollments,
                                    icon: "🎓",
                                  },
                                ].map((s) => (
                                  <div
                                    key={s.label}
                                    className={styles.deptStatBox}
                                  >
                                    <p className={styles.deptStatValue}>
                                      {s.value}
                                    </p>
                                    <p className={styles.deptStatLabel}>
                                      {s.icon} {s.label}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <button className={styles.deptEnterBtn}>
                              Enter Dashboard →
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick actions */}
                <div className={styles.quickActions}>
                  <h3 className={styles.quickActionsTitle}>
                    ⚡ Admin Quick Actions
                  </h3>
                  <div className={styles.quickActionsGrid}>
                    {[
                      {
                        label: "Manage Users",
                        icon: "👥",
                        route: "/manage-users",
                      },
                      {
                        label: "Admin Dashboard",
                        icon: "⚙️",
                        route: "/admin-dashboard",
                      },
                      { label: "All Courses", icon: "📚", route: "/courses" },
                      {
                        label: "Assignments",
                        icon: "📝",
                        route: "/assignments",
                      },
                      { label: "Payments", icon: "💳", route: "/payments" },
                      {
                        label: "Enrollments",
                        icon: "🎓",
                        route: "/enrollments",
                      },
                      { label: "Analytics", icon: "📊", route: "/analytics" },
                      { label: "AI Help", icon: "🤖", route: "/ai" },
                      {
                        label: "Cleanup import",
                        icon: "🧹",
                        href: "https://github.com/muwatta/nexuslms/blob/main/backend/api/README_ADMIN_API.md#management-command-normalize_departments",
                      },
                    ].map((item) => (
                      <motion.button
                        key={item.href ?? item.route}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (item.href) {
                            window.open(
                              item.href,
                              "_blank",
                              "noopener,noreferrer",
                            );
                            return;
                          }
                          if (item.route) {
                            navigate(item.route);
                          }
                        }}
                        className={styles.quickActionBtn}
                      >
                        <span className={styles.quickActionIcon}>
                          {item.icon}
                        </span>
                        <span className={styles.quickActionLabel}>
                          {item.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* USERS SECTION */}
            {activeSection === "users" && (
              <div className={styles.usersSection}>
                <div className={styles.usersHeader}>
                  <div>
                    <h2 className={styles.usersTitle}>All Users</h2>
                    <p className={styles.usersSub}>
                      {allProfiles.length} total across all departments
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/manage-users")}
                    className={styles.usersManageLink}
                  >
                    Full Management →
                  </button>
                </div>

                {/* Dept breakdown pills */}
                <div className={styles.deptFilterGroup}>
                  {DEPTS.map((d) => {
                    const count = allProfiles.filter(
                      (p) => p.department === d.id,
                    ).length;
                    const isActive = filterDept === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setFilterDept(isActive ? "all" : d.id)}
                        className={`${styles.deptFilterBtn} ${
                          isActive ? styles[filterPillClass(d.id)] : ""
                        }`}
                      >
                        {d.icon} {d.label}: {count}
                      </button>
                    );
                  })}
                  <button
                    onClick={() =>
                      setFilterDept(
                        filterDept === "unassigned" ? "all" : "unassigned",
                      )
                    }
                    className={`${styles.deptFilterBtn} ${
                      filterDept === "unassigned"
                        ? styles.filterPillUnassigned
                        : ""
                    }`}
                  >
                    ❓ Unassigned:{" "}
                    {allProfiles.filter((p) => !p.department).length}
                  </button>
                </div>

                {/* Filters */}
                <div className={styles.filtersRow}>
                  <div className="relative flex-1">
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search name, username or email…"
                      className={styles.searchInput}
                    />
                  </div>
                  {[
                    {
                      val: filterRole,
                      set: setFilterRole,
                      opts: [
                        ["all", "All Roles"],
                        ["student", "Students"],
                        ["instructor", "Instructors"],
                        ["teacher", "Teachers"],
                        ["school_admin", "School Admins"],
                        ["admin", "Admins"],
                        ["parent", "Parents"],
                      ],
                    },
                  ].map((s, i) => (
                    <select
                      key={i}
                      value={s.val}
                      onChange={(e) => s.set(e.target.value)}
                      aria-label="Filter users by role"
                      className={styles.roleSelect}
                    >
                      {s.opts.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>

                <div className={styles.resultCount}>
                  Showing{" "}
                  <strong className="text-slate-300">{filtered.length}</strong>{" "}
                  of{" "}
                  <strong className="text-teal-400">
                    {allProfiles.length}
                  </strong>{" "}
                  users
                </div>

                {/* Table */}
                <div className={styles.tableWrapper}>
                  <div className="overflow-x-auto">
                    <table className={styles.table}>
                      <thead className={styles.tableHead}>
                        <tr>
                          {[
                            "Name",
                            "Username",
                            "Email",
                            "Role",
                            "Dept",
                            "Class",
                          ].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p, i) => (
                          <motion.tr
                            key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.015, 0.4) }}
                            className={styles.tableRow}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  name={
                                    p.user?.first_name ||
                                    p.user?.username ||
                                    "?"
                                  }
                                />
                                <span className={styles.userName}>
                                  {fullName(p) || (
                                    <span className={styles.userNameMissing}>
                                      No name
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className={styles.username}>
                              @{p.user.username}
                            </td>
                            <td className={styles.userEmail}>
                              {p.user.email || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <Pill role={p.role} />
                            </td>
                            <td className={styles.deptText}>
                              {p.department || "—"}
                            </td>
                            <td className={styles.classText}>
                              {p.student_class || "—"}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filtered.length === 0 && (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyStateIcon}>🔍</p>
                      <p className={styles.emptyStateText}>
                        No users match your filters
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {activeSection === "settings" && (
              <div className="space-y-6">
                <div className={styles.settingsCard}>
                  <div className={styles.settingsHeader}>
                    <div>
                      <h2 className={styles.settingsTitle}>Admin Settings</h2>
                      <p className={styles.settingsDesc}>
                        Manage users, roles, departments, and access from this
                        panel without leaving the app.
                      </p>
                    </div>
                    <button
                      onClick={syncRoleGroups}
                      disabled={syncingGroups || !allProfiles.length}
                      className={styles.syncBtn}
                    >
                      {syncingGroups ? "Syncing…" : "Sync role groups"}
                    </button>
                  </div>
                  {syncMessage && (
                    <p className={styles.syncMessage}>{syncMessage}</p>
                  )}
                </div>

                <div className={styles.settingsCard}>
                  <ManageUsers />
                </div>
              </div>
            )}

            {/* AUDIT */}
            {activeSection === "audit" && (
              <div className="space-y-4">
                <div className={styles.auditHeader}>
                  <h2 className={styles.auditTitle}>📋 Audit Log</h2>
                  <p className={styles.auditSub}>
                    Every create, update, delete, archive, restore and password
                    change is recorded here.
                  </p>
                </div>

                {auditLogs.length === 0 ? (
                  <div className={styles.auditEmpty}>
                    <p className={styles.auditEmptyIcon}>📋</p>
                    <p className={styles.auditEmptyTitle}>
                      No audit entries yet
                    </p>
                    <p className={styles.auditEmptyDesc}>
                      Actions will appear here as you use the system
                    </p>
                  </div>
                ) : (
                  <div className={styles.auditList}>
                    {auditLogs.map((log, i) => (
                      <motion.div
                        key={log.id ?? i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.4) }}
                        className={styles.auditItem}
                      >
                        <div className={styles.auditIconBox}>
                          <span className="text-sm">
                            {ACTION_ICON[log.action?.toLowerCase()] ?? "📌"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={styles.auditActionBadge}>
                              {log.action}
                            </span>
                            {log.model_name && (
                              <span className={styles.auditModel}>
                                {log.model_name} #{log.object_id}
                              </span>
                            )}
                            {log.user?.username && (
                              <span className={styles.auditUser}>
                                by @{log.user.username}
                              </span>
                            )}
                          </div>
                          {log.new_values &&
                            Object.keys(log.new_values).length > 0 && (
                              <p className={styles.auditChanges}>
                                {JSON.stringify(log.new_values)}
                              </p>
                            )}
                        </div>
                        <div className={styles.auditTimestamp}>
                          <p className={styles.auditTime}>
                            {fmt(log.timestamp)}
                          </p>
                          {log.ip_address && (
                            <p className={styles.auditIP}>{log.ip_address}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SuperAdminPortal;
