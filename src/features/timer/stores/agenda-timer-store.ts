import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AgendaTimerState, Meeting, AgendaItem } from "@/types/agenda";
import { notificationManager, SoundType } from "@/utils/notification-manager";
import { logger } from "@/utils/logger";
import { generateId } from "@/utils/id";
import { getProgressColor } from "@/constants/timer-theme";

export interface AgendaTimerStore extends AgendaTimerState {
  createMeeting: (title: string) => string;
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

const syncMeetingCurrentAgendaId = (
  state: AgendaTimerStore,
  meetingId: string,
  agendaId?: string,
) => {
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

const notifyAgenda = (
    type: 'start' | 'warning' | 'end' | 'overtime',
    meetingSettings: Meeting['settings'],
    message: string
) => {
    let shouldPlay = false;
    const bs = meetingSettings.bellSettings;
    
    switch (type) {
        case 'start': shouldPlay = bs.start; break;
        case 'warning': shouldPlay = bs.fiveMinWarning; break;
        case 'end': shouldPlay = bs.end; break;
        case 'overtime': shouldPlay = bs.overtime; break;
    }

    const sound = shouldPlay ? (bs.soundType as SoundType) : undefined;

    notificationManager.notify('アジェンダタイマー', {
        body: message,
        sound: sound,
        silent: meetingSettings.silentMode
    });
};

export const useAgendaTimerStore = create<AgendaTimerStore>()(
  persist(
    (set, get) => ({
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
        return newMeeting.id;
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

      deleteAgenda: (meetingId: string, agendaId: string) => {
        set((state) => {
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
        set((state) => {
          const meeting = state.meetings.find((item) => item.id === meetingId);
          const selectedAgenda = meeting?.agenda.find((item) => item.id === agendaId);

          if (!meeting || !selectedAgenda) {
            return {};
          }

          // When switching agenda during an active run, pause the timer first.
          const previousAgendaId = meeting.currentAgendaId;
          const switchedDuringRun =
            state.isRunning &&
            previousAgendaId !== undefined &&
            previousAgendaId !== agendaId;

          if (!switchedDuringRun) {
            return {
              ...syncMeetingCurrentAgendaId(state, meetingId, agendaId),
              currentTime: selectedAgenda.actualDuration,
              lastTickTime: state.isRunning ? Date.now() : state.lastTickTime,
            };
          }

          const updatedMeetings: Meeting[] = state.meetings.map((item): Meeting => {
            if (item.id !== meetingId) return item;

            return {
              ...item,
              currentAgendaId: agendaId,
              agenda: item.agenda.map((agenda): AgendaItem => {
                if (agenda.id === previousAgendaId && agenda.status === "running") {
                  return { ...agenda, status: "paused" };
                }

                return agenda;
              }),
            };
          });

          const updatedMeeting = updatedMeetings.find((item) => item.id === meetingId) || null;

          return {
            meetings: updatedMeetings,
            currentMeeting:
              state.currentMeeting?.id === meetingId
                ? updatedMeeting
                : state.currentMeeting,
            isRunning: false,
            currentTime: selectedAgenda.actualDuration,
            lastTickTime: undefined,
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
                ? updatedMeetings.find((meeting) => meeting.id === meetingId) ||
                  state.currentMeeting
                : state.currentMeeting,
          };
        });
      },

      startTimer: () => {
        const state = get();
        const currentAgenda = get().getCurrentAgenda();
        const currentMeeting = state.currentMeeting;

        if (!currentAgenda || !currentMeeting) return;

        notificationManager.ensureInitialized().catch(console.warn);

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
          currentTime: currentAgenda.actualDuration,
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
          startTime: currentAgenda.startTime || now,
        });

        notifyAgenda('start', currentMeeting.settings, `アジェンダ「${currentAgenda.title}」を開始しました`);
      },

      pauseTimer: () => {
        const state = get();
        const currentAgenda = get().getCurrentAgenda();

        if (currentAgenda && state.currentMeeting) {
          const elapsedTime = Math.max(currentAgenda.actualDuration, state.currentTime);
          get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
            actualDuration: elapsedTime,
            remainingTime: currentAgenda.plannedDuration - elapsedTime,
            status: "paused",
          });

          set({ currentTime: elapsedTime });
        }

        set({ isRunning: false });
      },

      stopTimer: () => {
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
          endTime: new Date(),
        });

        const nextAgenda = state.currentMeeting.agenda
          .filter(
            (agenda) =>
              agenda.status === "pending" && agenda.id !== currentAgenda?.id,
          )
          .sort((a, b) => a.order - b.order)[0];

        if (nextAgenda) {
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

        if (deltaTime <= 0) return;

        const baseElapsed = Math.max(currentAgenda.actualDuration, state.currentTime);
        const newActualDuration = baseElapsed + deltaTime;
        const newRemainingTime = currentAgenda.plannedDuration - newActualDuration;

        set({
          currentTime: newActualDuration,
          lastTickTime: now,
        });

        get().updateAgenda(state.currentMeeting.id, currentAgenda.id, {
          remainingTime: newRemainingTime,
          actualDuration: newActualDuration,
          status: newRemainingTime <= 0 ? "overtime" : "running",
        });

        // 5 minute warning
        if (newRemainingTime === 300) {
            notifyAgenda('warning', state.currentMeeting.settings, `アジェンダ「${currentAgenda.title}」の残り時間は5分です`);
        }

        // Time's up
        if (newRemainingTime === 0) {
            notifyAgenda('end', state.currentMeeting.settings, `アジェンダ「${currentAgenda.title}」の予定時間が終了しました`);
        }

        // Overtime check every minute
        if (newRemainingTime < 0 && Math.abs(newRemainingTime) % 60 === 0) {
             notifyAgenda('overtime', state.currentMeeting.settings, `アジェンダ「${currentAgenda.title}」が${Math.abs(Math.floor(newRemainingTime / 60))}分超過しています`);
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
          if (firstPending) {
            set((prevState) =>
              syncMeetingCurrentAgendaId(
                prevState,
                state.currentMeeting!.id,
                firstPending.id,
              ),
            );
          }
          return firstPending || null;
        }

        const currentAgenda = state.currentMeeting.agenda.find(
          (agenda) => agenda.id === state.currentMeeting!.currentAgendaId,
        );

        if (!currentAgenda) {
          if (firstPending) {
            set((prevState) =>
              syncMeetingCurrentAgendaId(
                prevState,
                state.currentMeeting!.id,
                firstPending.id,
              ),
            );
          }
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
        return getProgressColor(percentage).bgColor;
      },

      syncTime: () => {
        const state = get();
        if (!state.isRunning || !state.lastTickTime) return;

        // Reuse tick so agenda-specific actualDuration/remainingTime stay consistent.
        get().tick();
      },
    }),
    {
      name: "agenda-timer-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentMeeting: state.currentMeeting,
        meetings: state.meetings,
      }),
    },
  ),
);
