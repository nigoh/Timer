# 設計書: データ永続化（Issue #55）

## 1. 概要

Focuso アプリケーションのデータ永続化設計。  
ローカルストレージ（localStorage）を第一段階とし、将来的なデータベース移行に対応できる抽象レイヤーを導入する。

## 2. 調査結果

### 2.1 現状分析

| ストア | 永続化状態 | 備考 |
|--------|-----------|------|
| `task-store` | ✅ 対応済み | tasks, activeTaskId, presets |
| `ui-preferences-store` | ✅ 対応済み | sidebarOpen |
| `integration-link-store` | ✅ 対応済み | linksByLogId のみ（PAT/API設定は非永続） |
| `meeting-knowledge-store` | ✅ 対応済み | records, learnedPatterns, settings |
| `meeting-report-store` | ✅ 対応済み | reports, postedCommentHistory |
| `dashboard-store` | ✅ 対応済み | filter |
| `basic-timer-store` | ❌ 未対応 → ✅ 対応 | 履歴・設定が消失していた |
| `pomodoro-store` | ❌ 未対応 → ✅ 対応 | 設定・統計・セッションが消失していた |
| `multi-timer-store` | ❌ 未対応 → ✅ 対応 | タイマー定義・カテゴリが消失していた |
| `agenda-timer-store` | ❌ 未対応 → ✅ 対応 | 会議データが消失していた |
| `voice-store` | ❌ 未対応（対象外） | ランタイム状態のみ（録音中/文字起こし中間状態） |
| `tick-manager-store` | ❌ 未対応（対象外） | ランタイム状態のみ（setInterval ID） |

### 2.2 技術的実現性

- **localStorage**: Zustand `persist` ミドルウェアで既に実績あり。容量上限は 5–10 MB（ブラウザ依存）。
- **IndexedDB**: `idb-keyval` 等で非同期ストレージとして利用可能。Zustand persist は非同期 storage をサポート。
- **リモートDB**: REST API / WebSocket 経由で同期可能。ストレージアダプターの差し替えで対応。

## 3. アーキテクチャ設計

### 3.1 ストレージアダプター抽象レイヤー

```
┌─────────────────────────────────────────┐
│  Zustand Store (persist middleware)     │
│  createJSONStorage(() => provider)      │
├─────────────────────────────────────────┤
│  IStorageProvider (抽象インターフェース)  │
│  ├─ getItem(key) → string | null       │
│  ├─ setItem(key, value) → void         │
│  └─ removeItem(key) → void            │
├─────────────────────────────────────────┤
│  LocalStorageProvider (現在の実装)       │
│  │  └─ localStorage API 呼び出し       │
│  │                                      │
│  IndexedDBProvider (将来)               │
│  │  └─ IndexedDB API 呼び出し          │
│  │                                      │
│  RemoteStorageProvider (将来)           │
│     └─ REST API / WebSocket 呼び出し   │
└─────────────────────────────────────────┘
```

### 3.2 実装ファイル

- `src/utils/storage-adapter.ts` — `IStorageProvider` インターフェースとデフォルト実装

### 3.3 永続化方針

#### 永続化対象

各ストアの永続化対象は `partialize` で制御し、ランタイム状態（`isRunning`, `lastTickTime` 等）は除外する。

| ストア | 永続化フィールド | 除外フィールド |
|--------|-----------------|---------------|
| `basic-timer-store` | duration, sessionLabel, history | isRunning, isPaused, remainingTime, sessionId, sessionStartTime, lastTickTime |
| `pomodoro-store` | settings, todayStats, sessions | isRunning, isPaused, currentPhase, timeRemaining, cycle, totalCycles, taskName, lastTickTime |
| `multi-timer-store` | timers（実行状態リセット）, categories, globalSettings, sessions | isAnyRunning |
| `agenda-timer-store` | meetings, currentMeeting | isRunning, currentTime, meetingStartTime, lastTickTime |

#### リストア時の挙動

- ランタイム状態はデフォルト値で初期化する
- `remainingTime` は保存された `duration` から復元する
- Date オブジェクトは JSON シリアライズ/デシリアライズ時に `new Date()` で再構築する

## 4. LocalStorage キー一覧

| キー名 | ストア | バージョン |
|--------|--------|-----------|
| `task-store` | TaskStore | v1 |
| `ui-preferences` | UIPreferencesStore | — |
| `integration-links` | IntegrationLinkStore | — |
| `meeting-knowledge-store` | MeetingKnowledgeStore | — |
| `meeting-report-store` | MeetingReportStore | — |
| `dashboard-filter` | DashboardStore | — |
| `basic-timer-store` | BasicTimerStore | — |
| `pomodoro-store` | PomodoroStore | — |
| `multi-timer-store` | MultiTimerStore | — |
| `agenda-timer-store` | AgendaTimerStore | — |

## 5. 将来のDB移行パス

### Phase 1（現在）: localStorage

- `LocalStorageProvider` を使用
- ブラウザ単位のデータ保持

### Phase 2（将来）: IndexedDB

- `IndexedDBProvider` を実装し `setStorageProvider()` で差し替え
- より大容量のデータ保持（数百 MB）
- トランザクション対応

### Phase 3（将来）: リモートDB同期

- `RemoteStorageProvider` を実装
- オンライン/オフライン同期
- マルチデバイス対応
- 競合解決ロジックの追加

### 移行時の原則

1. `IStorageProvider` インターフェースを守る限り、ストア側の変更は不要
2. バージョニング（`version` + `migrate`）で既存データの互換性を維持する
3. データ移行ユーティリティは Phase 2/3 実装時に追加する

## 6. テスト方針

- `src/utils/__tests__/storage-adapter.test.ts` — ストレージアダプターの単体テスト
- `src/features/timer/stores/__tests__/store-persistence.test.ts` — 各ストアの `partialize` 検証
- カスタムプロバイダーへの差し替えテスト

## 7. セキュリティ考慮

- API キー・PAT は永続化対象から除外する（`integration-link-store` の `partialize` で制御済み）
- localStorage はクライアントサイドのみ — XSS 対策はアプリケーション全体のセキュリティ方針に従う
- 将来のリモート同期時は暗号化・認証を検討する
