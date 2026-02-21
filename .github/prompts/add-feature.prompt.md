# 新機能追加プロンプト

新しいタイマー機能を追加します。

## 追加する機能の概要

<!-- ここに機能の説明を記述してください -->

## 実装チェックリスト

以下の順序で実装してください:

1. **型定義**: `src/types/` に必要な型を追加する（既存型で代替できないか確認）
2. **ストア**: `src/features/timer/stores/` に State/Actions interface を定義したストアを作成する
3. **View コンポーネント**: `src/features/timer/components/{feature}/` にビューを作成する
4. **コンテナ**: `src/features/timer/containers/` に配線専用のコンテナを作成する
5. **通知/ログ**: 「開始/完了/失敗」の3点にログポイントを追加する（`logger.ts` 経由）
6. **テスト**: ストアとコンポーネントの基本動作テストを追加する
7. **ドキュメント**: `docs/FEATURES.md` と `docs/REQUIREMENTS.md` を更新する

## 参考ファイル

- アーキテクチャ: [copilot-instructions.md](../../.github/copilot-instructions.md)
- 既存ストア例: `src/features/timer/stores/`
- 既存コンテナ例: `src/features/timer/containers/`
