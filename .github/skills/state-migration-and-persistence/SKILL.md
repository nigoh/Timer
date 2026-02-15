---
name: state-migration-and-persistence
description: Safely evolve Zustand persisted state schemas and storage behavior without breaking existing user data. Use when changing store shape, persisted fields, or storage migration logic.
license: MIT
---

# State Migration and Persistence Skill

## Goal

Zustand persist を使う store のスキーマ変更時に、既存ユーザーデータを壊さず移行する。

## Scope

- persisted store の state 形状変更
- `partialize` の対象変更
- 既存保存データの互換性対応

## Migration principles

1. Backward compatibility first: 旧データを読み込めることを優先する。
2. Minimal persistence: 必要なフィールドのみ保存する。
3. Safe defaults: 欠損値には安全な初期値を設定する。
4. Explicit versioning: 形式変更時はバージョン管理を検討する。

## Procedure

1. 変更前後の state 差分を列挙する。
2. 影響する persist store と `partialize` を特定する。
3. 旧データ読み込み時の欠損・型不一致ケースを洗い出す。
4. 必要なら migration ロジックを追加する。
5. 主要シナリオ（初回起動/更新後起動/データ破損）を確認する。
6. docs の技術仕様に保存仕様変更を反映する。

## Validation checklist

- 既存 localStorage データでクラッシュしない。
- 想定外値でも安全なデフォルトへフォールバックする。
- 保存対象を増やしすぎていない。

## Output format

- 変更した store
- 互換性リスク
- 移行方針
- 検証結果

## Guardrails

- データ破壊を伴う変更を無通知で入れない。
- persist 対象に一時UI状態を混在させない。
