import { create } from 'zustand';
import {
  Meeting,
  Participant,
  AgendaItem,
  AGENDA_CATEGORIES,
  DEFAULT_MEETING_TITLE,
  DEFAULT_AGENDA_TITLES,
  INITIAL_MEETING_DATE_ISO,
} from '../constants/meetingConstants';

export interface MeetingState {
  meetings: Meeting[];
  activeMeetingId: string | null;
  loading: boolean;
  error: string | null;
}

export interface MeetingActions {
  setActiveMeeting: (id: string | null) => void;
  createMeeting: (partial?: Partial<Meeting>) => Meeting;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  seedInitialDataIfNeeded: () => void;
}

type Store = MeetingState & MeetingActions;

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

export const useMeetingStore = create<Store>((set, get) => ({
  meetings: [],
  activeMeetingId: null,
  loading: false,
  error: null,

  setActiveMeeting: (id) => set({ activeMeetingId: id }),

  createMeeting: (partial) => {
    const id = uuid();
    const participants: Participant[] = partial?.participants ?? [];
    const agendas: AgendaItem[] = partial?.agendas ?? [];
    const meeting: Meeting = {
      id,
      title: partial?.title ?? DEFAULT_MEETING_TITLE,
      date: partial?.date ?? INITIAL_MEETING_DATE_ISO,
      startTime: partial?.startTime ?? '10:00',
      location: partial?.location ?? '',
      participants,
      agendas,
      roles: { participants: participants.map((p) => p.id) },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    set((s) => ({ meetings: [...s.meetings, meeting] }));
    return meeting;
  },

  updateMeeting: (id, patch) => {
    set((s) => ({
      meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: nowIso() } : m)),
    }));
  },

  deleteMeeting: (id) => {
    set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) }));
    const state = get();
    if (state.activeMeetingId === id) set({ activeMeetingId: null });
  },

  seedInitialDataIfNeeded: () => {
    const { meetings, createMeeting } = get();
    if (meetings.length > 0) return;

    // participants
    const participants: Participant[] = Array.from({ length: 5 }).map((_, i) => ({
      id: uuid(),
      name: `参加者${i + 1}`,
      attendance: true,
    }));

    // agendas (3)
    const agendas: AgendaItem[] = DEFAULT_AGENDA_TITLES.slice(0, 3).map((title, idx) => ({
      id: uuid(),
      title,
      category: AGENDA_CATEGORIES[idx % AGENDA_CATEGORIES.length],
      goal: '',
      discussionOutline: '',
      order: idx,
      presenter: participants[idx % participants.length].name,
      plannedDuration: 10 * 60, // 10min default
      actualDuration: 0,
      overrunDecisions: [],
      minutes: [],
    }));

    const m = createMeeting({ participants, agendas });
    set({ activeMeetingId: m.id });
  },
}));
