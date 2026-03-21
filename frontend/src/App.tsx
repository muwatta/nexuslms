// frontend/src/App.tsx
import React, { Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { PageLoader } from "./components/Skeleton";

const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const ArabicDashboard = React.lazy(() => import("./pages/ArabicDashboard"));
const WesternDashboard = React.lazy(() => import("./pages/WesternDashboard"));
const ProgrammingDashboard = React.lazy(
  () => import("./pages/ProgrammingDashboard"),
);
const StudentDashboard = React.lazy(() => import("./pages/StudentDashboard"));
const Courses = React.lazy(() => import("./pages/Courses"));
const Enrollments = React.lazy(() => import("./pages/Enrollments"));
const Assignments = React.lazy(() => import("./pages/Assignments"));
const Payments = React.lazy(() => import("./pages/Payments"));
const Quizzes = React.lazy(() => import("./pages/Quizzes"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const ViewAchievements = React.lazy(() => import("./pages/ViewAchievements"));
const ViewProjects = React.lazy(() => import("./pages/ViewProjects"));
const ViewMilestones = React.lazy(() => import("./pages/ViewMilestones"));
const AIHelp = React.lazy(() => import("./pages/AIHelp"));
const Unauthorized = React.lazy(() => import("./pages/Unauthorized"));
const About = React.lazy(() => import("./pages/About"));
const Programs = React.lazy(() => import("./pages/Programs"));
const Locations = React.lazy(() => import("./pages/Locations"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const PracticeQuestions = React.lazy(() => import("./pages/PracticeQuestions"));
const ManageUsers = React.lazy(() => import("./pages/ManageUsers"));
const ParentPortal = React.lazy(() => import("./pages/ParentPortal"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const SuperAdminPortal = React.lazy(() => import("./pages/SuperAdminPortal"));
const Landing = React.lazy(() => import("./pages/Landing"));
const Profile = React.lazy(() => import("./pages/Profile"));

// ── Teacher dashboards (renamed from Instructor) ──────────────────────────────
// Re-use the existing files under their old names — no new files needed yet.
// TeacherDashboard wraps the old InstructorDashboard with updated role checks.
const TeacherDashboard = React.lazy(
  () => import("./pages/InstructorDashboard"),
);
const SubjectTeacherDashboard = React.lazy(
  () => import("./pages/SubjectInstructorDashboard"),
);
const ClassTeacherDashboard = React.lazy(
  () => import("./pages/ClassInstructorDashboard"),
);

import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import AIChat from "./components/AIChat";
import Notifications from "./components/Notifications";
import { getDashboardRouteByRole, getUserData } from "./utils/authUtils";

// ─── Error Boundary ───────────────────────────────────────────────────────────
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
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#dc2626",
              fontFamily: "sans-serif",
            }}
          >
            <h2>Something went wrong loading this page.</h2>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "16px",
                padding: "8px 20px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// ─── Smart Home Router ────────────────────────────────────────────────────────
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
  if (userData) return <Navigate to="/dashboard" replace />;
  return <Landing />;
};

// ─── Generic Dashboard Router ─────────────────────────────────────────────────
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

// ─── Page wrapper ─────────────────────────────────────────────────────────────
const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

// ─── App ──────────────────────────────────────────────────────────────────────
// Routes that have their own full-screen layout (no global Navbar)
const SELF_LAYOUT_ROUTES = [
  "/subject-teacher-dashboard",
  "/class-teacher-dashboard",
  "/teacher-dashboard",
  "/subject-instructor-dashboard",
  "/class-instructor-dashboard",
  "/instructor-dashboard",
];

function App() {
  const isLoggedIn = !!localStorage.getItem("user_data");

  return (
    <BrowserRouter>
      <AppInner isLoggedIn={isLoggedIn} />
    </BrowserRouter>
  );
}

// Inner component so we can use useLocation inside BrowserRouter
const AppInner: React.FC<{ isLoggedIn: boolean }> = ({ isLoggedIn }) => {
  const { pathname } = useLocation();
  const isSelfLayout = SELF_LAYOUT_ROUTES.some((r) => pathname.startsWith(r));
  const showNavbar = isLoggedIn && !isSelfLayout;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {showNavbar && <Navbar />}

      <main className={showNavbar ? "pt-16" : ""}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader message="Loading page..." />}>
            <Routes>
              {/* ── Public ──────────────────────────────────────────── */}
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

              {/* ── Generic dashboard ───────────────────────────────── */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                }
              />

              {/* ── Admin dashboards ────────────────────────────────── */}
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
                path="/super-admin-portal"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <Page>
                      <SuperAdminPortal />
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

              {/* ── Department / school dashboards ──────────────────── */}
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

              {/* ── Student / parent ────────────────────────────────── */}
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["student", "parent"]}>
                    <Page>
                      <StudentDashboard />
                    </Page>
                  </ProtectedRoute>
                }
              />
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

              {/* ── Teacher dashboards (new canonical routes) ───────── */}
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

              {/* ── Legacy instructor routes → redirect to teacher ───── */}
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

              {/* ── Non-teaching staff ──────────────────────────────── */}
              {/* StaffDashboard page doesn't exist yet — falls back to /dashboard */}
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

              {/* ── Visitor ─────────────────────────────────────────── */}
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

              {/* ── Core features ───────────────────────────────────── */}
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
                path="/analytics"
                element={
                  <ProtectedRoute requiredPermission="analytics.view">
                    <Page>
                      <Analytics />
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

              {/* ── Catch-all ───────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

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
