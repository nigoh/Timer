---
name: ux-flow-and-usability
description: Design and improve end-to-end UX flows, usability, and microcopy for this app. Use when asked to optimize user journeys, interaction clarity, error handling UX, and task completion rates.
license: MIT
---

# UX Flow and Usability Skill

## Goal

ユーザーが迷わず、少ない操作で目的達成できるUXフローを設計・改善する。

## Focus areas

- ユーザージャーニー設計（開始→実行→完了）
- 情報設計（何を先に見せるか）
- フォーム/操作の分かりやすさ
- エラー時の復帰しやすさ
- マイクロコピー（ラベル・ボタン・補助文）

## UX principles

1. Clarity first: 画面の第一印象で「何をすべきか」が分かること。
2. Progressive disclosure: 必要な情報だけ段階的に提示する。
3. Minimize cognitive load: 記憶負荷を減らし、選択肢を絞る。
4. Error prevention and recovery: 予防可能なエラーを防ぎ、失敗から戻りやすくする。
5. Feedback loop: 操作直後に状態変化を明示する。
6. Consistency: 文言、操作位置、状態表示を全画面で統一する。

## Procedure

1. 主要タスクを1つ選び、開始から完了までの操作ステップを書き出す。
2. 各ステップで「迷う点」「誤操作しやすい点」「待ち状態」を特定する。
3. 主要CTA、説明文、補助情報の順序を再設計する。
4. エラー・空状態・初回利用時の文言を具体化する。
5. キーボード操作とモバイル幅で完走できるか確認する。

## Microcopy guideline

- ボタンは動詞で統一（例: 開始、保存、削除）。
- エラー文は「原因 + 対処」を短く提示する。
- 空状態は次の行動を示す（例: 「タイマーを追加してください」）。
- 成功メッセージは簡潔にし、必要なら次の推奨行動を示す。

## Interaction checklist

- 主要CTAが常に視認できる位置にあるか。
- destructive操作に確認導線があるか。
- loading/disabled状態が視覚的に識別できるか。
- 戻る/やり直しの導線があるか。
- 完了時の達成感（通知・状態表示）があるか。

## Project adaptation

- UI実装は既存 `src/components/ui/*` を優先。
- レイアウト実装は `radix-ui-layout-design` Skill と併用可。
- 仕様更新を伴う場合は `timer-spec-sync` Skill を併用する。

## Output format

- 対象ユーザーフロー（現状/課題）
- 改善案（画面構造、操作導線、文言）
- 実装差分ファイル
- 検証結果（操作完走性、アクセシビリティ、モバイル）
