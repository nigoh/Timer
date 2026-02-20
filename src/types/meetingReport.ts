export interface MeetingReportAgendaItem {
  agendaId: string;
  title: string;
  plannedDurationSec: number;
  actualDurationSec: number;
  varianceSec: number;
}

export interface MeetingReportTodo {
  id: string;
  text: string;
  owner?: string;
  dueDate?: string;
  done: boolean;
}

export interface MeetingReport {
  id: string;
  meetingId: string;
  meetingTitle: string;
  createdAt: string;
  heldAt: string;
  participants: string[];
  summary: string;
  decisions: string;
  nextActions: string;
  agendaItems: MeetingReportAgendaItem[];
  todos: MeetingReportTodo[];
  markdown: string;
}

export interface PostedIssueCommentHistory {
  id: string;
  meetingId: string;
  meetingTitle: string;
  commentUrl: string;
  postedAt: string;
}
