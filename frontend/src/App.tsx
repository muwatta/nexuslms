import React, { Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import { PageLoader } from "./components/Skeleton";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import AIChat from "./components/AIChat";
import Notifications from "./components/Notifications";
import { getDashboardRouteByRole, getUserData } from "./utils/authUtils";

const lazy = (fn: () => Promise<{ default: React.ComponentType<any> }>) =>
  React.lazy(fn);

const Landing = lazy(() => import("./pages/Landing"));
const About = lazy(() => import("./pages/About"));
const Programs = lazy(() => import("./pages/Programs"));
const Locations = lazy(() => import("./pages/Locations"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PracticeQuestions = lazy(() => import("./pages/PracticeQuestions"));

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const AIHelp = lazy(() => import("./pages/AIHelp"));

const SuperAdminPortal = lazy(() => import("./pages/SuperAdminPortal"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const Analytics = lazy(() => import("./pages/Analytics"));

const WesternDashboard = lazy(() => import("./pages/WesternDashboard"));
const ArabicDashboard = lazy(() => import("./pages/ArabicDashboard"));
const ProgrammingDashboard = lazy(() => import("./pages/ProgrammingDashboard"));

const TeacherDashboard = lazy(() => import("./pages/InstructorDashboard"));
const SubjectTeacherDashboard = lazy(
  () => import("./pages/SubjectInstructorDashboard"),
);
const ClassTeacherDashboard = lazy(
  () => import("./pages/ClassInstructorDashboard"),
);

const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const ParentPortal = lazy(() => import("./pages/ParentPortal"));

const Courses = lazy(() => import("./pages/Courses"));
const Enrollments = lazy(() => import("./pages/Enrollments"));
const Assignments = lazy(() => import("./pages/Assignments"));
const Payments = lazy(() => import("./pages/Payments"));
const Quizzes = lazy(() => import("./pages/Quizzes"));
const ViewAchievements = lazy(() => import("./pages/ViewAchievements"));
const ViewProjects = lazy(() => import("./pages/ViewProjects"));
const ViewMilestones = lazy(() => import("./pages/ViewMilestones"));

// Teacher routes that own their full layout (no global Navbar)
const SELF_LAYOUT_PREFIXES = [
  "/subject-teacher-dashboard",
  "/class-teacher-dashboard",
  "/teacher-dashboard",
  // legacy aliases
  "/subject-instructor-dashboard",
  "/class-instructor-dashboard",
  "/instructor-dashboard",
];

// Error Bodar
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("🔴 Page crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 font-sans">
        <div className="app-card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl dark:bg-rose-500/15">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            This page needs another try
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
            Something interrupted the page while it was loading. Your work has not been changed.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => this.setState({ hasError: false })} className="app-btn app-btn-primary">
              Try again
            </button>
            <button onClick={() => window.location.reload()} className="app-btn app-btn-secondary">
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

const HomeRouter: React.FC = () => {
  const userData = getUserData();
  if (userData?.role) {
    const route = getDashboardRouteByRole(
      userData.role,
      userData.department,
      userData.teacher_type ?? userData.instructor_type,
    );
    return <Navigate to={route} replace />;
  }
  return <Landing />;
};

const DashboardRouter: React.FC = () => {
  const userData = getUserData();
  if (userData?.role) {
    const route = getDashboardRouteByRole(
      userData.role,
      userData.department,
      userData.teacher_type ?? userData.instructor_type,
    );
    if (route !== "/dashboard") return <Navigate to={route} replace />;
  }
  return <Dashboard />;
};

// 40pag
const NotFound: React.FC = () => (
  <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
    <div className="app-card max-w-md p-8 sm:p-10">
      <p className="text-8xl font-black tracking-tight text-teal-500/20 dark:text-teal-400/20">
        404
      </p>
      <h1 className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">
        Page not found
      </h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        The page you're looking for doesn't exist or was moved.
      </p>
      <Link to="/" className="app-btn app-btn-primary px-6 py-3">
        Go Home
      </Link>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

const AppShell: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("user_data"),
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "user_data") setIsLoggedIn(!!e.newValue);
    };
    const onAuthChange = () =>
      setIsLoggedIn(!!localStorage.getItem("user_data"));
    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-change", onAuthChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-change", onAuthChange);
    };
  }, []);

  const { pathname } = useLocation();
  const isSelfLayout = SELF_LAYOUT_PREFIXES.some((p) => pathname.startsWith(p));
  const showNavbar = isLoggedIn && !isSelfLayout;

  return (
    <div className="app-shell transition-colors duration-300">
      {showNavbar && <Navbar />}

      <main className={showNavbar ? "pt-[60px]" : ""}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader message="Loading…" />}>
            <Routes>
              {/* PUBLIC */}
              <Route path="/" element={<HomeRouter />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/about" element={<About />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/practice" element={<PracticeQuestions />} />

              {/* GENERIC */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                }
              />

              {/* SUPER ADMIN */}
              <Route
                path="/super-admin-portal"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <Page>
                      <SuperAdminPortal />
                    </Page>
                  </ProtectedRoute>
                }
              />

              {/* ADMIN */}
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute requiredPermission="admin.access">
                    <Page>
                      <AdminDashboard />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredPermission="admin.access">
                    <Navigate to="/admin-dashboard" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-users"
                element={
                  <ProtectedRoute requiredPermission="user.create">
                    <Page>
                      <ManageUsers useLayout={false} />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute requiredPermission="analytics.view">
                    <Page>
                      <Analytics />
                    </Page>
                  </ProtectedRoute>
                }
              />

              {/* SCHOOL ADMIN (department) */}
              <Route
                path="/western-dashboard"
                element={
                  <ProtectedRoute>
                    <Page>
                      <WesternDashboard />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/arabic-dashboard"
                element={
                  <ProtectedRoute>
                    <Page>
                      <ArabicDashboard />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/digital-dashboard"
                element={
                  <ProtectedRoute>
                    <Page>
                      <ProgrammingDashboard />
                    </Page>
                  </ProtectedRoute>
                }
              />

              {/* TEACHER */}
              <Route
                path="/teacher-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <Page>
                      <TeacherDashboard />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subject-teacher-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <Page>
                      <SubjectTeacherDashboard />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/class-teacher-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <Page>
                      <ClassTeacherDashboard />
                    </Page>
                  </ProtectedRoute>
                }
              />
              {/* Legacy aliases */}
              <Route
                path="/instructor-dashboard"
                element={<Navigate to="/teacher-dashboard" replace />}
              />
              <Route
                path="/subject-instructor-dashboard"
                element={<Navigate to="/subject-teacher-dashboard" replace />}
              />
              <Route
                path="/class-instructor-dashboard"
                element={<Navigate to="/class-teacher-dashboard" replace />}
              />

              {/* STUDENT */}
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <Page>
                      <StudentDashboard />
                    </Page>
                  </ProtectedRoute>
                }
              />

              {/* PARENT─ */}
              <Route
                path="/parent-portal"
                element={
                  <ProtectedRoute allowedRoles={["parent"]}>
                    <Page>
                      <ParentPortal />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["parent"]}>
                    <Navigate to="/parent-portal" replace />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/staff-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["non_teaching"]}>
                    <Page>
                      <Dashboard />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/visitor"
                element={
                  <ProtectedRoute allowedRoles={["visitor"]}>
                    <Page>
                      <Dashboard />
                    </Page>
                  </ProtectedRoute>
                }
              />

              {/* FEATURES (authenticated) */}
              <Route
                path="/courses"
                element={
                  <ProtectedRoute requiredPermission="course.view">
                    <Page>
                      <Courses />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/enrollments"
                element={
                  <ProtectedRoute requiredPermission="enrollment.view">
                    <Page>
                      <Enrollments />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assignments"
                element={
                  <ProtectedRoute requiredPermission="assignment.view">
                    <Page>
                      <Assignments />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes"
                element={
                  <ProtectedRoute requiredPermission="quiz.view">
                    <Page>
                      <Quizzes />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute requiredPermission="payment.view">
                    <Page>
                      <Payments />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/achievements"
                element={
                  <ProtectedRoute requiredPermission="course.view">
                    <Page>
                      <ViewAchievements />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute requiredPermission="course.view">
                    <Page>
                      <ViewProjects />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/milestones"
                element={
                  <ProtectedRoute requiredPermission="course.view">
                    <Page>
                      <ViewMilestones />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai"
                element={
                  <ProtectedRoute>
                    <Page>
                      <AIHelp />
                    </Page>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Page>
                      <Profile />
                    </Page>
                  </ProtectedRoute>
                }
              />

              {/*  404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Floating global widgets — only when logged in */}
      {isLoggedIn && (
        <>
          <ErrorBoundary fallback={null}>
            <AIChat />
          </ErrorBoundary>
          <ErrorBoundary fallback={null}>
            <Notifications />
          </ErrorBoundary>
        </>
      )}
    </div>
  );
};

export default App;
