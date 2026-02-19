/** GitHub Issue との連携リンク情報 */
export interface IntegrationLink {
  /** ローカル一意 ID (crypto.randomUUID) */
  id: string;
  /** リポジトリ所有者 */
  owner: string;
  /** リポジトリ名 */
  repo: string;
  /** Issue 番号 */
  issueNumber: number;
  /** Issue タイトル (Phase 1: 手入力、Phase 2: API から自動取得) */
  issueTitle?: string;
  /** GitHub Issue URL */
  issueUrl: string;
  /** 作成日時 (ISO 8601) */
  createdAt: string;
}

/** TimeLog に付加される連携情報 */
export interface TimeLogWithLinks {
  timeLogId: string;
  links: IntegrationLink[];
}
