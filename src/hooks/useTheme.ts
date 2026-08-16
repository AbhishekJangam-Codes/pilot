import { useEffect, useState } from "react";
import type { ThemeMode } from "@/types/kanban";
import { STORAGE_KEYS } from "@/lib/constants";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  return mode === "system" ? getSystemTheme() : mode;
}

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredTheme());
  const [resolved, setResolved] = useState<"light" | "dark">(() =>
    resolveTheme(readStoredTheme()),
  );

  useEffect(() => {
    const root = document.documentElement;
    const applied = resolveTheme(mode);
    setResolved(applied);
    root.classList.remove("light", "dark");
    root.classList.add(applied);
    root.style.colorScheme = applied;
    localStorage.setItem(STORAGE_KEYS.theme, mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolved(getSystemTheme());
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [mode]);

  const setMode = (next: ThemeMode) => setModeState(next);

  const cycleTheme = () => {
    setModeState((current) => {
      if (current === "light") return "dark";
      if (current === "dark") return "system";
      return "light";
    });
  };

  return { mode, resolved, setMode, cycleTheme };
}
