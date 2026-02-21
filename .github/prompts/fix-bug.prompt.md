# バグ修正プロンプト

バグを調査して修正します。

## バグの概要

<!-- 再現手順・期待値・実際の挙動を記述してください -->

## 調査順序

1. `src/utils/logger.ts` のログ出力でエラー発生時刻・操作を特定する
2. 関連するストアのアクションを確認する（`src/features/timer/stores/`）
3. View / Container の props フロー・イベントハンドラを確認する
4. 型エラーの可能性を確認: `npm run type-check`

## 修正の原則

- 最小差分で修正する（周辺コードのリファクタは別 PR）
- 修正後は `npm run type-check` と `npm run test:run` が通ることを確認する
- 副作用（通知・ログ）を UI から直接呼んでいる場合は合わせて修正する

## 参考

- インシデント対応: `.github/skills/incident-runbook-observability/SKILL.md`
- バグトリアージ: `.github/skills/timer-bug-triage/SKILL.md`
