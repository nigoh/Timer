# AGENTS.md（UI層ルール）

## スコープ
- このファイルのスコープは `src/components/` 配下です。

## 追加ルール（UI層）
- UIコンポーネントは**表示責務を優先**し、状態管理ロジックを過度に持たせないこと。
- 既存UIスタイル・命名・設計方針は `.github/copilot-instructions.md` と整合させること。
- 仕様/見た目に影響する変更時は、必要に応じて `docs/UX_DESIGN_SPEC.md` の更新対象を確認すること。
