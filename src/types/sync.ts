/** 同期ステータス */
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

/** Supabase sync_data テーブルの 1 レコードに対応 */
export interface SyncRecord {
  storeKey: string;
  data: unknown;
  updatedAt: string; // ISO 8601
}

/** 全ストアの同期対象キー一覧 */
export const SYNC_STORE_KEYS = [
  'task-store',
  'basic-timer-store',
  'pomodoro-store',
  'agenda-timer-store',
  'multi-timer-store',
  'meeting-report-store',
  'integration-links',
  'ui-preferences',
  'meeting-knowledge-store',
] as const;

export type SyncStoreKey = (typeof SYNC_STORE_KEYS)[number];
