// Meeting feature constants (MVP)
// Note: Types will be added in Phase 2 (T006). This file currently exposes only constants.

export const AGENDA_CATEGORIES = [
  '報告', '連絡', '検討', '提案', '確認', '伝達'
] as const;
export type AgendaCategory = typeof AGENDA_CATEGORIES[number];

export const DEFAULT_MEETING_TITLE = '定例ミーティング';
export const DEFAULT_AGENDA_TITLES = ['進捗共有', '課題検討', '次回アクション'];

export const INITIAL_MEETING_DATE_ISO = '2025-11-01';
export const INITIAL_PARTICIPANT_COUNT = 5;
export const INITIAL_AGENDA_COUNT = 3;

// --- Types (from spec data-model) ---
export type MinuteType = 'Note' | 'Decision' | 'Action';

export interface MinuteItem {
  id: string;
  agendaId: string;
  type: MinuteType;
  content: string;
  owner?: string;
  due?: string; // ISO date
  createdAt: string; // ISO datetime
}

export type OverrunType = 'extend' | 'next' | 'borrow';

export interface OverrunDecision {
  type: OverrunType;
  amountSec?: number; // not required for 'next'
  at: string; // ISO datetime
  fromAgendaId?: string;
  toAgendaId?: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  category: AgendaCategory | string; // allow custom
  goal: string;
  discussionOutline: string;
  order: number;
  presenter: string;
  plannedDuration: number; // seconds
  actualDuration: number; // seconds
  startAt?: string; // ISO datetime
  endAt?: string; // ISO datetime
  overrunDecisions: OverrunDecision[];
  minutes: MinuteItem[];
}

export interface Participant {
  id: string;
  name: string;
  affiliation?: string;
  contact?: string;
  attendance?: boolean;
}

export interface RoleAssignments {
  facilitator?: string; // participantId
  timekeeper?: string;
  scribe?: string;
  participants: string[]; // participantIds
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  location: string;
  participants: Participant[];
  agendas: AgendaItem[];
  roles: RoleAssignments;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}
