import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useTheme from "../hooks/useTheme";
import {
  useRolesAndPermissions,
  createRoleLabelsMap,
  getDepartmentLabel,
} from "../hooks/useRolesAndPermissions";
import { getUserData, clearUserData, hasPermission } from "../utils/authUtils";

interface ProfileDropdownProps {
  onProfileClick?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  onProfileClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { data: rolesData } = useRolesAndPermissions();

  const userData = getUserData();

  // Create role labels map from API data
  const roleLabelsMap = useMemo(
    () => createRoleLabelsMap(rolesData),
    [rolesData],
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    clearUserData();
    sessionStorage.removeItem("navbar_profile_fetched");
    navigate("/login");
  };

  // Derived display values
  const firstName = userData?.firstName || userData?.first_name || "";
  const lastName = userData?.lastName || userData?.last_name || "";
  const username = userData?.username || "";
  const role = userData?.role || "";
  const department = userData?.department;

  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : firstName
        ? firstName[0].toUpperCase()
        : username
          ? username[0].toUpperCase()
          : "U";

  const displayName = firstName
    ? [firstName, lastName].filter(Boolean).join(" ")
    : username || "User";

  // Use role label from API data, fallback to role code
  const roleLabel = roleLabelsMap[role] || role || "User";
  const departmentLabel = department
    ? getDepartmentLabel(department, rolesData)
    : null;

  const showAdminLink = hasPermission("admin.access");

  if (!userData) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button  */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2 text-white hover:bg-white/20 px-3 py-2 rounded-full transition-colors"
        title="Profile Menu"
        aria-haspopup="true"
      >
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
        {firstName && (
          <span className="hidden sm:block font-medium">{firstName}</span>
        )}
        <span className="text-xs opacity-70">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-64 rounded-lg shadow-xl border z-50 ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
        >
          {/* User info header */}
          <div
            className={`p-4 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p
                  className={`font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {displayName}
                </p>
                <p
                  className={`text-sm ${isDark ? "text-teal-400" : "text-teal-600"}`}
                >
                  {roleLabel}
                </p>
                {department && (
                  <p
                    className={`text-xs capitalize ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {departmentLabel?.replace("_", " ") || department} dept.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="py-2">
            <DropdownItem
              icon="👤"
              label="My Profile"
              isDark={isDark}
              onClick={() => {
                setIsOpen(false);
                onProfileClick?.();
                navigate("/profile");
              }}
            />
            <DropdownItem
              icon="🤖"
              label="AI Help"
              isDark={isDark}
              onClick={() => {
                setIsOpen(false);
                navigate("/ai");
              }}
            />
            {showAdminLink && (
              <DropdownItem
                icon="⚙️"
                label="Admin Dashboard"
                isDark={isDark}
                onClick={() => {
                  setIsOpen(false);
                  navigate("/admin-dashboard");
                }}
              />
            )}
            {hasPermission("user.create") && (
              <DropdownItem
                icon="👥"
                label="Manage Users"
                isDark={isDark}
                onClick={() => {
                  setIsOpen(false);
                  navigate("/manage-users");
                }}
              />
            )}
          </div>

          {/* Logout */}
          <div
            className={`border-t py-2 ${isDark ? "border-slate-700" : "border-slate-200"}`}
          >
            <button
              onClick={handleLogout}
              className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center space-x-2 ${isDark ? "text-red-400 hover:bg-red-900/20" : "text-red-600 hover:bg-red-50"}`}
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DropdownItem: React.FC<{
  icon: string;
  label: string;
  isDark: boolean;
  onClick: () => void;
}> = ({ icon, label, isDark, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center space-x-2 ${isDark ? "text-slate-300 hover:bg-slate-700" : "text-slate-700 hover:bg-slate-100"}`}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

export default ProfileDropdown;
