import { create } from 'zustand';
import { AgendaTimerState, Meeting, AgendaItem } from '@/types/agenda';
import { bellSoundManager } from '@/utils/bellSoundManager';
import { logger } from '@/utils/logger';

export interface AgendaTimerStore extends AgendaTimerState {
  createMeeting: (title: string) => void;
  deleteMeeting: (id: string) => void;
  setCurrentMeeting: (id: string) => void;
  updateMeetingSettings: (id: string, settings: Partial<Meeting['settings']>) => void;
  addAgenda: (meetingId: string, title: string, plannedDuration: number, memo?: string) => void;
  updateAgenda: (meetingId: string, agendaId: string, updates: Partial<AgendaItem>) => void;
  deleteAgenda: (meetingId: string, agendaId: string) => void;
  reorderAgendas: (meetingId: string, agendaIds: string[]) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  nextAgenda: () => void;
  previousAgenda: () => void;
  tick: () => void;
  getCurrentAgenda: () => AgendaItem | null;
  getProgressPercentage: () => number;
  getTotalProgressPercentage: () => number;
  calculateTimeColor: (percentage: number) => string;
  syncTime: () => void;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const getProgressColor = (percentage: number): string => {
  if (percentage <= 70) return 'bg-green-500';
  if (percentage <= 90) return 'bg-orange-500';
  if (percentage <= 100) return 'bg-red-500';
  return 'bg-purple-500';
};

const syncMeetingCurrentAgendaId = (
  state: AgendaTimerStore,
  meetingId: string,
  agendaId: string,
) => {
  const updatedMeetings = state.meetings.map((meeting) =>
    meeting.id === meetingId ? { ...meeting, currentAgendaId: agendaId } : meeting,
  );
  const currentMeeting =
    state.currentMeeting?.id === meetingId
      ? { ...state.currentMeeting, currentAgendaId: agendaId }
      : state.currentMeeting;

  return {
    meetings: updatedMeetings,
    currentMeeting,
  };
};

export const useAgendaTimerStore = create<AgendaTimerStore>((set, get) => ({
  currentMeeting: null,
  meetings: [],
  isRunning: false,
  currentTime: 0,
  meetingStartTime: undefined,
  lastTickTime: undefined,

  createMeeting: (title: string) => {
    const newMeeting: Meeting = {
      id: generateId(),
      title,
      agenda: [],
      totalPlannedDuration: 0,
      totalActualDuration: 0,
      status: 'not-started',
      settings: {
        autoTransition: false,
        silentMode: false,
        bellSettings: {
          start: true,
          fiveMinWarning: true,
          end: true,
          overtime: true,
          soundType: 'single',
        },
      },
    };

    set((state) => ({
      meetings: [...state.meetings, newMeeting],
      currentMeeting: state.currentMeeting || newMeeting,
    }));

    logger.info(
      'Meeting created',
      {
        meetingId: newMeeting.id,
        title: newMeeting.title,
      },
      'agenda',
    );
  },

  deleteMeeting: (id: string) => {
    const state = get();
    const meetingToDelete = state.meetings.find((meeting) => meeting.id === id);

    set((prevState) => ({
      meetings: prevState.meetings.filter((meeting) => meeting.id !== id),
      currentMeeting: prevState.currentMeeting?.id === id ? null : prevState.currentMeeting,
    }));

    logger.info(
      'Meeting deleted',
      {
        meetingId: id,
        title: meetingToDelete?.title,
      },
      'agenda',
    );
  },

  setCurrentMeeting: (id: string) => {
    const meeting = get().meetings.find((item) => item.id === id);
    if (meeting) {
      set({ currentMeeting: meeting });
    }
  },

  updateMeetingSettings: (id: string, settings) => {
    set((state) => ({
      meetings: state.meetings.map((meeting) =>
        meeting.id === id ? { ...meeting, settings: { ...meeting.settings, ...settings } } : meeting,
      ),
      currentMeeting:
        state.currentMeeting?.id === id
          ? { ...state.currentMeeting, settings: { ...state.currentMeeting.settings, ...settings } }
          : state.currentMeeting,
    }));
  },

  addAgenda: (meetingId: string, title: string, plannedDuration: number, memo?: string) => {
    const newAgenda: AgendaItem = {
      id: generateId(),
      title,
      plannedDuration,
      memo,
      order: 0,
      actualDuration: 0,
      remainingTime: plannedDuration,
      status: 'pending',
    };

    set((state) => {
      const updatedMeetings = state.meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          const agendaWithOrder = meeting.agenda.map((agenda, index) => ({ ...agenda, order: index }));
          return {
            ...meeting,
            agenda: [...agendaWithOrder, { ...newAgenda, order: agendaWithOrder.length }],
            totalPlannedDuration: meeting.totalPlannedDuration + plannedDuration,
          };
        }
        return meeting;
      });

      return {
        meetings: updatedMeetings,
        currentMeeting:
          state.currentMeeting?.id === meetingId
            ? updatedMeetings.find((meeting) => meeting.id === meetingId) || state.currentMeeting
            : state.currentMeeting,
      };
    });
  },

  updateAgenda: (meetingId: string, agendaId: string, updates: Partial<AgendaItem>) => {
    set((state) => {
      const updatedMeetings = state.meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          const updatedAgenda = meeting.agenda.map((agenda) =>
            agenda.id === agendaId ? { ...agenda, ...updates } : agenda,
          );
          const totalPlannedDuration = updatedAgenda.reduce(
            (sum, agenda) => sum + agenda.plannedDuration,
            0,
          );
          const totalActualDuration = updatedAgenda.reduce(
            (sum, agenda) => sum + agenda.actualDuration,
            0,
          );

          return {
            ...meeting,
            agenda: updatedAgenda,
            totalPlannedDuration,
            totalActualDuration,
          };
        }
        return meeting;
      });

      const updatedMeeting = updatedMeetings.find((meeting) => meeting.id === meetingId);

      return {
        meetings: updatedMeetings,
        currentMeeting:
          state.currentMeeting?.id === meetingId
            ? {
                ...state.currentMeeting,
                ...(updatedMeeting || {}),
                currentAgendaId:
                  updatedMeeting?.currentAgendaId ||
                  state.currentMeeting.currentAgendaId,
              }
            : state.currentMeeting,
      };
    });
  },

  deleteAgenda: (meetingId: string, agendaId: string) => {
    set((state) => {
      const updatedMeetings = state.meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          const agenda = meeting.agenda.find((item) => item.id === agendaId);
          const updatedAgenda = meeting.agenda
            .filter((item) => item.id !== agendaId)
            .map((item, index) => ({ ...item, order: index }));

          return {
            ...meeting,
            agenda: updatedAgenda,
            totalPlannedDuration: meeting.totalPlannedDuration - (agenda?.plannedDuration || 0),
          };
        }
        return meeting;
      });

      return {
        meetings: updatedMeetings,
        currentMeeting:
          state.currentMeeting?.id === meetingId
            ? updatedMeetings.find((meeting) => meeting.id === meetingId) || state.currentMeeting
            : state.currentMeeting,
      };
    });
  },

  reorderAgendas: (meetingId: string, agendaIds: string[]) => {
    set((state) => {
      const updatedMeetings = state.meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          const reorderedAgenda = agendaIds
            .map((id, index) => {
              const agenda = meeting.agenda.find((item) => item.id === id);
              return agenda ? { ...agenda, order: index } : null;
            })
            .filter(Boolean) as AgendaItem[];

          return { ...meeting, agenda: reorderedAgenda };
        }
        return meeting;
      });

      return {
        meetings: updatedMeetings,
        currentMeeting:
          state.currentMeeting?.id === meetingId
            ? updatedMeetings.find((meeting) => meeting.id === meetingId) || state.currentMeeting
            : state.currentMeeting,
      };
    });
  },

  startTimer: () => {
    const state = get();
    const currentAgenda = get().getCurrentAgenda();

    if (!currentAgenda || !state.currentMeeting) return;

    const now = new Date();

    set((prevState) => syncMeetingCurrentAgendaId(prevState, state.currentMeeting.id, currentAgenda.id));

    set({
      isRunning: true,
      meetingStartTime: state.meetingStartTime || now,
      lastTickTime: now.getTime(),
    });

    logger.timerStart(currentAgenda.id, 'agenda', currentAgenda.plannedDuration * 60);

    logger.info(
      'Agenda timer started',
      {
        meetingId: state.currentMeeting.id,
        meetingTitle: state.currentMeeting.title,
        agendaId: currentAgenda.id,
        agendaTitle: currentAgenda.title,
        plannedDuration: currentAgenda.plannedDuration,
      },
      'agenda',
    );

    get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
      status: 'running',
      startTime: currentAgenda.startTime || now,
    });

    if (state.currentMeeting.settings.bellSettings.start) {
      bellSoundManager.notifyWithBell(
        'start',
        state.currentMeeting.settings.bellSettings,
        `アジェンダ「${currentAgenda.title}」を開始しました`,
      );
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  pauseTimer: () => {
    set({ isRunning: false });
  },

  stopTimer: () => {
    const state = get();
    const currentAgenda = get().getCurrentAgenda();

    if (currentAgenda && state.currentMeeting) {
      get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
        status: 'paused',
      });
    }

    set({
      isRunning: false,
      currentTime: 0,
      meetingStartTime: undefined,
      lastTickTime: undefined,
    });
  },

  nextAgenda: () => {
    const state = get();
    if (!state.currentMeeting) return;

    const currentAgenda = get().getCurrentAgenda();
    if (currentAgenda) {
      get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
        status: 'completed',
        endTime: new Date(),
      });
    }

    const nextAgenda = state.currentMeeting.agenda
      .filter((agenda) => agenda.status === 'pending')
      .sort((a, b) => a.order - b.order)[0];

    if (nextAgenda) {
      set((prevState) => ({
        ...syncMeetingCurrentAgendaId(prevState, state.currentMeeting!.id, nextAgenda.id),
        currentTime: 0,
      }));

      if (state.currentMeeting.settings.autoTransition && state.isRunning) {
        setTimeout(() => get().startTimer(), 1000);
      }
    } else {
      get().stopTimer();
      set((prevState) => ({
        currentMeeting: prevState.currentMeeting
          ? { ...prevState.currentMeeting, status: 'completed', endTime: new Date() }
          : null,
      }));
    }
  },

  previousAgenda: () => {
    const state = get();
    if (!state.currentMeeting) return;

    const currentAgenda = get().getCurrentAgenda();
    if (!currentAgenda) return;

    const prevAgenda = state.currentMeeting.agenda
      .filter((agenda) => agenda.order < currentAgenda.order)
      .sort((a, b) => b.order - a.order)[0];

    if (prevAgenda) {
      set((prevState) => ({
        ...syncMeetingCurrentAgendaId(prevState, state.currentMeeting!.id, prevAgenda.id),
        currentTime: 0,
      }));
    }
  },

  tick: () => {
    const state = get();
    if (!state.isRunning || !state.currentMeeting) return;

    const currentAgenda = get().getCurrentAgenda();
    if (!currentAgenda) return;

    const now = Date.now();
    const deltaTime = state.lastTickTime ? Math.round((now - state.lastTickTime) / 1000) : 1;

    const newCurrentTime = state.currentTime + deltaTime;
    const newRemainingTime = currentAgenda.plannedDuration - newCurrentTime;

    set({
      currentTime: newCurrentTime,
      lastTickTime: now,
    });

    get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
      remainingTime: newRemainingTime,
      actualDuration: newCurrentTime,
      status: newRemainingTime <= 0 ? 'overtime' : 'running',
    });

    if (
      newRemainingTime === 300 &&
      state.currentMeeting.settings.bellSettings.fiveMinWarning
    ) {
      bellSoundManager.notifyWithBell(
        'warning',
        state.currentMeeting.settings.bellSettings,
        `アジェンダ「${currentAgenda.title}」の残り時間は5分です`,
      );
    }

    if (newRemainingTime === 0 && state.currentMeeting.settings.bellSettings.end) {
      bellSoundManager.notifyWithBell(
        'end',
        state.currentMeeting.settings.bellSettings,
        `アジェンダ「${currentAgenda.title}」の予定時間が終了しました`,
      );
    }

    if (
      newRemainingTime < 0 &&
      Math.abs(newRemainingTime) % 60 === 0 &&
      state.currentMeeting.settings.bellSettings.overtime
    ) {
      bellSoundManager.notifyWithBell(
        'overtime',
        state.currentMeeting.settings.bellSettings,
        `アジェンダ「${currentAgenda.title}」が${Math.abs(
          Math.floor(newRemainingTime / 60),
        )}分超過しています`,
      );
    }
  },

  getCurrentAgenda: () => {
    const state = get();
    if (!state.currentMeeting || !state.currentMeeting.currentAgendaId) {
      const firstPending = state.currentMeeting?.agenda
        .filter((agenda) => agenda.status === 'pending')
        .sort((a, b) => a.order - b.order)[0];

      if (firstPending && state.currentMeeting) {
        set((prevState) =>
          syncMeetingCurrentAgendaId(prevState, state.currentMeeting!.id, firstPending.id),
        );
      }

      return firstPending || null;
    }

    return (
      state.currentMeeting.agenda.find(
        (agenda) => agenda.id === state.currentMeeting!.currentAgendaId,
      ) || null
    );
  },

  getProgressPercentage: () => {
    const currentAgenda = get().getCurrentAgenda();
    if (!currentAgenda) return 0;

    return Math.min(
      (currentAgenda.actualDuration / currentAgenda.plannedDuration) * 100,
      150,
    );
  },

  getTotalProgressPercentage: () => {
    const state = get();
    if (!state.currentMeeting || state.currentMeeting.totalPlannedDuration === 0) return 0;

    return Math.min(
      (state.currentMeeting.totalActualDuration / state.currentMeeting.totalPlannedDuration) * 100,
      150,
    );
  },

  calculateTimeColor: (percentage: number) => {
    return getProgressColor(percentage);
  },

  syncTime: () => {
    const state = get();
    if (!state.isRunning || !state.lastTickTime) return;

    const now = Date.now();
    const timeDiff = Math.round((now - state.lastTickTime) / 1000);

    if (timeDiff > 1) {
      set({
        currentTime: state.currentTime + timeDiff,
        lastTickTime: now,
      });
    }
  },
}));
