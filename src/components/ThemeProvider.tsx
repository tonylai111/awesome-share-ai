"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useServerInsertedHTML } from "next/navigation";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
};

const STORAGE_KEY = "tony-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

const themeInitScript = `(function(){try{var k=${JSON.stringify(STORAGE_KEY)};var t=localStorage.getItem(k)||"light";var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=t==="system"?(d?"dark":"light"):t;var e=document.documentElement;e.classList.remove("light","dark");e.classList.add(r);e.style.colorScheme=r;}catch(e){}})();`;

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  return resolved;
}

function subscribeSystemTheme(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const scriptInserted = useRef(false);

  useServerInsertedHTML(() => {
    if (scriptInserted.current) return null;
    scriptInserted.current = true;
    return (
      <script
        dangerouslySetInnerHTML={{ __html: themeInitScript }}
      />
    );
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "light";
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemTheme,
    () => "light" as const,
  );

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    if (!mounted || theme !== "system") return;
    applyTheme("system");
  }, [mounted, theme, systemTheme]);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? systemTheme : theme;

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
