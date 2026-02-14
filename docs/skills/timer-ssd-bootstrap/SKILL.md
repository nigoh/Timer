# timer-ssd-bootstrap

## 概要
このSkillは、Timerリポジトリ内で「要件整理 → 仕様分解 → 実装計画」までを短時間で揃えるための設計原本です。

## Trigger
- このリポジトリで要件整理・仕様分解・実装計画を行う時。
- 仕様変更の影響範囲を `docs/` と `src/features/timer/` の両方で確認したい時。
- 実装前にDoD（Definition of Done）を満たすためのチェックリストが必要な時。

## 使い方
1. `references/requirements-map.md` で、要求・技術仕様・実装箇所の対応を確認する。
2. `references/dod-checklist.md` を使って、着手前/実装後の抜け漏れを検査する。
3. `scripts/` のテンプレ生成スクリプトで、仕様テンプレートとタスクリスト雛形を作成する。

## 構成
- `references/requirements-map.md`: 要件↔仕様↔実装の対応表。
- `references/dod-checklist.md`: ドキュメント更新、テスト観点、影響範囲確認を含むDoD。
- `scripts/generate-spec-template.sh`: 仕様テンプレート生成。
- `scripts/generate-tasklist-template.sh`: タスクリスト雛形生成。

## 配布を意識した設計方針
- 最小構成（`SKILL.md` + `references/` + `scripts/`）を維持する。
- 既存ドキュメントを参照し、情報の重複コピーを避ける。
- 将来の `skill-installer` 配布時に、依存関係が分かる相対パスを使用する。
