export type ColorMode = "light" | "dark";

export const COLOR_MODE_STORAGE_KEY = "timer-color-mode";

const isColorMode = (value: string | null): value is ColorMode =>
  value === "light" || value === "dark";

export const getInitialColorMode = (): ColorMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
  if (isColorMode(stored)) {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const applyColorMode = (mode: ColorMode) => {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.classList.toggle("dark", mode === "dark");
};

export const persistColorMode = (mode: ColorMode) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
};
