# タスク計画: データ永続化

## フェーズ概要

4 つのタイマーストア（basic-timer / pomodoro / multi-timer / agenda-timer）にデータ永続化を追加する。
ストレージバックエンドを抽象化し、将来の DB 移行に備える。

---

## P0: ストレージアダプター抽象レイヤー

### タスク 1.1: `IStorageProvider` インターフェースを作成する

- [x] `src/utils/storage-adapter.ts` に `IStorageProvider` インターフェースを定義する（`getItem` / `setItem` / `removeItem`）
- [x] 同期・非同期の両方をサポートする戻り値型を定義する

### タスク 1.2: `LocalStorageProvider` を実装する

- [x] `localStorage` を wrap するデフォルト実装クラスを作成する
- [x] `getStorageProvider()` と `setStorageProvider()` を公開する

### タスク 1.3: ストレージアダプターのテストを追加する

- [x] `src/utils/__tests__/storage-adapter.test.ts` に読み書き・削除のテストを追加する
- [x] カスタムプロバイダーへの差し替えテストを追加する

---

## P0: 基本タイマーストアの永続化（要件 2）

### タスク 2.1: `basic-timer-store` に `persist` ミドルウェアを追加する

- [x] `zustand/middleware` から `persist`, `createJSONStorage` を import する
- [x] `getStorageProvider` を import する
- [x] `create<BasicTimerStore>()( persist( ... ))` でストアをラップする
- [x] ストア名を `'basic-timer-store'` に設定する

### タスク 2.2: `partialize` で永続化対象を制御する

- [x] `duration`, `sessionLabel`, `history` のみを永続化対象とする
- [x] `isRunning`, `isPaused`, `remainingTime`, `sessionId`, `sessionStartTime`, `lastTickTime` を除外する

### タスク 2.3: `merge` 関数でリストア時の復元ロジックを実装する

- [x] ランタイム状態を `createDefaultInstance()` のデフォルト値で初期化する
- [x] `remainingTime` を保存された `duration` から復元する
- [x] `DEFAULT_DURATION` 定数を抽出して重複を排除する

---

## P0: ポモドーロストアの永続化（要件 3）

### タスク 3.1: `pomodoro-store` に `persist` ミドルウェアを追加する

- [x] `zustand/middleware` から `persist`, `createJSONStorage` を import する
- [x] `getStorageProvider` を import する
- [x] `create<PomodoroStore>()( persist( ... ))` でストアをラップする
- [x] ストア名を `'pomodoro-store'` に設定する

### タスク 3.2: `partialize` で永続化対象を制御する

- [x] `settings`, `todayStats`, `sessions` のみを永続化対象とする
- [x] `isRunning`, `isPaused`, `currentPhase`, `timeRemaining`, `cycle`, `totalCycles`, `taskName`, `lastTickTime` を除外する

### タスク 3.3: `merge` 関数でリストア時の復元ロジックを実装する

- [x] ランタイム状態を `createDefaultInstance()` のデフォルト値で初期化する
- [x] `timeRemaining` を復元された `settings.workDuration` から計算する

---

## P0: 複数タイマーストアの永続化（要件 4）

### タスク 4.1: `multi-timer-store` に `persist` ミドルウェアを追加する

- [x] `zustand/middleware` から `persist`, `createJSONStorage` を import する
- [x] `getStorageProvider` を import する
- [x] `create<MultiTimerStore>()( persist( ... ))` でストアをラップする
- [x] ストア名を `'multi-timer-store'` に設定する

### タスク 4.2: `partialize` で永続化対象を制御する

- [x] `timers`（実行状態リセット済み）, `categories`, `globalSettings`, `sessions` を永続化対象とする
- [x] `isAnyRunning` を除外する
- [x] 各タイマーの `isRunning` を `false` にリセットして保存する
- [x] 完了済みタイマー以外の `remainingTime` を `duration` にリセットして保存する

### タスク 4.3: `merge` 関数でリストア時の復元ロジックを実装する

- [x] ランタイム状態を `createDefaultInstance()` のデフォルト値で初期化する
- [x] `Date` オブジェクト（`createdAt`, `startedAt`, `completedAt`）を `new Date()` で再構築する
- [x] セッション履歴の `startTime`, `endTime` を `new Date()` で再構築する

---

## P0: アジェンダタイマーストアの永続化（要件 5）

### タスク 5.1: `agenda-timer-store` に `persist` ミドルウェアを追加する

- [x] `zustand/middleware` から `persist`, `createJSONStorage` を import する
- [x] `getStorageProvider` を import する
- [x] `create<AgendaTimerStore>()( persist( ... ))` でストアをラップする
- [x] ストア名を `'agenda-timer-store'` に設定する

### タスク 5.2: `partialize` で永続化対象を制御する

- [x] `meetings`, `currentMeeting` のみを永続化対象とする
- [x] `isRunning`, `currentTime`, `meetingStartTime`, `lastTickTime` を除外する

### タスク 5.3: `merge` 関数でリストア時の復元ロジックを実装する

- [x] ランタイム状態を `createDefaultInstance()` のデフォルト値で初期化する

---

## P1: 永続化テスト

### タスク 6.1: ストア永続化テストを追加する

- [x] `src/features/timer/stores/__tests__/store-persistence.test.ts` を作成する
- [x] 各ストアの `partialize` がランタイム状態を除外していることを検証する
- [x] マルチタイマーの `partialize` が `isRunning` を `false` にリセットしていることを検証する

---

## P1: ドキュメント

### タスク 7.1: 設計ドキュメントを作成する

- [x] `docs/DESIGN_DATA_PERSISTENCE.md` に調査結果・アーキテクチャ・移行パスを記載する

### タスク 7.2: 技術仕様を更新する

- [x] `docs/TECHNICAL_SPECS.md` の永続化セクションを更新する

---

## P1: 品質ゲート

### タスク 8.1: 品質ゲートを実行する

- [x] `npm run type-check` が通過すること
- [x] `npm run test:run` が全件通過すること（371 テスト）
- [x] `npm run build` が成功すること
