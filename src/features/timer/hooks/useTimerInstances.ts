import { useEffect, useMemo } from 'react';
import { useBasicTimerStore } from '@/features/timer/stores/basic-timer-store';
import { usePomodoroStore } from '@/features/timer/stores/pomodoro-store';
import { useMultiTimerStore } from '@/features/timer/stores/multi-timer-store';
import { useAgendaTimerStore } from '@/features/timer/stores/agenda-timer-store';
import type { AgendaItem } from '@/types/agenda';
import type { Meeting } from '@/types/agenda';
import type { MultiTimer } from '@/types/multi-timer';
import type { PomodoroSettings } from '@/types/pomodoro';

// ─── Basic Timer ─────────────────────────────────────

export function useBasicTimerInstance(taskId: string) {
  useEffect(() => {
    const s = useBasicTimerStore.getState();
    if (!s.instances[taskId]) s.getOrCreateInstance(taskId);
  }, [taskId]);

  const inst = useBasicTimerStore((s) => s.instances[taskId]);

  const actions = useMemo(
    () => ({
      start: () => useBasicTimerStore.getState().start(taskId),
      stop: () => useBasicTimerStore.getState().stop(taskId),
      pause: () => useBasicTimerStore.getState().pause(taskId),
      reset: () => useBasicTimerStore.getState().reset(taskId),
      setDuration: (d: number) => useBasicTimerStore.getState().setDuration(taskId, d),
      tick: () => useBasicTimerStore.getState().tick(taskId),
      setSessionLabel: (l: string) => useBasicTimerStore.getState().setSessionLabel(taskId, l),
      clearHistory: () => useBasicTimerStore.getState().clearHistory(taskId),
      deleteHistoryEntry: (id: string) => useBasicTimerStore.getState().deleteHistoryEntry(taskId, id),
    }),
    [taskId],
  );

  return {
    duration: inst?.duration ?? 1500,
    remainingTime: inst?.remainingTime ?? 1500,
    isRunning: inst?.isRunning ?? false,
    isPaused: inst?.isPaused ?? false,
    sessionLabel: inst?.sessionLabel ?? '',
    history: inst?.history ?? [],
    ...actions,
  };
}

// ─── Pomodoro ────────────────────────────────────────

export function usePomodoroInstance(taskId: string) {
  useEffect(() => {
    const s = usePomodoroStore.getState();
    if (!s.instances[taskId]) s.getOrCreateInstance(taskId);
  }, [taskId]);

  const inst = usePomodoroStore((s) => s.instances[taskId]);

  const actions = useMemo(
    () => ({
      start: () => usePomodoroStore.getState().start(taskId),
      pause: () => usePomodoroStore.getState().pause(taskId),
      reset: () => usePomodoroStore.getState().reset(taskId),
      skip: () => usePomodoroStore.getState().skip(taskId),
      stop: () => usePomodoroStore.getState().stop(taskId),
      tick: () => usePomodoroStore.getState().tick(taskId),
      nextPhase: () => usePomodoroStore.getState().nextPhase(taskId),
      updateSettings: (s: PomodoroSettings) =>
        usePomodoroStore.getState().updateSettings(taskId, s),
      setTaskName: (n: string) => usePomodoroStore.getState().setTaskName(taskId, n),
    }),
    [taskId],
  );

  return {
    currentPhase: inst?.currentPhase ?? 'work',
    timeRemaining: inst?.timeRemaining ?? 1500,
    isRunning: inst?.isRunning ?? false,
    isPaused: inst?.isPaused ?? false,
    cycle: inst?.cycle ?? 1,
    totalCycles: inst?.totalCycles ?? 4,
    taskName: inst?.taskName ?? '',
    settings: inst?.settings ?? {
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
    },
    todayStats: inst?.todayStats ?? {
      completedPomodoros: 0,
      totalWorkTime: 0,
      totalBreakTime: 0,
      date: new Date().toISOString().split('T')[0],
    },
    sessions: inst?.sessions ?? [],
    ...actions,
  };
}

// ─── Multi Timer ─────────────────────────────────────

export function useMultiTimerInstance(taskId: string) {
  useEffect(() => {
    const s = useMultiTimerStore.getState();
    if (!s.instances[taskId]) s.getOrCreateInstance(taskId);
  }, [taskId]);

  const inst = useMultiTimerStore((s) => s.instances[taskId]);

  const actions = useMemo(
    () => ({
      addTimer: (t: Omit<MultiTimer, 'id' | 'remainingTime' | 'isRunning' | 'isPaused' | 'isCompleted' | 'createdAt'>) =>
        useMultiTimerStore.getState().addTimer(taskId, t),
      updateTimer: (id: string, u: Partial<MultiTimer>) =>
        useMultiTimerStore.getState().updateTimer(taskId, id, u),
      deleteTimer: (id: string) => useMultiTimerStore.getState().deleteTimer(taskId, id),
      duplicateTimer: (id: string) => useMultiTimerStore.getState().duplicateTimer(taskId, id),
      startTimer: (id: string) => useMultiTimerStore.getState().startTimer(taskId, id),
      pauseTimer: (id: string) => useMultiTimerStore.getState().pauseTimer(taskId, id),
      stopTimer: (id: string) => useMultiTimerStore.getState().stopTimer(taskId, id),
      resetTimer: (id: string) => useMultiTimerStore.getState().resetTimer(taskId, id),
      startAllTimers: () => useMultiTimerStore.getState().startAllTimers(taskId),
      pauseAllTimers: () => useMultiTimerStore.getState().pauseAllTimers(taskId),
      stopAllTimers: () => useMultiTimerStore.getState().stopAllTimers(taskId),
      resetAllTimers: () => useMultiTimerStore.getState().resetAllTimers(taskId),
      tick: () => useMultiTimerStore.getState().tick(taskId),
      addCategory: (c: string) => useMultiTimerStore.getState().addCategory(taskId, c),
      removeCategory: (c: string) => useMultiTimerStore.getState().removeCategory(taskId, c),
      updateGlobalSettings: (s: Partial<{ autoStartNext: boolean; showNotifications: boolean; soundEnabled: boolean }>) =>
        useMultiTimerStore.getState().updateGlobalSettings(taskId, s),
      getTimerById: (id: string) => useMultiTimerStore.getState().getTimerById(taskId, id),
      getRunningTimers: () => useMultiTimerStore.getState().getRunningTimers(taskId),
      getCompletedTimers: () => useMultiTimerStore.getState().getCompletedTimers(taskId),
    }),
    [taskId],
  );

  return {
    timers: inst?.timers ?? [],
    sessions: inst?.sessions ?? [],
    isAnyRunning: inst?.isAnyRunning ?? false,
    categories: inst?.categories ?? [],
    globalSettings: inst?.globalSettings ?? {
      autoStartNext: false,
      showNotifications: true,
      soundEnabled: true,
    },
    ...actions,
  };
}

// ─── Agenda Timer ────────────────────────────────────

export function useAgendaTimerInstance(taskId: string) {
  useEffect(() => {
    const s = useAgendaTimerStore.getState();
    if (!s.instances[taskId]) s.getOrCreateInstance(taskId);
  }, [taskId]);

  const inst = useAgendaTimerStore((s) => s.instances[taskId]);

  const actions = useMemo(
    () => ({
      createMeeting: (title: string) =>
        useAgendaTimerStore.getState().createMeeting(taskId, title),
      updateMeetingTitle: (id: string, title: string) =>
        useAgendaTimerStore.getState().updateMeetingTitle(taskId, id, title),
      deleteMeeting: (id: string) =>
        useAgendaTimerStore.getState().deleteMeeting(taskId, id),
      setCurrentMeeting: (id: string) =>
        useAgendaTimerStore.getState().setCurrentMeeting(taskId, id),
      updateMeetingSettings: (id: string, s: Partial<Meeting['settings']>) =>
        useAgendaTimerStore.getState().updateMeetingSettings(taskId, id, s),
      addAgenda: (meetingId: string, title: string, dur: number, memo?: string) =>
        useAgendaTimerStore.getState().addAgenda(taskId, meetingId, title, dur, memo),
      updateAgenda: (meetingId: string, agendaId: string, u: Partial<AgendaItem>) =>
        useAgendaTimerStore.getState().updateAgenda(taskId, meetingId, agendaId, u),
      updateAgendaMinutes: (
        meetingId: string,
        agendaId: string,
        u: Pick<AgendaItem, 'minutesContent' | 'minutesFormat'>,
      ) => useAgendaTimerStore.getState().updateAgendaMinutes(taskId, meetingId, agendaId, u),
      deleteAgenda: (meetingId: string, agendaId: string) =>
        useAgendaTimerStore.getState().deleteAgenda(taskId, meetingId, agendaId),
      selectAgenda: (meetingId: string, agendaId: string) =>
        useAgendaTimerStore.getState().selectAgenda(taskId, meetingId, agendaId),
      reorderAgendas: (meetingId: string, agendaIds: string[]) =>
        useAgendaTimerStore.getState().reorderAgendas(taskId, meetingId, agendaIds),
      startTimer: () => useAgendaTimerStore.getState().startTimer(taskId),
      pauseTimer: () => useAgendaTimerStore.getState().pauseTimer(taskId),
      stopTimer: () => useAgendaTimerStore.getState().stopTimer(taskId),
      nextAgenda: () => useAgendaTimerStore.getState().nextAgenda(taskId),
      tick: () => useAgendaTimerStore.getState().tick(taskId),
      getCurrentAgenda: () => useAgendaTimerStore.getState().getCurrentAgenda(taskId),
      getProgressPercentage: () =>
        useAgendaTimerStore.getState().getProgressPercentage(taskId),
      getTotalProgressPercentage: () =>
        useAgendaTimerStore.getState().getTotalProgressPercentage(taskId),
      calculateTimeColor: (p: number) =>
        useAgendaTimerStore.getState().calculateTimeColor(p),
      syncTime: () => useAgendaTimerStore.getState().syncTime(taskId),
    }),
    [taskId],
  );

  return {
    currentMeeting: inst?.currentMeeting ?? null,
    meetings: inst?.meetings ?? [],
    isRunning: inst?.isRunning ?? false,
    currentTime: inst?.currentTime ?? 0,
    meetingStartTime: inst?.meetingStartTime,
    lastTickTime: inst?.lastTickTime,
    ...actions,
  };
}
