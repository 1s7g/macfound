"use client";

import { useEffect } from "react";

const STORAGE_KEY = "theme";

/**
 * Light/dark switch.
 *
 * Deliberately holds no React state. The theme lives in one place — the
 * `data-theme` attribute on <html> — which a blocking script in the root layout
 * sets before first paint. Mirroring it into component state would mean the
 * server rendering one value and the client another, which is exactly the
 * hydration mismatch the attribute approach avoids. Both icons are rendered and
 * CSS reveals the right one (see globals.css).
 */
export function ThemeToggle() {
  // Without an explicit choice stored, keep following the system. The layout
  // script pins data-theme at load, so a system change mid-session would
  // otherwise be ignored — a regression on the plain media query this replaced.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");

    const sync = () => {
      if (storedTheme()) return;
      document.documentElement.dataset.theme = query.matches ? "dark" : "light";
    };

    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const current =
      root.dataset.theme ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";

    root.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the switch still works for this page.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Switch theme"
      aria-label="Switch between light and dark theme"
      className="flex h-8 w-8 items-center justify-center rounded-control text-muted transition-colors hover:bg-sunken hover:text-ink"
    >
      <svg
        data-theme-icon="moon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79" />
      </svg>

      <svg
        data-theme-icon="sun"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    </button>
  );
}

function storedTheme(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
