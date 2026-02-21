---
name: timer-bug-triage
description: Analyze runtime errors in Timer App with logs and source context, then propose root-cause fixes and recurrence prevention. Use when asked to investigate app errors, console errors, or failing timer flows.
license: MIT
---

# Timer App Bug Triage Skill

## Goal

ランタイムエラーや不具合報告を、最小手順で再現・切り分けし、根本原因ベースで修正する。

## Scope

- React コンポーネントのクラッシュ
- Store 更新時の不整合
- タイマー tick 系処理の不具合
- 通知/ログ周辺の副作用エラー
- AI API 連携・音声認識サービスのエラー（`services/`）
- `useVoiceRecognition` などフックの不具合（`hooks/`）

## Required project context

1. `src/features/timer/components`
2. `src/features/timer/containers`
3. `src/features/timer/stores`
4. `src/features/timer/services` （`meeting-ai-assist-service.ts`, `voice-recognition-service.ts`, `analytics.ts`）
5. `src/features/timer/hooks` （`useVoiceRecognition.ts`）
6. `src/utils/logger.ts`
7. `src/utils/notification-manager.ts`

## Procedure

1. エラー再現条件を特定する（操作順、対象タブ、入力値）。
2. `LogViewer` と `logger` の ERROR/WARN を優先確認する。
3. 例外箇所の import / state 依存 / null 条件を確認する。
4. store 側の State / Actions API と呼び出し側の整合を確認する。
5. パッチは最小差分で実装し、根本原因を除去する。
6. `npm run type-check` を実行し、関連テストがあれば実行する。

## Output format

- 原因候補
- 確認手順
- 推奨修正
- 再発防止策

## Guardrails

- 対症療法だけで終わらせない（根本原因を優先）。
- UIから直接副作用を追加しない（通知/ログは既存 utility 経由）。
- 同責務の新規 store を作らない。
