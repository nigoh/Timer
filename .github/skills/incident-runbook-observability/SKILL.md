---
name: incident-runbook-observability
description: Triage production incidents with a practical runbook using app logs, reproducible checks, and rollback-safe fixes. Use when errors spike, core flows break, or release health degrades.
license: MIT
---

# Incident Runbook and Observability Skill

## Goal

障害発生時に、原因特定・暫定対処・恒久修正を短時間で進められる標準手順を提供する。

## Trigger conditions

- 主要フロー（開始/停止/完了）が動作しない
- エラーログが継続的に増加する
- 直近変更後にビルド/実行が不安定になる

## Severity model

1. SEV-1: 主要機能が利用不能（即時対応）
2. SEV-2: 一部機能が劣化（当日対応）
3. SEV-3: 回避策ありの軽微不具合（計画修正）

## Runbook

1. 事象の固定化
   - 発生時刻、環境、再現手順、対象タブを記録する。
2. 証拠収集
   - `LogViewer` と `src/utils/logger.ts` の ERROR/WARN を収集する。
   - 関連store と component の直近変更を確認する。
3. 切り分け
   - import欠落 / null参照 / state不整合 / 副作用重複を優先確認する。
4. 暫定対処
   - ユーザー影響を最小化する修正を最小差分で適用する。
5. 恒久修正
   - 根本原因を除去し、再発防止（テスト・ガード）を追加する。
6. 検証
   - `npm run type-check`、必要に応じて `npm run test` / `npm run build` を実行する。
7. 事後記録
   - 原因、対応、再発防止、未解決事項を記録する。

## Observability checklist

- エラー時に `logger.error` が必要情報を保持しているか。
- 重要操作（開始/完了/失敗）にログポイントがあるか。
- 通知失敗時にアプリ全体が停止しないか。
- 同一エラーが高頻度ループで発火していないか。

## Postmortem template

- 事象概要
- ユーザー影響
- 根本原因
- 暫定対処
- 恒久修正
- 再発防止策
- 残課題

## Guardrails

- ログがないまま憶測で修正しない。
- 影響範囲の広い変更を障害対応で一度に入れない。
- 暫定対処だけで完了にしない。
