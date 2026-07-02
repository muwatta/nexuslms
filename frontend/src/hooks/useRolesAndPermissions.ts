/**
 * Hook to fetch and cache roles, permissions, and departments from the backend.
 *
 * This is the single source of truth for all role-related data on the frontend.
 * All components should use this hook instead of hardcoding role labels or permissions.
 */

import { useEffect, useState } from "react";

export interface Role {
  code: string;
  label: string;
  permissions: string[];
}

export interface Department {
  code: string;
  label: string;
}

export interface RolesAndPermissionsData {
  roles: Role[];
  departments: Department[];
}

const CACHE_KEY = "rolesAndPermissionsCache";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour in milliseconds

/**
 * Get cached data from localStorage
 */
function getCachedData(): RolesAndPermissionsData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    // Return cache if still fresh
    if (age < CACHE_TTL) {
      return data;
    }

    // Clear expired cache
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (e) {
    return null;
  }
}

export function getCachedRolesAndPermissions(): RolesAndPermissionsData | null {
  return getCachedData();
}

/**
 * Set cache in localStorage
 */
function setCachedData(data: RolesAndPermissionsData): void {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch (e) {
    // Fail silently if localStorage is unavailable
  }
}

/**
 * Fetch roles and permissions from the backend API
 */
async function fetchRolesAndPermissions(): Promise<RolesAndPermissionsData> {
  const response = await fetch("/api/roles-and-permissions/");
  if (!response.ok) {
    throw new Error(`Failed to fetch roles: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Hook to get roles, permissions, and departments
 */
export function useRolesAndPermissions() {
  const [data, setData] = useState<RolesAndPermissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        // Try cache first
        const cached = getCachedData();
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        // Fetch from API
        const fetched = await fetchRolesAndPermissions();
        setCachedData(fetched);
        setData(fetched);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { data, loading, error };
}

/**
 * Utility functions for working with roles and permissions
 */
export function getRoleLabel(
  roleCode: string,
  data: RolesAndPermissionsData | null,
): string {
  if (!data) return roleCode;
  const role = data.roles.find((r) => r.code === roleCode);
  return role?.label || roleCode;
}

export function getDepartmentLabel(
  deptCode: string,
  data: RolesAndPermissionsData | null,
): string {
  if (!data) return deptCode;
  const dept = data.departments.find((d) => d.code === deptCode);
  return dept?.label || deptCode;
}

export function getRolePermissions(
  roleCode: string,
  data: RolesAndPermissionsData | null,
): string[] {
  if (!data) return [];
  const role = data.roles.find((r) => r.code === roleCode);
  return role?.permissions || [];
}

/**
 * Create a map of role code to label for quick lookups
 */
export function createRoleLabelsMap(
  data: RolesAndPermissionsData | null,
): Record<string, string> {
  if (!data) return {};
  return data.roles.reduce(
    (acc, role) => {
      acc[role.code] = role.label;
      return acc;
    },
    {} as Record<string, string>,
  );
}

/**
 * Create a map of department code to label for quick lookups
 */
export function createDepartmentLabelsMap(
  data: RolesAndPermissionsData | null,
): Record<string, string> {
  if (!data) return {};
  return data.departments.reduce(
    (acc, dept) => {
      acc[dept.code] = dept.label;
      return acc;
    },
    {} as Record<string, string>,
  );
}
