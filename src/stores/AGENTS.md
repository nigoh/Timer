# AGENTS.md（state層ルール）

## スコープ
- このファイルのスコープは `src/stores/` 配下です。

## 追加ルール（state層）
- 状態管理は `.github/copilot-instructions.md` の Zustand 方針に従うこと。
- state（データ）と actions（操作）は分離して定義すること。
- 永続化やマイグレーションが絡む変更時は、影響範囲とロールバック方針をPR本文へ明記すること。
