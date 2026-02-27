import type { Meeting } from '@/types/agenda';

// ─── Monitor: 会議記録 ──────────────────────────────

export interface AgendaRecord {
  agendaId: string;
  title: string;
  plannedDuration: number;       // 秒
  actualDuration: number;        // 秒
  wasOvertime: boolean;
  overtimeAmount: number;        // 秒（超過量、0 以上）
}

export interface MeetingRecord {
  id: string;
  meetingId: string;
  title: string;
  agendaRecords: AgendaRecord[];
  totalPlannedDuration: number;  // 秒
  totalActualDuration: number;   // 秒
  completedAt: string;           // ISO 8601
  suggestionApplied: boolean;    // 提案が適用された会議か
}

// ─── Analyze: 分析インサイト ───────────────────────────

export interface MeetingInsight {
  type: 'overtime-trend' | 'item-pattern' | 'duration-mismatch';
  description: string;
  confidence: number;            // 0-1
  data: Record<string, number>;
}

// ─── Analyze → Knowledge: 学習パターン ───────────────────

export interface LearnedPattern {
  id: string;
  titlePattern: string;          // 議題タイトルの分類パターン
  avgPlannedDuration: number;    // 秒
  avgActualDuration: number;     // 秒
  avgOvertimeRate: number;       // 0-1
  sampleCount: number;           // 集計対象件数
  updatedAt: string;             // ISO 8601
}

// ─── Plan: 改善提案 ──────────────────────────────

export type SuggestionType =
  | 'duration-adjustment'
  | 'total-duration'
  | 'notification-timing';

export interface Suggestion {
  id: string;
  agendaId: string;
  type: SuggestionType;
  currentValue: number;          // 秒
  suggestedValue: number;        // 秒
  reason: string;                // 人間可読な根拠
  confidence: number;            // 0-1
  basedOnCount: number;          // 根拠データ件数
}

// ─── Knowledge: 設定 ──────────────────────────────

export interface KnowledgeSettings {
  enabled: boolean;              // 提案表示 ON/OFF
  learningWindow: number;        // 学習期間（件数、デフォルト 20）
  movingAverageWindow: number;   // 移動平均ウィンドウ（デフォルト 5）
  suggestionThreshold: number;   // 提案生成の超過率閾値（デフォルト 0.2）
}

// ─── Knowledge Store: State / Actions ──────────────

export interface MeetingKnowledgeState {
  records: MeetingRecord[];
  learnedPatterns: LearnedPattern[];
  settings: KnowledgeSettings;
}

export interface MeetingKnowledgeActions {
  addMeetingRecord: (meeting: Meeting) => void;
  getRecords: () => MeetingRecord[];
  getPatterns: () => LearnedPattern[];
  updateSettings: (settings: Partial<KnowledgeSettings>) => void;
  resetKnowledge: () => void;
}
