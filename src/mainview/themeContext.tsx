import { useState, useEffect, useMemo, createContext, useContext } from "react";

const THEME_STORAGE_KEY = "note-taker-theme";

export type ThemeOption = "light" | "dark" | "system";

function getSystemPreference(): "light" | "dark" {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

const ThemeContext = createContext<{
  theme: ThemeOption;
  setTheme: (t: ThemeOption) => void;
  resolved: "light" | "dark";
} | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeOption>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") return stored;
    } catch {}
    return "system";
  });

  const [systemPreference, setSystemPreference] = useState<"light" | "dark">(getSystemPreference);

  const resolved = useMemo<"light" | "dark">(
    () => (theme === "system" ? systemPreference : theme),
    [theme, systemPreference],
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  useEffect(() => {
    if (theme !== "system") return;
    const m = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => setSystemPreference(m.matches ? "light" : "dark");
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (value: ThemeOption) => {
    setThemeState(value);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {}
  };

  const value = useMemo(() => ({ theme, setTheme, resolved }), [theme, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
