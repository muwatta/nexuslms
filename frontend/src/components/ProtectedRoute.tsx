// frontend/src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getUserData, hasPermission, isAdmin } from "../utils/authUtils";

interface ProtectedRouteProps {
  children: React.ReactElement;
  /** Legacy role-based guard. Prefer requiredPermission for new routes. */
  allowedRoles?: string[];
  /** Permission-based guard e.g. "course.create", "department.access.arabic" */
  requiredPermission?: string;
}

const SUPER_ROLES = ["admin", "school_admin", "super_admin"] as const;

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  // Auth check: user_data in localStorage = logged in signal
  // (Navbar fetches /profiles/me/ and keeps it fresh; HttpOnly cookies handle the token)
  const userData = getUserData();

  // 1. Not logged in → redirect to login
  if (!userData) return <Navigate to="/login" replace />;

  const role = userData.role ?? "";

  // 2. Permission-based guard (preferred for new routes)
  if (requiredPermission) {
    return isAdmin() || hasPermission(requiredPermission) ? (
      children
    ) : (
      <Navigate to="/unauthorized" replace />
    );
  }

  // 3. No restriction → allow through
  if (!allowedRoles || allowedRoles.length === 0) return children;

  // 4. Super-roles bypass allowedRoles
  if (SUPER_ROLES.includes(role as (typeof SUPER_ROLES)[number]))
    return children;

  // 5. Regular role check
  if (allowedRoles.includes(role)) return children;

  // 6. Deny
  return <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;
