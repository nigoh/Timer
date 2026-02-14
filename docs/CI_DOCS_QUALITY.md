# ドキュメントCI運用ルール

このリポジトリのドキュメント品質チェックは、`.github/workflows/docs-quality-gate.yml` を主ワークフローとして運用します。

## 実行トリガー

`Documentation Quality Gate` は以下で実行されます。

- `push`
  - 対象ブランチ: `main`, `develop`
  - 対象パス:
    - `docs/**`
    - `README.md`
    - `.markdownlint.json`
    - `.editorconfig`
    - `.vscode/**`
    - `.github/scripts/**`
    - `.github/markdown-link-check-config.json`
    - `.github/workflows/docs-quality-gate.yml`
- `pull_request`
  - 対象ブランチ: `main`, `develop`
  - 対象パス: `push` と同一
- `schedule`
  - `0 9 * * 1`（毎週月曜 9:00 UTC）
- `workflow_dispatch`

## 必須チェック（Quality Gate）

以下のチェックは **必須** で、いずれかが失敗するとワークフロー全体を失敗にします。

1. Markdown lint (`markdownlint-cli2`)
2. UTF-8 / 文字化けチェック（`.github/scripts/check-docs-encoding.cjs`）
3. 内部リンク整合性チェック（`.github/scripts/check-internal-links.cjs`）
4. 画像参照チェック（`.github/scripts/check-images.cjs`）
5. コードブロック検証（`.github/scripts/test-code-blocks.cjs`）
6. シェルコマンド検証（`.github/scripts/test-shell-commands.cjs`）

## 任意チェック（非ブロッキング）

- 外部リンクチェック（`markdown-link-check`）は `continue-on-error: true` で実行します。
- 外部サイトの一時的な不調によるCI不安定化を避けるため、失敗しても Quality Gate の合否には影響させません。

## 最小構成方針

重複実行を避けるため、ドキュメント品質チェック系ワークフローは `docs-quality-gate.yml` に統合します。
同等内容の重複ワークフローは持たず、チェック条件・対象ブランチ・対象パスをこのファイルに一元化します。
