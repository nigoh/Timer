---
name: timer-spec-sync
description: Keep docs and implementation aligned for Timer App. Use when behavior, requirements, or architecture changes and documentation must be updated in the same change.
license: MIT
---

# Timer Spec Sync Skill

## Goal

実装変更に対して、要件・仕様・AI運用ドキュメントの差分を同期する。

## Required docs

- `docs/REQUIREMENTS.md`
- `docs/FEATURES.md`
- `docs/TECHNICAL_SPECS.md`
- `docs/UX_DESIGN_SPEC.md`
- `docs/NON_FUNCTIONAL_VERIFICATION.md`
- `docs/AI_COLLABORATION_GUIDE.md`

## Procedure

1. 変更内容を「機能追加 / 挙動変更 / 内部改善」に分類する。
2. 仕様影響がある場合は REQUIREMENTS を先に更新する。
3. 技術変更は TECHNICAL_SPECS に反映する。
4. UX変更は UX_DESIGN_SPEC に反映する。
5. 検証観点が増えた場合は NON_FUNCTIONAL_VERIFICATION を更新する。
6. README の参照リンクが壊れていないか確認する。

## Output checklist

- 仕様影響の有無
- 更新した docs 一覧
- 未更新理由（ある場合）
- 検証コマンド結果

## Guardrails

- 仕様変更があるのに docs 更新なしで完了しない。
- 実装と矛盾する文言を残さない。
