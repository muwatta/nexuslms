import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const t = localStorage.getItem("theme");
      if (t === "dark" || t === "light") return t;
      const legacy = localStorage.getItem("dark_mode");
      if (legacy !== null) return legacy === "true" ? "dark" : "light";
      if (typeof window !== "undefined" && window.matchMedia)
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      return "light";
    } catch {
      return "light";
    }
  });

  const isDark = theme === "dark";

  useEffect(() => {
    try {
      document.documentElement.classList.toggle("dark", isDark);
    } catch {}
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "theme") return;
      if (!e.newValue) return;
      setTheme(e.newValue === "dark" ? "dark" : "light");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, isDark, toggleTheme } as const;
}
