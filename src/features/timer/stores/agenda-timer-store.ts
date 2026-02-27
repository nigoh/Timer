import { create } from "zustand";
import { Meeting, AgendaItem } from "@/types/agenda";
import { notificationManager, SoundType } from "@/utils/notification-manager";
import { logger } from "@/utils/logger";
import { generateId } from "@/utils/id";
import { getProgressColor } from "@/constants/timer-theme";
import { useMeetingKnowledgeStore } from "@/features/timer/stores/meeting-knowledge-store";

/** 1 タスクあたりのアジェンダタイマーインスタンス状態 */
export interface AgendaTimerInstanceState {
  currentMeeting: Meeting | null;
  meetings: Meeting[];
  isRunning: boolean;
  currentTime: number;
  meetingStartTime: Date | undefined;
  lastTickTime: number | undefined;
}

interface AgendaTimerStoreState {
  instances: Record<string, AgendaTimerInstanceState>;
}

interface AgendaTimerStoreActions {
  getOrCreateInstance: (taskId: string) => AgendaTimerInstanceState;
  createMeeting: (taskId: string, title: string) => string;
  updateMeetingTitle: (taskId: string, id: string, title: string) => void;
  deleteMeeting: (taskId: string, id: string) => void;
  setCurrentMeeting: (taskId: string, id: string) => void;
  updateMeetingSettings: (
    taskId: string,
    id: string,
    settings: Partial<Meeting["settings"]>,
  ) => void;
  addAgenda: (
    taskId: string,
    meetingId: string,
    title: string,
    plannedDuration: number,
    memo?: string,
  ) => void;
  updateAgenda: (
    taskId: string,
    meetingId: string,
    agendaId: string,
    updates: Partial<AgendaItem>,
  ) => void;
  updateAgendaMinutes: (
    taskId: string,
    meetingId: string,
    agendaId: string,
    updates: Pick<AgendaItem, "minutesContent" | "minutesFormat">,
  ) => void;
  deleteAgenda: (taskId: string, meetingId: string, agendaId: string) => void;
  selectAgenda: (taskId: string, meetingId: string, agendaId: string) => void;
  reorderAgendas: (taskId: string, meetingId: string, agendaIds: string[]) => void;
  startTimer: (taskId: string) => void;
  pauseTimer: (taskId: string) => void;
  stopTimer: (taskId: string) => void;
  nextAgenda: (taskId: string) => void;
  tick: (taskId: string) => void;
  getCurrentAgenda: (taskId: string) => AgendaItem | null;
  getProgressPercentage: (taskId: string) => number;
  getTotalProgressPercentage: (taskId: string) => number;
  calculateTimeColor: (percentage: number) => string;
  syncTime: (taskId: string) => void;
  removeInstance: (taskId: string) => void;
}

export type AgendaTimerStore = AgendaTimerStoreState & AgendaTimerStoreActions;

const createDefaultInstance = (): AgendaTimerInstanceState => ({
  currentMeeting: null,
  meetings: [],
  isRunning: false,
  currentTime: 0,
  meetingStartTime: undefined,
  lastTickTime: undefined,
});

const ensureInstance = (
  instances: Record<string, AgendaTimerInstanceState>,
  taskId: string,
): Record<string, AgendaTimerInstanceState> => {
  if (instances[taskId]) return instances;
  return { ...instances, [taskId]: createDefaultInstance() };
};

const updateInstance = (
  instances: Record<string, AgendaTimerInstanceState>,
  taskId: string,
  updater: (inst: AgendaTimerInstanceState) => Partial<AgendaTimerInstanceState>,
): Record<string, AgendaTimerInstanceState> => {
  const current = instances[taskId];
  if (!current) return instances;
  return { ...instances, [taskId]: { ...current, ...updater(current) } };
};

/** インスタンス内で meeting.currentAgendaId を同期するヘルパー */
const syncMeetingCurrentAgendaId = (
  inst: AgendaTimerInstanceState,
  meetingId: string,
  agendaId?: string,
): Partial<AgendaTimerInstanceState> => {
  const updatedMeetings = inst.meetings.map((meeting) =>
    meeting.id === meetingId
      ? { ...meeting, currentAgendaId: agendaId }
      : meeting,
  );
  const currentMeeting =
    inst.currentMeeting?.id === meetingId
      ? { ...inst.currentMeeting, currentAgendaId: agendaId }
      : inst.currentMeeting;

  return { meetings: updatedMeetings, currentMeeting };
};

const notifyAgenda = (
  type: 'start' | 'warning' | 'end' | 'overtime',
  meetingSettings: Meeting['settings'],
  message: string,
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
    silent: meetingSettings.silentMode,
  });
};

export const useAgendaTimerStore = create<AgendaTimerStore>((set, get) => ({
  instances: {},

  getOrCreateInstance: (taskId) => {
    const state = get();
    if (!state.instances[taskId]) {
      set({ instances: ensureInstance(state.instances, taskId) });
    }
    return get().instances[taskId] ?? createDefaultInstance();
  },

  createMeeting: (taskId, title) => {
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
      instances: updateInstance(
        ensureInstance(state.instances, taskId),
        taskId,
        (inst) => ({
          meetings: [...inst.meetings, newMeeting],
          currentMeeting: newMeeting,
        }),
      ),
    }));

    logger.info("Meeting created", { meetingId: newMeeting.id, title: newMeeting.title }, "agenda");
    return newMeeting.id;
  },

  updateMeetingTitle: (taskId, id, title) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        meetings: inst.meetings.map((m) => (m.id === id ? { ...m, title } : m)),
        currentMeeting:
          inst.currentMeeting?.id === id
            ? { ...inst.currentMeeting, title }
            : inst.currentMeeting,
      })),
    }));

    logger.info("Meeting title updated", { meetingId: id, title }, "agenda");
  },

  deleteMeeting: (taskId, id) => {
    const inst = get().instances[taskId];
    const meetingToDelete = inst?.meetings.find((m) => m.id === id);

    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        meetings: inst.meetings.filter((m) => m.id !== id),
        currentMeeting: inst.currentMeeting?.id === id ? null : inst.currentMeeting,
      })),
    }));

    logger.info("Meeting deleted", { meetingId: id, title: meetingToDelete?.title }, "agenda");
  },

  setCurrentMeeting: (taskId, id) => {
    const inst = get().instances[taskId];
    const meeting = inst?.meetings.find((m) => m.id === id);
    if (!meeting) return;

    set((state) => ({
      instances: updateInstance(state.instances, taskId, () => ({
        currentMeeting: meeting,
      })),
    }));
  },

  updateMeetingSettings: (taskId, id, settings) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        meetings: inst.meetings.map((m) =>
          m.id === id ? { ...m, settings: { ...m.settings, ...settings } } : m,
        ),
        currentMeeting:
          inst.currentMeeting?.id === id
            ? { ...inst.currentMeeting, settings: { ...inst.currentMeeting.settings, ...settings } }
            : inst.currentMeeting,
      })),
    }));
  },

  addAgenda: (taskId, meetingId, title, plannedDuration, memo?) => {
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

    set((state) => ({
      instances: updateInstance(
        ensureInstance(state.instances, taskId),
        taskId,
        (inst) => {
          const updatedMeetings = inst.meetings.map((meeting) => {
            if (meeting.id === meetingId) {
              const agendaWithOrder = meeting.agenda.map((a, i) => ({ ...a, order: i }));
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
              inst.currentMeeting?.id === meetingId
                ? updatedMeetings.find((m) => m.id === meetingId) || inst.currentMeeting
                : inst.currentMeeting,
          };
        },
      ),
    }));
  },

  updateAgenda: (taskId, meetingId, agendaId, updates) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => {
        const updatedMeetings = inst.meetings.map((meeting) => {
          if (meeting.id === meetingId) {
            const updatedAgenda = meeting.agenda.map((a) =>
              a.id === agendaId ? { ...a, ...updates } : a,
            );
            return {
              ...meeting,
              agenda: updatedAgenda,
              totalPlannedDuration: updatedAgenda.reduce((s, a) => s + a.plannedDuration, 0),
              totalActualDuration: updatedAgenda.reduce((s, a) => s + a.actualDuration, 0),
            };
          }
          return meeting;
        });

        const updatedMeeting = updatedMeetings.find((m) => m.id === meetingId);

        return {
          meetings: updatedMeetings,
          currentMeeting:
            inst.currentMeeting?.id === meetingId
              ? {
                  ...inst.currentMeeting,
                  ...(updatedMeeting || {}),
                  currentAgendaId:
                    updatedMeeting?.currentAgendaId || inst.currentMeeting.currentAgendaId,
                }
              : inst.currentMeeting,
        };
      }),
    }));
  },

  updateAgendaMinutes: (taskId, meetingId, agendaId, updates) => {
    get().updateAgenda(taskId, meetingId, agendaId, updates);
  },

  deleteAgenda: (taskId, meetingId, agendaId) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => {
        const targetMeeting = inst.meetings.find((m) => m.id === meetingId);
        const deletedAgenda = targetMeeting?.agenda.find((a) => a.id === agendaId);
        const shouldReselect =
          targetMeeting?.currentAgendaId !== undefined &&
          targetMeeting.currentAgendaId === agendaId;

        const updatedMeetings = inst.meetings.map((meeting) => {
          if (meeting.id === meetingId) {
            const remaining = meeting.agenda.filter((a) => a.id !== agendaId);
            const nextCandidate = shouldReselect
              ? remaining
                  .filter((a) => a.order > (deletedAgenda?.order ?? -1))
                  .sort((a, b) => a.order - b.order)[0] ||
                [...remaining].sort((a, b) => a.order - b.order)[0]
              : undefined;
            const updatedAgenda = remaining.map((a, i) => ({ ...a, order: i }));

            return {
              ...meeting,
              agenda: updatedAgenda,
              totalPlannedDuration:
                meeting.totalPlannedDuration - (deletedAgenda?.plannedDuration || 0),
              currentAgendaId: shouldReselect ? nextCandidate?.id : meeting.currentAgendaId,
            };
          }
          return meeting;
        });

        const updatedMeeting = updatedMeetings.find((m) => m.id === meetingId);

        return {
          meetings: updatedMeetings,
          currentMeeting:
            inst.currentMeeting?.id === meetingId
              ? updatedMeeting || inst.currentMeeting
              : inst.currentMeeting,
        };
      }),
    }));
  },

  selectAgenda: (taskId, meetingId, agendaId) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => {
        const meeting = inst.meetings.find((m) => m.id === meetingId);
        const selectedAgenda = meeting?.agenda.find((a) => a.id === agendaId);

        if (!meeting || !selectedAgenda) return {};

        const previousAgendaId = meeting.currentAgendaId;
        const switchedDuringRun =
          inst.isRunning &&
          previousAgendaId !== undefined &&
          previousAgendaId !== agendaId;

        if (!switchedDuringRun) {
          return {
            ...syncMeetingCurrentAgendaId(inst, meetingId, agendaId),
            currentTime: selectedAgenda.actualDuration,
            lastTickTime: inst.isRunning ? Date.now() : inst.lastTickTime,
          };
        }

        const updatedMeetings: Meeting[] = inst.meetings.map((item): Meeting => {
          if (item.id !== meetingId) return item;
          return {
            ...item,
            currentAgendaId: agendaId,
            agenda: item.agenda.map((a): AgendaItem => {
              if (a.id === previousAgendaId && a.status === "running") {
                return { ...a, status: "paused" };
              }
              return a;
            }),
          };
        });

        const updatedMeeting = updatedMeetings.find((m) => m.id === meetingId) || null;

        return {
          meetings: updatedMeetings,
          currentMeeting:
            inst.currentMeeting?.id === meetingId ? updatedMeeting : inst.currentMeeting,
          isRunning: false,
          currentTime: selectedAgenda.actualDuration,
          lastTickTime: undefined,
        };
      }),
    }));
  },

  reorderAgendas: (taskId, meetingId, agendaIds) => {
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => {
        const updatedMeetings = inst.meetings.map((meeting) => {
          if (meeting.id === meetingId) {
            const reordered = agendaIds
              .map((id, i) => {
                const a = meeting.agenda.find((item) => item.id === id);
                return a ? { ...a, order: i } : null;
              })
              .filter(Boolean) as AgendaItem[];
            return { ...meeting, agenda: reordered };
          }
          return meeting;
        });
        return {
          meetings: updatedMeetings,
          currentMeeting:
            inst.currentMeeting?.id === meetingId
              ? updatedMeetings.find((m) => m.id === meetingId) || inst.currentMeeting
              : inst.currentMeeting,
        };
      }),
    }));
  },

  startTimer: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst) return;

    const currentAgenda = get().getCurrentAgenda(taskId);
    const currentMeeting = inst.currentMeeting;
    if (!currentAgenda || !currentMeeting) return;

    notificationManager.ensureInitialized().catch(console.warn);

    const nowTimestamp = Date.now();
    const now = new Date(nowTimestamp);

    // sync currentAgendaId first
    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) =>
        syncMeetingCurrentAgendaId(inst, currentMeeting.id, currentAgenda.id),
      ),
    }));

    set((state) => ({
      instances: updateInstance(state.instances, taskId, (inst) => ({
        isRunning: true,
        currentTime: currentAgenda.actualDuration,
        meetingStartTime: inst.meetingStartTime || now,
        lastTickTime: nowTimestamp,
      })),
    }));

    logger.timerStart(currentAgenda.id, "agenda", currentAgenda.plannedDuration * 60);
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

    get().updateAgenda(taskId, currentMeeting.id, currentAgenda.id, {
      status: "running",
      startTime: currentAgenda.startTime || now,
    });

    notifyAgenda('start', currentMeeting.settings, `アジェンダ「${currentAgenda.title}」を開始しました`);
  },

  pauseTimer: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst) return;

    const currentAgenda = get().getCurrentAgenda(taskId);

    if (currentAgenda && inst.currentMeeting) {
      const elapsedTime = Math.max(currentAgenda.actualDuration, inst.currentTime);
      get().updateAgenda(taskId, inst.currentMeeting.id, currentAgenda.id, {
        actualDuration: elapsedTime,
        remainingTime: currentAgenda.plannedDuration - elapsedTime,
        status: "paused",
      });

      set((state) => ({
        instances: updateInstance(state.instances, taskId, () => ({
          currentTime: elapsedTime,
          isRunning: false,
        })),
      }));
    } else {
      set((state) => ({
        instances: updateInstance(state.instances, taskId, () => ({
          isRunning: false,
        })),
      }));
    }
  },

  stopTimer: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst) return;

    if (inst.isRunning) {
      set((state) => ({
        instances: updateInstance(state.instances, taskId, () => ({
          isRunning: false,
          lastTickTime: undefined,
        })),
      }));
    }

    get().nextAgenda(taskId);
  },

  nextAgenda: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst?.currentMeeting || inst.isRunning) return;

    const currentAgenda = get().getCurrentAgenda(taskId);
    if (!currentAgenda) return;

    const canAdvance =
      currentAgenda.status === "running" ||
      currentAgenda.status === "paused" ||
      currentAgenda.status === "overtime";
    if (!canAdvance) return;

    get().updateAgenda(taskId, inst.currentMeeting.id, currentAgenda.id, {
      status: "completed",
      endTime: new Date(),
    });

    const meetingId = inst.currentMeeting.id;
    const nextItem = inst.currentMeeting.agenda
      .filter((a) => a.status === "pending" && a.id !== currentAgenda.id)
      .sort((a, b) => a.order - b.order)[0];

    if (nextItem) {
      set((state) => ({
        instances: updateInstance(state.instances, taskId, (inst) => ({
          ...syncMeetingCurrentAgendaId(inst, meetingId, nextItem.id),
          currentTime: 0,
        })),
      }));

      if (inst.currentMeeting.settings.autoTransition && inst.isRunning) {
        setTimeout(() => get().startTimer(taskId), 1000);
      }
    } else {
      const completedAt = new Date();
      set((state) => ({
        instances: updateInstance(state.instances, taskId, (inst) => ({
          meetings: inst.meetings.map((m) =>
            m.id === meetingId ? { ...m, status: "completed" as const, endTime: completedAt } : m,
          ),
          currentMeeting: inst.currentMeeting
            ? { ...inst.currentMeeting, status: "completed" as const, endTime: completedAt }
            : null,
          isRunning: false,
          currentTime: 0,
          meetingStartTime: undefined,
          lastTickTime: undefined,
        })),
      }));

      // MAPE-K Monitor: 完了した会議を Knowledge Store に記録
      const completedMeeting = get().instances[taskId]?.meetings.find(
        (m) => m.id === meetingId,
      );
      if (completedMeeting) {
        useMeetingKnowledgeStore.getState().addMeetingRecord(completedMeeting);
      }
    }
  },

  tick: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst?.isRunning || !inst.currentMeeting) return;

    const currentAgenda = get().getCurrentAgenda(taskId);
    if (!currentAgenda) return;

    const now = Date.now();
    const deltaTime = inst.lastTickTime
      ? Math.round((now - inst.lastTickTime) / 1000)
      : 1;

    if (deltaTime <= 0) return;

    const baseElapsed = Math.max(currentAgenda.actualDuration, inst.currentTime);
    const newActualDuration = baseElapsed + deltaTime;
    const newRemainingTime = currentAgenda.plannedDuration - newActualDuration;

    set((state) => ({
      instances: updateInstance(state.instances, taskId, () => ({
        currentTime: newActualDuration,
        lastTickTime: now,
      })),
    }));

    get().updateAgenda(taskId, inst.currentMeeting.id, currentAgenda.id, {
      remainingTime: newRemainingTime,
      actualDuration: newActualDuration,
      status: newRemainingTime <= 0 ? "overtime" : "running",
    });

    // 5 minute warning
    if (newRemainingTime === 300) {
      notifyAgenda('warning', inst.currentMeeting.settings, `アジェンダ「${currentAgenda.title}」の残り時間は5分です`);
    }

    // Time's up
    if (newRemainingTime === 0) {
      notifyAgenda('end', inst.currentMeeting.settings, `アジェンダ「${currentAgenda.title}」の予定時間が終了しました`);
    }

    // Overtime check every minute
    if (newRemainingTime < 0 && Math.abs(newRemainingTime) % 60 === 0) {
      notifyAgenda('overtime', inst.currentMeeting.settings, `アジェンダ「${currentAgenda.title}」が${Math.abs(Math.floor(newRemainingTime / 60))}分超過しています`);
    }
  },

  getCurrentAgenda: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst?.currentMeeting) return null;

    const sortedPending = [...inst.currentMeeting.agenda]
      .filter((a) => a.status === "pending")
      .sort((a, b) => a.order - b.order);
    const firstPending = sortedPending[0];

    if (!inst.currentMeeting.currentAgendaId) {
      if (firstPending) {
        set((state) => ({
          instances: updateInstance(state.instances, taskId, (inst) =>
            syncMeetingCurrentAgendaId(inst, inst.currentMeeting!.id, firstPending.id),
          ),
        }));
      }
      return firstPending || null;
    }

    const currentAgenda = inst.currentMeeting.agenda.find(
      (a) => a.id === inst.currentMeeting!.currentAgendaId,
    );

    if (!currentAgenda) {
      if (firstPending) {
        set((state) => ({
          instances: updateInstance(state.instances, taskId, (inst) =>
            syncMeetingCurrentAgendaId(inst, inst.currentMeeting!.id, firstPending.id),
          ),
        }));
      }
      return firstPending || null;
    }

    return currentAgenda;
  },

  getProgressPercentage: (taskId) => {
    const currentAgenda = get().getCurrentAgenda(taskId);
    if (!currentAgenda) return 0;
    return Math.min(
      (currentAgenda.actualDuration / currentAgenda.plannedDuration) * 100,
      150,
    );
  },

  getTotalProgressPercentage: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst?.currentMeeting || inst.currentMeeting.totalPlannedDuration === 0) return 0;
    return Math.min(
      (inst.currentMeeting.totalActualDuration / inst.currentMeeting.totalPlannedDuration) * 100,
      150,
    );
  },

  calculateTimeColor: (percentage) => {
    return getProgressColor(percentage).bgColor;
  },

  syncTime: (taskId) => {
    const inst = get().instances[taskId];
    if (!inst?.isRunning || !inst.lastTickTime) return;
    get().tick(taskId);
  },

  removeInstance: (taskId) => {
    set((state) => {
      const { [taskId]: _, ...rest } = state.instances;
      return { instances: rest };
    });
  },
}));
