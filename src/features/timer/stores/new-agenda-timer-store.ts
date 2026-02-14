import { create } from "zustand";
import { AgendaTimerState, Meeting, AgendaItem } from "@/types/agenda";
import { bellSoundManager } from "@/utils/bellSoundManager";
import { logger } from "@/utils/logger";

export interface AgendaTimerStore extends AgendaTimerState {
  createMeeting: (title: string) => void;
  updateMeetingTitle: (id: string, title: string) => void;
  deleteMeeting: (id: string) => void;
  setCurrentMeeting: (id: string) => void;
  updateMeetingSettings: (
    id: string,
    settings: Partial<Meeting["settings"]>,
  ) => void;
  addAgenda: (
    meetingId: string,
    title: string,
    plannedDuration: number,
    memo?: string,
  ) => void;
  updateAgenda: (
    meetingId: string,
    agendaId: string,
    updates: Partial<AgendaItem>,
  ) => void;
  updateAgendaMinutes: (
    meetingId: string,
    agendaId: string,
    updates: Pick<AgendaItem, "minutesContent" | "minutesFormat">,
  ) => void;
  updateAgendaSectionStatus: (
    meetingId: string,
    agendaId: string,
    sectionStatus: AgendaItem["sectionStatus"],
  ) => void;
  deleteAgenda: (meetingId: string, agendaId: string) => void;
  selectAgenda: (meetingId: string, agendaId: string) => void;
  reorderAgendas: (meetingId: string, agendaIds: string[]) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  nextAgenda: () => void;
  tick: () => void;
  getCurrentAgenda: () => AgendaItem | null;
  getProgressPercentage: () => number;
  getTotalProgressPercentage: () => number;
  calculateTimeColor: (percentage: number) => string;
  syncTime: () => void;
}

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

const getProgressColor = (percentage: number): string => {
  if (percentage <= 70) return "bg-green-500";
  if (percentage <= 90) return "bg-orange-500";
  if (percentage <= 100) return "bg-red-500";
  return "bg-purple-500";
};

const syncMeetingCurrentAgendaId = (
  state: AgendaTimerStore,
  meetingId: string,
  agendaId?: string,
) => {
  // 不変条件: meetingId が currentMeeting と一致する場合、
  // meetings 配列側と currentMeeting 側の currentAgendaId を必ず同じ値に保つ。
  const updatedMeetings = state.meetings.map((meeting) =>
    meeting.id === meetingId
      ? { ...meeting, currentAgendaId: agendaId }
      : meeting,
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
      status: "not-started",
      settings: {
        autoTransition: false,
        silentMode: false,
        bellSettings: {
          start: true,
          fiveMinWarning: true,
          end: true,
          overtime: true,
          soundType: "single",
        },
      },
    };

    set((state) => ({
      meetings: [...state.meetings, newMeeting],
      currentMeeting: newMeeting,
    }));

    logger.info(
      "Meeting created",
      {
        meetingId: newMeeting.id,
        title: newMeeting.title,
      },
      "agenda",
    );
  },

  updateMeetingTitle: (id: string, title: string) => {
    set((state) => ({
      meetings: state.meetings.map((meeting) =>
        meeting.id === id ? { ...meeting, title } : meeting,
      ),
      currentMeeting:
        state.currentMeeting?.id === id
          ? { ...state.currentMeeting, title }
          : state.currentMeeting,
    }));

    logger.info(
      "Meeting title updated",
      {
        meetingId: id,
        title,
      },
      "agenda",
    );
  },

  deleteMeeting: (id: string) => {
    const state = get();
    const meetingToDelete = state.meetings.find((meeting) => meeting.id === id);

    set((prevState) => ({
      meetings: prevState.meetings.filter((meeting) => meeting.id !== id),
      currentMeeting:
        prevState.currentMeeting?.id === id ? null : prevState.currentMeeting,
    }));

    logger.info(
      "Meeting deleted",
      {
        meetingId: id,
        title: meetingToDelete?.title,
      },
      "agenda",
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
        meeting.id === id
          ? { ...meeting, settings: { ...meeting.settings, ...settings } }
          : meeting,
      ),
      currentMeeting:
        state.currentMeeting?.id === id
          ? {
              ...state.currentMeeting,
              settings: { ...state.currentMeeting.settings, ...settings },
            }
          : state.currentMeeting,
    }));
  },

  addAgenda: (
    meetingId: string,
    title: string,
    plannedDuration: number,
    memo?: string,
  ) => {
    const newAgenda: AgendaItem = {
      id: generateId(),
      title,
      plannedDuration,
      memo,
      order: 0,
      actualDuration: 0,
      remainingTime: plannedDuration,
      status: "pending",
      minutesContent: "",
      minutesFormat: "markdown",
      sectionStatus: "not_started",
    };

    set((state) => {
      const updatedMeetings = state.meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          const agendaWithOrder = meeting.agenda.map((agenda, index) => ({
            ...agenda,
            order: index,
          }));
          return {
            ...meeting,
            agenda: [
              ...agendaWithOrder,
              { ...newAgenda, order: agendaWithOrder.length },
            ],
            totalPlannedDuration:
              meeting.totalPlannedDuration + plannedDuration,
          };
        }
        return meeting;
      });

      return {
        meetings: updatedMeetings,
        currentMeeting:
          state.currentMeeting?.id === meetingId
            ? updatedMeetings.find((meeting) => meeting.id === meetingId) ||
              state.currentMeeting
            : state.currentMeeting,
      };
    });
  },

  updateAgenda: (
    meetingId: string,
    agendaId: string,
    updates: Partial<AgendaItem>,
  ) => {
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

      const updatedMeeting = updatedMeetings.find(
        (meeting) => meeting.id === meetingId,
      );

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

  updateAgendaMinutes: (meetingId: string, agendaId: string, updates) => {
    get().updateAgenda(meetingId, agendaId, updates);
  },

  updateAgendaSectionStatus: (meetingId: string, agendaId: string, sectionStatus) => {
    get().updateAgenda(meetingId, agendaId, { sectionStatus });
  },


  deleteAgenda: (meetingId: string, agendaId: string) => {
    set((state) => {
      // 不変条件: 対象会議が currentMeeting のとき、
      // currentAgendaId は meetings/currentMeeting の双方で一致させる。
      const targetMeeting = state.meetings.find(
        (meeting) => meeting.id === meetingId,
      );
      const deletedAgenda = targetMeeting?.agenda.find(
        (item) => item.id === agendaId,
      );
      const shouldReselectCurrentAgenda =
        targetMeeting?.currentAgendaId !== undefined &&
        targetMeeting.currentAgendaId === agendaId;

      const updatedMeetings = state.meetings.map((meeting) => {
        if (meeting.id === meetingId) {
          const remainingAgenda = meeting.agenda.filter(
            (item) => item.id !== agendaId,
          );

          const nextCandidate = shouldReselectCurrentAgenda
            ? remainingAgenda
                .filter((item) => item.order > (deletedAgenda?.order ?? -1))
                .sort((a, b) => a.order - b.order)[0] ||
              [...remainingAgenda].sort((a, b) => a.order - b.order)[0]
            : undefined;

          const updatedAgenda = remainingAgenda.map((item, index) => ({
            ...item,
            order: index,
          }));

          return {
            ...meeting,
            agenda: updatedAgenda,
            totalPlannedDuration:
              meeting.totalPlannedDuration -
              (deletedAgenda?.plannedDuration || 0),
            currentAgendaId: shouldReselectCurrentAgenda
              ? nextCandidate?.id
              : meeting.currentAgendaId,
          };
        }
        return meeting;
      });

      const updatedMeeting = updatedMeetings.find(
        (meeting) => meeting.id === meetingId,
      );

      return {
        meetings: updatedMeetings,
        currentMeeting:
          state.currentMeeting?.id === meetingId
            ? updatedMeeting || state.currentMeeting
            : state.currentMeeting,
      };
    });
  },

  selectAgenda: (meetingId: string, agendaId: string) => {
    set((state) => syncMeetingCurrentAgendaId(state, meetingId, agendaId));
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
            ? updatedMeetings.find((meeting) => meeting.id === meetingId) ||
              state.currentMeeting
            : state.currentMeeting,
      };
    });
  },

  startTimer: () => {
    // 一時停止からの再開/未開始からの開始を共通で扱う。
    // currentTime を維持することで、pause 後は経過時間を引き継いで再開できる。
    const state = get();
    const currentAgenda = get().getCurrentAgenda();
    const currentMeeting = state.currentMeeting;

    if (!currentAgenda || !currentMeeting) return;

    const nowTimestamp = Date.now();
    const now = new Date(nowTimestamp);

    set((prevState) =>
      syncMeetingCurrentAgendaId(
        prevState,
        currentMeeting.id,
        currentAgenda.id,
      ),
    );

    set({
      isRunning: true,
      meetingStartTime: state.meetingStartTime || now,
      lastTickTime: nowTimestamp,
    });

    logger.timerStart(
      currentAgenda.id,
      "agenda",
      currentAgenda.plannedDuration * 60,
    );

    logger.info(
      "Agenda timer started",
      {
        meetingId: currentMeeting.id,
        meetingTitle: currentMeeting.title,
        agendaId: currentAgenda.id,
        agendaTitle: currentAgenda.title,
        plannedDuration: currentAgenda.plannedDuration,
      },
      "agenda",
    );

    get().updateAgenda(currentMeeting.id, currentAgenda.id, {
      status: "running",
      sectionStatus: "in_progress",
      startTime: currentAgenda.startTime || now,
    });

    if (currentMeeting.settings.bellSettings.start) {
      bellSoundManager.notifyWithBell(
        "start",
        currentMeeting.settings.bellSettings,
        `アジェンダ「${currentAgenda.title}」を開始しました`,
      );
    }

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  },

  pauseTimer: () => {
    // セッションの進行を止めるが、経過時間は保持して再開可能な状態にする。
    const state = get();
    const currentAgenda = get().getCurrentAgenda();

    if (currentAgenda && state.currentMeeting) {
      get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
        status: "paused",
      });
    }

    set({ isRunning: false });
  },

  stopTimer: () => {
    // セッション完了として扱い、現在議題を完了させて次の議題へ遷移する。
    // 実行中であれば自動で一時停止状態にしてから遷移判定を行う。
    if (get().isRunning) {
      set({
        isRunning: false,
        lastTickTime: undefined,
      });
    }

    get().nextAgenda();
  },

  nextAgenda: () => {
    const state = get();
    if (!state.currentMeeting || state.isRunning) return;

    const currentAgenda = get().getCurrentAgenda();
    if (!currentAgenda) return;

    const canAdvance =
      currentAgenda.status === "running" ||
      currentAgenda.status === "paused" ||
      currentAgenda.status === "overtime";

    if (!canAdvance) return;

    get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
      status: "completed",
      sectionStatus: "completed",
      endTime: new Date(),
    });

    const nextAgenda = state.currentMeeting.agenda
      .filter(
        (agenda) =>
          agenda.status === "pending" && agenda.id !== currentAgenda?.id,
      )
      .sort((a, b) => a.order - b.order)[0];

    if (nextAgenda) {
      // 不変条件: 議題遷移時は meetings/currentMeeting で currentAgendaId を同値に維持する。
      set((prevState) => ({
        ...syncMeetingCurrentAgendaId(
          prevState,
          state.currentMeeting!.id,
          nextAgenda.id,
        ),
        currentTime: 0,
      }));

      if (state.currentMeeting.settings.autoTransition && state.isRunning) {
        setTimeout(() => get().startTimer(), 1000);
      }
    } else {
      const completedAt = new Date();
      set((prevState) => ({
        meetings: prevState.meetings.map((meeting) =>
          meeting.id === prevState.currentMeeting?.id
            ? {
                ...meeting,
                status: "completed",
                endTime: completedAt,
              }
            : meeting,
        ),
        currentMeeting: prevState.currentMeeting
          ? {
              ...prevState.currentMeeting,
              status: "completed",
              endTime: completedAt,
            }
          : null,
        isRunning: false,
        currentTime: 0,
        meetingStartTime: undefined,
        lastTickTime: undefined,
      }));
    }
  },

  tick: () => {
    const state = get();
    if (!state.isRunning || !state.currentMeeting) return;

    const currentAgenda = get().getCurrentAgenda();
    if (!currentAgenda) return;

    const now = Date.now();
    const deltaTime = state.lastTickTime
      ? Math.round((now - state.lastTickTime) / 1000)
      : 1;

    const newCurrentTime = state.currentTime + deltaTime;
    const newRemainingTime = currentAgenda.plannedDuration - newCurrentTime;

    set({
      currentTime: newCurrentTime,
      lastTickTime: now,
    });

    get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
      remainingTime: newRemainingTime,
      actualDuration: newCurrentTime,
      status: newRemainingTime <= 0 ? "overtime" : "running",
    });

    if (
      newRemainingTime === 300 &&
      state.currentMeeting.settings.bellSettings.fiveMinWarning
    ) {
      bellSoundManager.notifyWithBell(
        "warning",
        state.currentMeeting.settings.bellSettings,
        `アジェンダ「${currentAgenda.title}」の残り時間は5分です`,
      );
    }

    if (
      newRemainingTime === 0 &&
      state.currentMeeting.settings.bellSettings.end
    ) {
      bellSoundManager.notifyWithBell(
        "end",
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
        "overtime",
        state.currentMeeting.settings.bellSettings,
        `アジェンダ「${currentAgenda.title}」が${Math.abs(
          Math.floor(newRemainingTime / 60),
        )}分超過しています`,
      );
    }
  },

  getCurrentAgenda: () => {
    const state = get();
    if (!state.currentMeeting) return null;

    const sortedPendingAgendas = [...state.currentMeeting.agenda]
      .filter((agenda) => agenda.status === "pending")
      .sort((a, b) => a.order - b.order);
    const firstPending = sortedPendingAgendas[0];

    if (!state.currentMeeting.currentAgendaId) {
      return firstPending || null;
    }

    const currentAgenda = state.currentMeeting.agenda.find(
      (agenda) => agenda.id === state.currentMeeting!.currentAgendaId,
    );

    if (!currentAgenda) {
      return firstPending || null;
    }

    return currentAgenda;
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
    if (
      !state.currentMeeting ||
      state.currentMeeting.totalPlannedDuration === 0
    )
      return 0;

    return Math.min(
      (state.currentMeeting.totalActualDuration /
        state.currentMeeting.totalPlannedDuration) *
        100,
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
