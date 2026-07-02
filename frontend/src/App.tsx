import React, { Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
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

// Public / marketing
const Landing = lazy(() => import("./pages/Landing"));
const About = lazy(() => import("./pages/About"));
const Programs = lazy(() => import("./pages/Programs"));
const Locations = lazy(() => import("./pages/Locations"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PracticeQuestions = lazy(() => import("./pages/PracticeQuestions"));

// Auth
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

// Core generic
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const AIHelp = lazy(() => import("./pages/AIHelp"));

// Admin
const SuperAdminPortal = lazy(() => import("./pages/SuperAdminPortal"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ManageUsers = lazy(() => import("./pages/ManageUsers"));
const Analytics = lazy(() => import("./pages/Analytics"));

// School admin (department)
const WesternDashboard = lazy(() => import("./pages/WesternDashboard"));
const ArabicDashboard = lazy(() => import("./pages/ArabicDashboard"));
const ProgrammingDashboard = lazy(() => import("./pages/ProgrammingDashboard"));

// Teacher
const TeacherDashboard = lazy(() => import("./pages/InstructorDashboard"));
const SubjectTeacherDashboard = lazy(
  () => import("./pages/SubjectInstructorDashboard"),
);
const ClassTeacherDashboard = lazy(
  () => import("./pages/ClassInstructorDashboard"),
);

// Student / Parent
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const ParentPortal = lazy(() => import("./pages/ParentPortal"));

// Features
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-10 font-sans">
        <p className="text-5xl mb-4">💥</p>
        <h2 className="text-lg font-bold text-red-600 mb-2">
          Something went wrong loading this page.
        </h2>
        <p className="text-sm text-gray-400 mb-6 max-w-sm">
          {this.state.error?.message}
        </p>
        <button
          onClick={() => this.setState({ hasError: false })}
          className="mr-3 px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 text-sm font-semibold border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }
}

// Page wrapper (ErrorBoundary per route
const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

// Smart home router — redirects logged-in users to their dashboard─
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

// Generic /dashboard → role-specific redirect─
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
  <div className="min-h-screen flex flex-col items-center justify-center text-center p-10">
    <p className="text-8xl mb-4 font-black text-gray-200 dark:text-gray-800">
      404
    </p>
    <h1 className="text-2xl font-black text-gray-800 dark:text-gray-200 mb-2">
      Page not found
    </h1>
    <p className="text-gray-400 mb-8 text-sm">
      The page you're looking for doesn't exist or was moved.
    </p>
    <a
      href="/"
      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
    >
      Go Home
    </a>
  </div>
);

// Apphel─
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
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
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
                      <ManageUsers />
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
