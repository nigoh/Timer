---
name: timer-testing-strategy
description: Define practical test strategy for Timer App changes, including focused unit/integration checks and minimal regression coverage. Use when adding features, fixing bugs, or refactoring stores/components.
license: MIT
---

# Timer Testing Strategy Skill

## Goal

変更内容に応じて、過不足のないテスト計画を作成し、品質を最小コストで担保する。

## Test policy

- まず変更箇所に最も近いテストから実施する（局所→広域）。
- 既存テストがない機能には、必要最小限のテストを追加する。
- 無関係な失敗は修正対象に含めない（影響のみ報告）。

## Test levels

1. Unit: ストアの actions / reducers / utility 関数
2. Integration: container + view の主要イベント連携
3. Regression: 主要フロー（開始/停止/完了/保存）

## Procedure

1. 変更タイプを分類（バグ修正 / 挙動変更 / リファクタ）。
2. 影響ファイルを列挙し、失敗し得る操作を洗い出す。
3. まず対象ファイル近傍のテストを実行する。
4. 必要に応じて `npm run test` 全体を実行する。
5. 常に `npm run type-check` を通す。
6. 仕様変更がある場合は docs 更新有無を確認する。

## Timer App test focus

- tick 系ロジック（残時間、完了遷移、通知発火条件）
- pause/resume/reset の状態遷移
- persist 対象の保存/復元整合
- ErrorBoundary とログ記録の最低動作
- 音声認識: `useVoiceRecognition` の開始/停止/エラー状態遮移（Web Speech API は `vi.mock` でスタブ化）
- AI サービス: `meeting-ai-assist-service` のフォールバックパス（API 未設定時にルールベース出力を返すか）

## Output format

- 変更タイプ
- 実行したテスト範囲
- 追加/更新したテスト
- 未対応リスク

## Guardrails

- 実装変更なしでテストだけ通すためのモック過剰化をしない。
- flaky なテストを放置しない（原因メモを残す）。
