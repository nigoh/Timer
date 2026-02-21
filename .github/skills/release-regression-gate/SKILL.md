---
name: release-regression-gate
description: Run release-ready regression gates for Timer App including type-check, tests, build, and critical flow validation. Use before merging high-impact changes.
license: MIT
---

# Release Regression Gate Skill

## Goal

マージ前に最低限の回帰チェックを標準化し、重大な不具合流入を防ぐ。

## Gate criteria

- `npm run type-check` が成功
- `npm run test` が成功
- `npm run build` が成功
- 主要フローの手動確認が完了

## Critical flows

1. 基本タイマー: 開始 → 一時停止 → 停止/リセット
2. ポモドーロ: フェーズ遷移と完了通知
3. アジェンダ: 議題進行、時間超過、次議題遷移
4. 複数タイマー: 個別操作 + 一括操作
5. 音声文字起こし: 録音開始 → 認識 → 議事録に挿入
6. AI アシスト: 会議レポート生成・提案表示（API 未設定時はルールベースフォールバックを確認）
7. ログ閲覧: エラー時の記録可視化

## Procedure

1. 変更内容から高リスク領域を特定する。
2. 上記 Gate criteria を順に実行する。
3. 高リスク領域の手動フローを最小1回確認する。
4. 失敗時は原因を切り分け、再実行する。
5. 結果を PR の検証手順へ記載する。

## Output format

- 実行コマンド結果
- 手動確認したフロー
- 既知の未解決事項
- マージ可否判断

## Guardrails

- type-check 未通過で完了扱いにしない。
- 失敗を無視して「後で直す」で進めない。
- 検証ログを残さずに PR を閉じない。
