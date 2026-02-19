import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AnalyticsFilter, Granularity, TimerKind } from '@/types/analytics';
import { subDays, startOfDay, endOfDay } from 'date-fns';

function defaultFilter(): AnalyticsFilter {
  return {
    since: startOfDay(subDays(new Date(), 29)),
    until: endOfDay(new Date()),
    granularity: 'day',
  };
}

interface DashboardState {
  filter: AnalyticsFilter;
}

interface DashboardActions {
  setGranularity: (granularity: Granularity) => void;
  setDateRange: (since: Date, until: Date) => void;
  setTimerKind: (kind: TimerKind | undefined) => void;
}

type DashboardStore = DashboardState & DashboardActions;

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      filter: defaultFilter(),

      setGranularity: (granularity) =>
        set((state) => ({ filter: { ...state.filter, granularity } })),

      setDateRange: (since, until) =>
        set((state) => ({ filter: { ...state.filter, since, until } })),

      setTimerKind: (timerKind) =>
        set((state) => ({ filter: { ...state.filter, timerKind } })),
    }),
    {
      name: 'dashboard-filter',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        filter: {
          ...state.filter,
          since: state.filter.since.toISOString(),
          until: state.filter.until.toISOString(),
        },
      }),
      merge: (persisted, current) => {
        const p = persisted as { filter: { since: string; until: string; granularity: Granularity; timerKind?: TimerKind } };
        return {
          ...current,
          filter: {
            ...current.filter,
            ...p.filter,
            since: new Date(p.filter.since),
            until: new Date(p.filter.until),
          },
        };
      },
    },
  ),
);
