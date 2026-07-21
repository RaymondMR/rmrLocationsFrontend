import { create } from "zustand";

type Theme = "light" | "dark";

interface UIState {
  theme: Theme;
  drawerOpen: boolean;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setDrawerOpen: (open: boolean) => void;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("rmr.theme");
  if (stored === "dark" || stored === "light") return stored;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
  localStorage.setItem("rmr.theme", t);
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: getInitialTheme(),
  drawerOpen: false,

  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
  },

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },

  setDrawerOpen: (open) => set({ drawerOpen: open }),
}));

// Apply theme on module load
applyTheme(getInitialTheme());
