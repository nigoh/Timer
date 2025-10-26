# Spec Kit 導入ガイド

Spec-Driven Development をこのリポジトリで活用するための手順です。ローカル実行とGitHub Actions連携の両方に対応しています。

## 1. 前提条件
- Windows/macOS/Linux
- Python 3.11+
- Git
- 依存管理: [uv](https://docs.astral.sh/uv/)

## 2. CLIインストール（推奨: 永続インストール）

PowerShell (Windows):

```powershell
# uv インストール
irm https://astral.sh/uv/install.ps1 | iex

# specify-cli インストール（Spec Kit）
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# 動作確認
specify check
```

macOS/Linux:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify check
```

## 3. このリポジトリに初期化（上書きを避けるためオプションを付与）

既存プロジェクトに最小限の形で有効化する場合:

```powershell
# カレントディレクトリに初期化（確認プロンプトあり）
specify init --here --ai copilot --script ps --ignore-agent-tools --no-git
```

> 注意: `specify init` はテンプレートファイルを追加・マージします。変更をコミットする前に差分をご確認ください。

## 4. GitHub Actions 連携（自動チェック）

このリポジトリには `/.github/workflows/spec-kit-check.yml` を追加済みです。PR作成時に以下を実行します:
- Python/uvのセットアップ
- `specify-cli` のインストール
- `specify check` による環境検証

## 5. VS Code × Copilot での利用（スラッシュコマンド）

`specify init` 後、以下のスラッシュコマンドがAIアシスタントで利用できます:
- `/speckit.constitution` プロジェクト原則の作成/更新
- `/speckit.specify` 要件・ユーザーストーリーの定義
- `/speckit.plan` 技術実装プランの作成
- `/speckit.tasks` 実行可能なタスク分解
- `/speckit.implement` タスク実行による実装

オプションコマンド:
- `/speckit.clarify` 曖昧箇所の明確化
- `/speckit.analyze` 成果物の一貫性/カバレッジ分析
- `/speckit.checklist` 品質チェックリスト生成

## 6. 環境変数（任意）

- `SPECIFY_FEATURE`: Gitブランチを使わず特定の機能ディレクトリを指定したい場合に設定

## 7. 運用のコツ
- 初回導入時は `specify init --here --force` は避け、差分を確認
- PRに `spec-kit-check` を必須チェックとして設定（ブロック条件）
- 仕様書や設計資料は `docs/` 配下に置き、Spec Kit の出力を取り込む

## 8. トラブルシューティング
- `specify` が見つからない: `uv tool install` 後にシェルを再起動、PATHを確認
- 企業ネットワーク: `--github-token` でトークンを渡すと安定
- Windows: `--script ps` を付けるとPowerShellスクリプトが生成されます

## 9. 参考リンク
- リポジトリ: https://github.com/github/spec-kit
- ドキュメント: https://github.github.io/spec-kit/

---

### 付録: /speckit.constitution にファイルを使うには？

`/speckit.constitution` は基本的に「チャットに貼った本文」を入力として扱いますが、VS Code では次のやり方が便利です。

- エディタでファイル（例: `docs/PROJECT_CONSTITUTION.md`）を開き、全選択してチャットに貼る
- もしくは選択範囲を作って「Add Selection to Chat」でチャットに添付してから `/speckit.constitution` を実行
- ファイルパスを明示して「このファイルの内容を憲法として適用」と指示（エージェントがワークスペースの内容を参照可能な場合）

本リポジトリでは、憲法の雛形として `docs/PROJECT_CONSTITUTION.md` を用意しています。必要に応じて編集し、上記の方法で `/speckit.constitution` に入力してください。
