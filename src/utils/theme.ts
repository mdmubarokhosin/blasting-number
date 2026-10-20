const STORAGE_KEY = "bn-theme";

export type ThemeMode = "light" | "dark";

function systemTheme(): ThemeMode {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    // localStorage may be blocked; fall back to system preference
  }
  return systemTheme();
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;
}

export function setTheme(mode: ThemeMode): ThemeMode {
  applyTheme(mode);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore storage failures — theme still applies for this session
  }
  return mode;
}

export function initTheme(): ThemeMode {
  return setTheme(getStoredTheme());
}

export function toggleTheme(): ThemeMode {
  const next: ThemeMode = getStoredTheme() === "dark" ? "light" : "dark";
  return setTheme(next);
}
