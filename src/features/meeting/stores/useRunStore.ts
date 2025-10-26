import { create } from 'zustand';
import { useMeetingStore } from './useMeetingStore';
import { useAgendaStore } from './useAgendaStore';
import type { AgendaItem, MinuteItem, OverrunDecision } from '../constants/meetingConstants';

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
  stop: () => void;
  nextAgenda: () => void;
  extendCurrent: (seconds: number) => { ok: boolean; reason?: string };
  borrowFromNext: (seconds: number) => { ok: boolean; reason?: string };
  skipCurrent: () => void;
  addMinute: (text: string) => void;
}

type Store = RunState & RunActions;

const now = () => Date.now();

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
    if (!meeting) return;
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
  },

  pause: () => {
    const s = get();
    if (!s.isRunning || s.pausedAtMs != null) return;
    set({ pausedAtMs: now() });
  },

  resume: () => {
    const s = get();
    if (!s.isRunning || s.pausedAtMs == null) return;
    const pausedFor = now() - s.pausedAtMs;
    set({ accumulatedPauseMs: s.accumulatedPauseMs + pausedFor, pausedAtMs: null });
  },

  stop: () => {
    const s = get();
    if (s.tickId) clearInterval(s.tickId);
    set({ isRunning: false, tickId: null });
  },

  nextAgenda: () => {
    const meeting = getActiveMeeting();
    if (!meeting) return;
    const currentId = get().currentAgendaId;
    if (!currentId) return;
    const agendas = [...meeting.agendas].sort((a, b) => a.order - b.order);
    const idx = agendas.findIndex((a) => a.id === currentId);
    if (idx < 0) return;
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
      useRunStore.getState().stop();
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
  },

  extendCurrent: (seconds) => {
    const meeting = getActiveMeeting();
    if (!meeting) return { ok: false, reason: 'no-active-meeting' };
    const currentId = get().currentAgendaId;
    if (!currentId) return { ok: false, reason: 'no-current-agenda' };
    const agenda = meeting.agendas.find((a) => a.id === currentId);
    if (!agenda) return { ok: false, reason: 'agenda-not-found' };

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
    return { ok: true };
  },

  borrowFromNext: (seconds) => {
    const meeting = getActiveMeeting();
    if (!meeting) return { ok: false, reason: 'no-active-meeting' };
    const currentId = get().currentAgendaId;
    if (!currentId) return { ok: false, reason: 'no-current-agenda' };
    return useAgendaStore.getState().applyBorrow(currentId, seconds);
  },

  skipCurrent: () => {
    const meeting = getActiveMeeting();
    if (!meeting) return;
    const currentId = get().currentAgendaId;
    if (!currentId) return;
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
    useRunStore.getState().nextAgenda();
  },

  addMinute: (text) => {
    const meeting = getActiveMeeting();
    if (!meeting) return;
    const currentId = get().currentAgendaId;
    if (!currentId) return;
    const minute: MinuteItem = {
      id: (crypto as any)?.randomUUID?.() ?? Math.random().toString(36).slice(2),
      agendaId: currentId,
      type: 'Note',
      content: text,
      createdAt: new Date().toISOString(),
    };
    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) =>
        m.id !== meeting.id
          ? m
          : {
              ...m,
              agendas: m.agendas.map((a) => (a.id === currentId ? { ...a, minutes: [...a.minutes, minute] } : a)),
            }
      ),
    }));
  },
}));
