import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { Theme } from "~/platform/db/generated";

export { Theme };

export function isTheme(value: unknown): value is Theme {
  return value === Theme.LIGHT || value === Theme.DARK || value === Theme.SYSTEM;
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === Theme.LIGHT || stored === Theme.DARK || stored === Theme.SYSTEM) {
    return stored as Theme;
  }
  return null;
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? Theme.SYSTEM);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme);

  const resolvedTheme =
    theme === Theme.SYSTEM ? systemTheme : (theme.toLowerCase() as "light" | "dark");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
