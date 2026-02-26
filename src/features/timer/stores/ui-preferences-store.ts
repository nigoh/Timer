import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIPreferencesState {
  sidebarOpen: boolean;
}

interface UIPreferencesActions {
  toggleSidebar: () => void;
}

type UIPreferencesStore = UIPreferencesState & UIPreferencesActions;

export const useUIPreferencesStore = create<UIPreferencesStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: "ui-preferences",
    },
  ),
);
