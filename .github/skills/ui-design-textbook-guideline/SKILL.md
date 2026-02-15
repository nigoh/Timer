---
name: ui-design-textbook-guideline
description: Apply textbook UI design principles for app screens, then adapt them to this repository using Radix UI and existing shadcn wrappers. Use when asked to design new screens or improve layout quality.
license: MIT
---

# UI Design Textbook Guideline Skill

## Goal

教科書的なUIデザイン原則を、実装可能な形で画面設計に落とし込む。

## Core principles (textbook)

1. Hierarchy（情報階層）: 重要情報をサイズ・位置・余白で優先表示する。
2. Consistency（一貫性）: 同じ意味の要素は同じ見た目・同じ操作にする。
3. Proximity（近接）: 関連情報は近づけ、無関係情報は離す。
4. Alignment（整列）: 視線移動を減らすため、縦横の基準線を揃える。
5. Contrast（対比）: 重要な要素は視覚差で明確化する。
6. Feedback（フィードバック）: 操作結果を即時に通知する。
7. Affordance（操作可能性）: クリック/入力可能な要素を見た目で示す。
8. Accessibility（アクセシビリティ）: キーボード操作・読み上げ・十分な可読性を確保する。

## Layout system

- まず「Header / Main / Secondary」の3領域で情報構造を決める。
- 主要タスクは Main の上位に配置し、補助機能は Secondary に寄せる。
- 余白は一定スケール（例: 4/8/12/16/24）で統一し、場当たり値を避ける。
- モバイルでは1カラム優先、PCで2カラム以上へ展開する。

## Typography and content

- 1画面で使う文字サイズの段階数を絞る（見出し・本文・補足）。
- 1コンポーネント1メッセージを原則にし、長文を詰め込み過ぎない。
- ラベルは名詞、ボタンは動詞で命名する（例: 保存、開始、削除）。

## Color and state

- 色は「意味」に紐づける（成功/警告/エラー/情報）
- 色だけで状態を伝えず、テキストやアイコンでも補足する。
- hover / focus / active / disabled の状態差を必ず設計する。

## Interaction pattern

1. 主要CTAを1つ明確にする。
2. 破壊的操作は確認ダイアログを挟む。
3. 入力エラーはフィールド近傍に表示する。
4. 非同期処理はローディング状態を表示する。

## Radix UI adaptation for this repo

- 既存の `src/components/ui/*`（shadcn wrappers）を最優先で利用する。
- 追加が必要な場合のみ Radix primitives を直接採用する。
- Dialog/Tabs/Select/Switch は Radix 標準のアクセシブルパターンを守る。
- コンテナは配線、View は表示責務に限定する。

## Design review checklist

- 情報の優先順位が視覚で伝わるか。
- 同種操作のUIが画面間で統一されているか。
- キーボードのみで主要操作を完了できるか。
- 320px幅でも主要操作が隠れないか。
- 破壊的操作に確認導線があるか。

## Output format

- 画面構造（領域分割）
- コンポーネント選定（ui wrapper / Radix primitive）
- 適用したデザイン原則（どの原則をどう適用したか）
- 検証結果（アクセシビリティ・レスポンシブ）
