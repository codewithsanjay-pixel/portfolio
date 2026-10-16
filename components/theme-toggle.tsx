"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const CHANGE_EVENT = "themechange";

function currentTheme(): Theme {
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function ThemeToggle() {
  // null on the server: the label renders after hydration.
  const theme = useSyncExternalStore<Theme | null>(subscribe, currentTheme, () => null);

  // React clears <html> attributes on the dev remount; re-apply the saved choice.
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") {
        document.documentElement.setAttribute("data-theme", saved);
        window.dispatchEvent(new Event(CHANGE_EVENT));
      }
    } catch {
      // Storage blocked: follow the OS setting.
    }
  }, []);

  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage blocked: the choice lasts this visit only.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-pressed={theme === null ? undefined : isDark}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === null ? "Theme" : isDark ? "Light theme" : "Dark theme"}
    </button>
  );
}
