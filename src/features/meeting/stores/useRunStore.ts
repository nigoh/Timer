import { create } from 'zustand';
import { useMeetingStore } from './useMeetingStore';
import { useAgendaStore } from './useAgendaStore';
import type { AgendaItem, MinuteItem, MinuteType, OverrunDecision } from '../constants/meetingConstants';
import { logger } from '../../../utils/logger';

interface RunState {
  isRunning: boolean;
  startedAtMs: number | null;
  pausedAtMs: number | null;
  accumulatedPauseMs: number; // total paused duration
  lastEmittedSec: number; // to throttle updates to seconds
  tickId: number | null;
  currentAgendaId: string | null;
}

interface RunActions {
  initialize: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stop: (reason?: 'complete' | 'manual' | 'error', context?: Record<string, unknown>) => void;
  nextAgenda: (options?: NextAgendaOptions) => void;
  extendCurrent: (seconds: number, reason?: string) => { ok: boolean; reason?: string };
  borrowFromNext: (seconds: number, reason?: string) => { ok: boolean; reason?: string };
  skipCurrent: () => void;
  addMinute: (minute: AddMinuteInput) => void;
  logManualAdjustment: (message: string, context?: Record<string, unknown>) => void;
}

type NextAgendaOptions = {
  reason?: 'manual' | 'time' | 'skip';
  note?: string;
};

type AddMinuteInput = {
  agendaId?: string;
  type: MinuteType;
  content: string;
  owner?: string;
  due?: string;
  createdAt?: string;
};

type Store = RunState & RunActions;

const now = () => Date.now();

const RUN_LOG_CATEGORY = 'timer';

const logTimerEvent = (message: string, data?: Record<string, unknown>) => {
  logger.info(message, data, RUN_LOG_CATEGORY);
};

const logTimerWarning = (message: string, data?: Record<string, unknown>) => {
  logger.warn(message, data, RUN_LOG_CATEGORY);
};

function getActiveMeeting() {
  const { meetings, activeMeetingId } = useMeetingStore.getState();
  return meetings.find((m) => m.id === activeMeetingId) ?? null;
}

function getFirstAgendaId(meetingAgendas: AgendaItem[]): string | null {
  if (!meetingAgendas.length) return null;
  const sorted = [...meetingAgendas].sort((a, b) => a.order - b.order);
  return sorted[0]?.id ?? null;
}

export const useRunStore = create<Store>((set, get) => ({
  isRunning: false,
  startedAtMs: null,
  pausedAtMs: null,
  accumulatedPauseMs: 0,
  lastEmittedSec: 0,
  tickId: null,
  currentAgendaId: null,

  initialize: () => {
    const meeting = getActiveMeeting();
    if (!meeting) return;
    const firstId = getFirstAgendaId(meeting.agendas);
    set({
      isRunning: false,
      startedAtMs: null,
      pausedAtMs: null,
      accumulatedPauseMs: 0,
      lastEmittedSec: 0,
      tickId: get().tickId, // don't alter existing timer here
      currentAgendaId: firstId,
    });
  },

  start: () => {
    const meeting = getActiveMeeting();
    if (!meeting) {
      logTimerWarning('timer:start_missing_meeting');
      return;
    }
    if (!get().currentAgendaId) {
      useRunStore.getState().initialize();
    }
    if (get().tickId) clearInterval(get().tickId!);
    const started = now();
    // mark startAt for current agenda if not set
    const currentIdStart = get().currentAgendaId;
    if (currentIdStart) {
      const curMeeting = getActiveMeeting();
      if (curMeeting) {
        const agenda = curMeeting.agendas.find((a) => a.id === currentIdStart);
        if (agenda && !agenda.startAt) {
          useMeetingStore.setState((ms) => ({
            meetings: ms.meetings.map((m) =>
              m.id !== curMeeting.id
                ? m
                : {
                    ...m,
                    agendas: m.agendas.map((a) => (a.id === currentIdStart ? { ...a, startAt: new Date().toISOString() } : a)),
                  }
            ),
          }));
        }
      }
    }
    const id = setInterval(() => {
      const s = get();
      if (!s.isRunning || s.startedAtMs == null) return;
      if (s.pausedAtMs != null) return; // paused
      const elapsedMs = now() - s.startedAtMs - s.accumulatedPauseMs;
      const sec = Math.floor(elapsedMs / 1000);
      if (sec !== s.lastEmittedSec) {
        set({ lastEmittedSec: sec });
        // persist into meeting current agenda actualDuration
        const meeting2 = getActiveMeeting();
        if (!meeting2) return;
        const currentId = get().currentAgendaId;
        if (!currentId) return;
        const agenda = meeting2.agendas.find((a) => a.id === currentId);
        if (!agenda) return;
        if (agenda.actualDuration !== sec) {
          useMeetingStore.setState((ms) => ({
            meetings: ms.meetings.map((m) =>
              m.id !== meeting2.id
                ? m
                : {
                    ...m,
                    agendas: m.agendas.map((a) => (a.id === currentId ? { ...a, actualDuration: sec } : a)),
                  }
            ),
          }));
        }
      }
    }, 250) as unknown as number;
    set({ isRunning: true, startedAtMs: started, pausedAtMs: null, accumulatedPauseMs: 0, lastEmittedSec: 0, tickId: id });

    const latestAgendaId = get().currentAgendaId;
    const agendaForLog = latestAgendaId ? meeting.agendas.find((a) => a.id === latestAgendaId) : undefined;
    logTimerEvent('timer:start', {
      meetingId: meeting.id,
      agendaId: latestAgendaId,
      plannedDuration: agendaForLog?.plannedDuration ?? null,
    });
  },

  pause: () => {
    const s = get();
    if (!s.isRunning || s.pausedAtMs != null) return;
    set({ pausedAtMs: now() });
    logTimerEvent('timer:pause', {
      meetingId: getActiveMeeting()?.id,
      agendaId: s.currentAgendaId,
      elapsedSeconds: s.lastEmittedSec,
    });
  },

  resume: () => {
    const s = get();
    if (!s.isRunning || s.pausedAtMs == null) return;
    const pausedFor = now() - s.pausedAtMs;
    set({ accumulatedPauseMs: s.accumulatedPauseMs + pausedFor, pausedAtMs: null });
    logTimerEvent('timer:resume', {
      meetingId: getActiveMeeting()?.id,
      agendaId: s.currentAgendaId,
      pausedForMs: pausedFor,
    });
  },

  reset: () => {
    const meeting = getActiveMeeting();
    if (!meeting) {
      logTimerWarning('timer:reset_missing_meeting');
      return;
    }
    const currentId = get().currentAgendaId;
    if (!currentId) {
      logTimerWarning('timer:reset_missing_agenda', { meetingId: meeting.id });
      return;
    }
    const state = get();
    if (state.tickId) clearInterval(state.tickId);
    set({
      isRunning: false,
      tickId: null,
      startedAtMs: null,
      pausedAtMs: null,
      accumulatedPauseMs: 0,
      lastEmittedSec: 0,
    });
    useMeetingStore.setState((storeState) => ({
      meetings: storeState.meetings.map((m) =>
        m.id !== meeting.id
          ? m
          : {
              ...m,
              agendas: m.agendas.map((a) =>
                a.id === currentId
                  ? { ...a, actualDuration: 0, startAt: undefined, endAt: undefined }
                  : a,
              ),
            }
      ),
    }));
    logTimerEvent('timer:reset', {
      meetingId: meeting.id,
      agendaId: currentId,
    });
  },

  stop: (reason = 'manual', context) => {
    const s = get();
    if (s.tickId) clearInterval(s.tickId);
    set({ isRunning: false, tickId: null });
    const meetingId = getActiveMeeting()?.id;
    const eventName = reason === 'complete' ? 'timer:finish' : 'timer:stop';
    logTimerEvent(eventName, {
      meetingId,
      agendaId: s.currentAgendaId,
      elapsedSeconds: s.lastEmittedSec,
      reason,
      ...(context ?? {}),
    });
  },

  nextAgenda: (options: NextAgendaOptions = {}) => {
    const { reason = 'manual', note } = options;
    const meeting = getActiveMeeting();
    if (!meeting) {
      logTimerWarning('timer:next_missing_meeting', { reason, note });
      return;
    }
    const currentId = get().currentAgendaId;
    if (!currentId) {
      logTimerWarning('timer:next_missing_current', { meetingId: meeting.id, reason, note });
      return;
    }
    const agendas = [...meeting.agendas].sort((a, b) => a.order - b.order);
    const idx = agendas.findIndex((a) => a.id === currentId);
    if (idx < 0) {
      logTimerWarning('timer:next_missing_index', { meetingId: meeting.id, agendaId: currentId, reason, note });
      return;
    }
    // end current agenda timebox
    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) =>
        m.id !== meeting.id
          ? m
          : {
              ...m,
              agendas: m.agendas.map((a) => (a.id === currentId ? { ...a, endAt: new Date().toISOString() } : a)),
            }
      ),
    }));
    const next = agendas[idx + 1];
    if (!next) {
      // end of meeting
      useRunStore.getState().stop('complete', {
        meetingId: meeting.id,
        finishedAgendaId: currentId,
        note,
      });
      return;
    }
    set({ currentAgendaId: next.id, startedAtMs: now(), accumulatedPauseMs: 0, pausedAtMs: null, lastEmittedSec: 0 });
    // mark startAt for next agenda
    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) =>
        m.id !== meeting.id
          ? m
          : {
              ...m,
              agendas: m.agendas.map((a) => (a.id === next.id && !a.startAt ? { ...a, startAt: new Date().toISOString() } : a)),
            }
      ),
    }));
    logTimerEvent('timer:next', {
      meetingId: meeting.id,
      fromAgendaId: currentId,
      toAgendaId: next.id,
      reason,
      note,
    });
  },

  extendCurrent: (seconds, reason) => {
    const meeting = getActiveMeeting();
    if (!meeting) {
      logTimerWarning('timer:extend_missing_meeting', { seconds, reason });
      return { ok: false, reason: 'no-active-meeting' };
    }
    const currentId = get().currentAgendaId;
    if (!currentId) {
      logTimerWarning('timer:extend_missing_agenda', { meetingId: meeting.id, seconds, reason });
      return { ok: false, reason: 'no-current-agenda' };
    }
    const agenda = meeting.agendas.find((a) => a.id === currentId);
    if (!agenda) {
      logTimerWarning('timer:extend_agenda_not_found', { meetingId: meeting.id, agendaId: currentId, seconds, reason });
      return { ok: false, reason: 'agenda-not-found' };
    }

    const newPlanned = agenda.plannedDuration + seconds;
    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) =>
        m.id !== meeting.id
          ? m
          : {
              ...m,
              agendas: m.agendas.map((a) =>
                a.id === currentId
                  ? {
                      ...a,
                      plannedDuration: newPlanned,
                      overrunDecisions: [
                        ...a.overrunDecisions,
                        { type: 'extend', amountSec: seconds, at: new Date().toISOString(), fromAgendaId: currentId } as OverrunDecision,
                      ],
                    }
                  : a
              ),
            }
      ),
    }));
    logTimerEvent('timer:extend', {
      meetingId: meeting.id,
      agendaId: currentId,
      seconds,
      reason,
      newPlannedDuration: newPlanned,
    });
    return { ok: true };
  },

  borrowFromNext: (seconds, reason) => {
    const meeting = getActiveMeeting();
    if (!meeting) {
      logTimerWarning('timer:borrow_missing_meeting', { seconds, reason });
      return { ok: false, reason: 'no-active-meeting' };
    }
    const currentId = get().currentAgendaId;
    if (!currentId) {
      logTimerWarning('timer:borrow_missing_agenda', { meetingId: meeting.id, seconds, reason });
      return { ok: false, reason: 'no-current-agenda' };
    }
    const result = useAgendaStore.getState().applyBorrow(currentId, seconds);
    if (result.ok) {
      logTimerEvent('timer:borrow', {
        meetingId: meeting.id,
        agendaId: currentId,
        seconds,
        reason,
      });
    } else {
      logTimerWarning('timer:borrow_failed', {
        meetingId: meeting.id,
        agendaId: currentId,
        seconds,
        reason,
        failureReason: result.reason,
      });
    }
    return result;
  },

  skipCurrent: () => {
    const meeting = getActiveMeeting();
    if (!meeting) {
      logTimerWarning('timer:skip_missing_meeting');
      return;
    }
    const currentId = get().currentAgendaId;
    if (!currentId) {
      logTimerWarning('timer:skip_missing_agenda', { meetingId: meeting.id });
      return;
    }
    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) =>
        m.id !== meeting.id
          ? m
          : {
              ...m,
              agendas: m.agendas.map((a) =>
                a.id === currentId
                  ? {
                      ...a,
                      overrunDecisions: [
                        ...a.overrunDecisions,
                        { type: 'next', at: new Date().toISOString(), fromAgendaId: currentId } as OverrunDecision,
                      ],
                    }
                  : a
              ),
            }
      ),
    }));
    logTimerEvent('timer:skip', {
      meetingId: meeting.id,
      agendaId: currentId,
    });
    useRunStore.getState().nextAgenda({ reason: 'skip' });
  },

  addMinute: (minuteInput) => {
    const meeting = getActiveMeeting();
    if (!meeting) {
      logTimerWarning('minutes:add_missing_meeting', { minuteInput });
      return;
    }
    const agendaId = minuteInput.agendaId ?? get().currentAgendaId;
    if (!agendaId) {
      logTimerWarning('minutes:add_missing_agenda', { meetingId: meeting.id, minuteInput });
      return;
    }
    const agendaExists = meeting.agendas.some((a) => a.id === agendaId);
    if (!agendaExists) {
      logTimerWarning('minutes:add_agenda_not_found', { meetingId: meeting.id, agendaId, minuteInput });
      return;
    }
    const minute: MinuteItem = {
      id: (crypto as any)?.randomUUID?.() ?? Math.random().toString(36).slice(2),
      agendaId,
      type: minuteInput.type,
      content: minuteInput.content,
      owner: minuteInput.owner,
      due: minuteInput.due,
      createdAt: minuteInput.createdAt ?? new Date().toISOString(),
    };
    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) =>
        m.id !== meeting.id
          ? m
          : {
              ...m,
              agendas: m.agendas.map((a) => (a.id === agendaId ? { ...a, minutes: [...a.minutes, minute] } : a)),
            }
      ),
    }));
    logTimerEvent('minutes:recorded', {
      meetingId: meeting.id,
      agendaId,
      type: minute.type,
    });
  },

  logManualAdjustment: (message, context) => {
    logTimerEvent('timer:manual_adjustment', { message, ...(context ?? {}) });
  },
}));
