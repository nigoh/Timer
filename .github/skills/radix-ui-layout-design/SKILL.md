---
name: radix-ui-layout-design
description: Design and implement UI layouts for this project using Radix UI primitives/themes and existing shadcn wrappers, with accessibility-first structure and consistent spacing. Use when asked to create or refine UI design, layout, or component composition.
license: MIT
---

# Radix UI Layout Design Skill

## Goal

Radix UI 準拠で、保守しやすくアクセシブルな UI レイアウトを実装する。

## Design principles (Radix aligned)

- Accessibility first: フォーカス管理、キーボード操作、適切な role/label を優先。
- Composition over custom hacks: 既存 primitive と `src/components/ui/*` を優先利用。
- Consistency: 余白・階層・タイポの一貫性を保つ。
- Predictability: ユーザー操作に対する状態変化を明確にする。

## Project-specific component policy

1. まず `src/components/ui` の既存コンポーネントを再利用する。
2. 追加が必要な場合のみ Radix primitive を直接利用する。
3. レイアウト責務は container、表示責務は `*View.tsx` に分離する。
4. 状態は store 由来、UIローカル状態のみ component に置く。

## Layout recipe

1. 画面を Header / Main / Secondary の3領域で設計する。
2. 主要CTA（開始/停止/保存）は視線導線の先頭に配置する。
3. 補助情報は Card / Tabs / Dialog へ段階的に分離する。
4. モバイル幅では1カラム優先、操作ボタンを先頭へ寄せる。
5. 破壊的操作は Dialog で確認し、説明文を明記する。

## Accessibility checklist

- すべてのフォーム入力に Label を接続する。
- Dialog, Tabs, Select, Switch は Radix 標準パターンで構成する。
- キーボードのみで主要フローを完走可能にする。
- 色だけに依存せず、テキストとアイコンで状態を補足する。

## Styling constraints

- テーマ・トークンは既存 Tailwind + Radix 方針に従う。
- 新規の独自デザインルールを乱立させない。
- 影・色・フォントは既存設計から逸脱しない。

## Deliverable format

- 画面構造（どの領域に何を置くか）
- 使用コンポーネント一覧（ui wrapper / Radix primitive）
- アクセシビリティ観点の確認結果
- 実装差分ファイル
