---
name: accessibility-audit-radix
description: Audit and improve accessibility in Radix UI based screens, including keyboard flow, labels, focus management, and semantic structure. Use when improving forms, dialogs, tabs, and interactive controls.
license: MIT
---

# Accessibility Audit for Radix Skill

## Goal

Radix UI を活用した画面で、キーボード操作・支援技術・可読性を満たす実装品質を維持する。

## Scope

- Dialog / Tabs / Select / Switch / Input / Button を含む画面
- フォーム入力、エラーメッセージ、状態表示
- 主要ユーザーフロー全体の操作完走性

## Audit checklist

1. すべての入力に Label が関連付いているか。
2. フォーカス順序が自然で、閉じたモーダルから適切に復帰するか。
3. キーボードのみで主要操作を完走できるか。
4. エラー文が入力欄付近に表示され、意味が明確か。
5. 色だけで状態を伝えていないか。
6. aria 属性や role が不必要に壊されていないか。

## Radix-specific guidance

- 既存 `src/components/ui/*` wrapper を優先使用する。
- primitive を直接使う場合、アクセシビリティ責務を明示する。
- Dialog はタイトルと説明を必ず用意する。
- Tabs はトリガー名が内容を具体的に表すようにする。

## Procedure

1. 対象画面の主要タスクを定義する。
2. マウスなし操作で開始から完了まで実行する。
3. 問題点を「致命/重大/軽微」で分類する。
4. 重大以上を優先して修正する。
5. 修正後、再監査して差分を記録する。

## Output format

- 監査対象画面
- 発見課題（優先度付き）
- 修正内容
- 残課題

## Guardrails

- 見た目優先でフォーカスやラベルを削除しない。
- コンポーネントの独自実装で既存Radix挙動を壊さない。
