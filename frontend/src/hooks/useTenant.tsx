import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

interface School {
  id: number;
  name: string;
  code: string;
  slug: string;
  is_active: boolean;
  plan: string;
  trial_ends_at: string | null;
  max_students: number;
  max_teachers: number;
  max_courses: number;
  allow_western: boolean;
  allow_arabic: boolean;
  allow_programming: boolean;
  is_subscription_active: boolean;
  can_add_student: boolean;
  can_add_teacher: boolean;
  can_add_course: boolean;
  subscribed_at: string | null;
  expires_at: string | null;
}

interface TenantContextType {
  school: School | null;
  loading: boolean;
  error: string | null;
  refreshSchool: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  school: null,
  loading: false,
  error: null,
  refreshSchool: async () => {},
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchool = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = localStorage.getItem("user_data");
      if (!userData) {
        setSchool(null);
        return;
      }

      const parsed = JSON.parse(userData);
      const schoolId = parsed.school_id || parsed.school;
      if (!schoolId) {
        setSchool(null);
        return;
      }

      const res = await api.get(`/schools/${schoolId}/`);
      setSchool(res.data);
    } catch (err) {
      setError("Failed to load school data");
      setSchool(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchool();
  }, []);

  return (
    <TenantContext.Provider value={{ school, loading, error, refreshSchool: fetchSchool }}>
      {children}
    </TenantContext.Provider>
  );
};
