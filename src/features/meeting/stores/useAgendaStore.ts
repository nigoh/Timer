import { create } from 'zustand';
import { useMeetingStore } from './useMeetingStore';
import type { AgendaItem, OverrunDecision } from '../constants/meetingConstants';

interface AgendaState {
  // derived from active meeting
}

interface AgendaActions {
  createAgenda: (agenda: Omit<AgendaItem, 'id' | 'order' | 'actualDuration' | 'overrunDecisions' | 'minutes'> & { id?: string; order?: number }) => void;
  updateAgenda: (agendaId: string, patch: Partial<AgendaItem>) => void;
  deleteAgenda: (agendaId: string) => void;
  reorderAgendas: (fromIndex: number, toIndex: number) => void;
  recordOverrunDecision: (agendaId: string, decision: OverrunDecision) => void;
  applyBorrow: (fromAgendaId: string, seconds: number) => { ok: boolean; reason?: string };
}

type Store = AgendaState & AgendaActions;

const uuid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

function getActiveMeeting() {
  const { meetings, activeMeetingId } = useMeetingStore.getState();
  return meetings.find((m) => m.id === activeMeetingId) ?? null;
}

export const useAgendaStore = create<Store>(() => ({
  createAgenda: (partial) => {
    const meeting = getActiveMeeting();
    if (!meeting) return;
    const id = partial.id ?? uuid();
    const order = partial.order ?? meeting.agendas.length;
    const agenda: AgendaItem = {
      id,
      title: partial.title,
      category: partial.category,
      goal: partial.goal ?? '',
      discussionOutline: partial.discussionOutline ?? '',
      order,
      presenter: partial.presenter ?? '',
      plannedDuration: partial.plannedDuration ?? 0,
      actualDuration: 0,
      overrunDecisions: [],
      minutes: [],
    };
    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) => (m.id === meeting.id ? { ...m, agendas: [...m.agendas, agenda] } : m)),
    }));
  },

  updateAgenda: (agendaId, patch) => {
    const meeting = getActiveMeeting();
    if (!meeting) return;
    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) =>
        m.id !== meeting.id
          ? m
          : {
              ...m,
              agendas: m.agendas.map((a) => (a.id === agendaId ? { ...a, ...patch } : a)),
            }
      ),
    }));
  },

  deleteAgenda: (agendaId) => {
    const meeting = getActiveMeeting();
    if (!meeting) return;
    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) =>
        m.id !== meeting.id
          ? m
          : { ...m, agendas: m.agendas.filter((a) => a.id !== agendaId).map((a, i) => ({ ...a, order: i })) }
      ),
    }));
  },

  reorderAgendas: (fromIndex, toIndex) => {
    const meeting = getActiveMeeting();
    if (!meeting) return;
    const list = [...meeting.agendas];
    if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return;
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    const reindexed = list.map((a, i) => ({ ...a, order: i }));
    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) => (m.id === meeting.id ? { ...m, agendas: reindexed } : m)),
    }));
  },

  recordOverrunDecision: (agendaId, decision) => {
    const meeting = getActiveMeeting();
    if (!meeting) return;
    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) =>
        m.id !== meeting.id
          ? m
          : {
              ...m,
              agendas: m.agendas.map((a) => (a.id === agendaId ? { ...a, overrunDecisions: [...a.overrunDecisions, decision] } : a)),
            }
      ),
    }));
  },

  applyBorrow: (fromAgendaId, seconds) => {
    const meeting = getActiveMeeting();
    if (!meeting) return { ok: false, reason: 'no-active-meeting' };
    const agendas = [...meeting.agendas].sort((a, b) => a.order - b.order);
    const fromIdx = agendas.findIndex((a) => a.id === fromAgendaId);
    if (fromIdx < 0) return { ok: false, reason: 'from-not-found' };
    const nextIdx = fromIdx + 1;
    if (nextIdx >= agendas.length) return { ok: false, reason: 'no-next-agenda' };
    const next = agendas[nextIdx];
    const newPlanned = next.plannedDuration - seconds;
    if (newPlanned < 0) return { ok: false, reason: 'negative-next' };

    useMeetingStore.setState((s) => ({
      meetings: s.meetings.map((m) =>
        m.id !== meeting.id
          ? m
          : {
              ...m,
              agendas: m.agendas.map((a) =>
                a.id === next.id
                  ? { ...a, plannedDuration: newPlanned }
                  : a.id === fromAgendaId
                  ? {
                      ...a,
                      overrunDecisions: [
                        ...a.overrunDecisions,
                        { type: 'borrow', amountSec: seconds, at: new Date().toISOString(), fromAgendaId, toAgendaId: next.id },
                      ],
                    }
                  : a
              ),
            }
      ),
    }));
    return { ok: true };
  },
}));
