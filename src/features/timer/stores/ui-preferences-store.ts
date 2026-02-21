import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIPreferencesState {
  sidebarOpen: boolean;
  timerSubTab: string;
}

interface UIPreferencesActions {
  toggleSidebar: () => void;
  setTimerSubTab: (tab: string) => void;
}

type UIPreferencesStore = UIPreferencesState & UIPreferencesActions;

export const useUIPreferencesStore = create<UIPreferencesStore>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      timerSubTab: "basic",

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setTimerSubTab: (tab) => set({ timerSubTab: tab }),
    }),
    {
      name: "ui-preferences",
    },
  ),
);
