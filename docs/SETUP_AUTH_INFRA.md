# インフラ・認証 セットアップ手順書

> **対象読者**: チームメンバー（新規参加者・環境再構築時を含む）
> **前提**: GitHub / Google / Supabase / Vercel の各アカウントを持っているか、このドキュメントの指示に従って作成すること

---

## 目次

1. [前提条件](#1-前提条件)
2. [Supabase プロジェクトの初期セットアップ](#2-supabase-プロジェクトの初期セットアップ)
3. [GitHub OAuth App の登録と Supabase への反映](#3-github-oauth-app-の登録と-supabase-への反映)
4. [Google OAuth クライアントの登録と Supabase への反映](#4-google-oauth-クライアントの登録と-supabase-への反映)
5. [ローカル開発の `.env.local` 設定](#5-ローカル開発の-envlocal-設定)
6. [Vercel デプロイと環境変数設定](#6-vercel-デプロイと環境変数設定)
7. [本番 URL 変更時の更新手順](#7-本番-url-変更時の更新手順)
8. [動作確認チェックリスト](#8-動作確認チェックリスト)

---

## 1. 前提条件

セットアップを開始する前に以下のアカウントを用意してください。

| サービス | URL                                | 用途                                  |
| -------- | ---------------------------------- | ------------------------------------- |
| GitHub   | <https://github.com>               | OAuth プロバイダー / ソースコード管理 |
| Google   | <https://console.cloud.google.com> | OAuth プロバイダー                    |
| Supabase | <https://app.supabase.com>         | 認証基盤・データベース                |
| Vercel   | <https://vercel.com>               | ホスティング                          |

**前提条件チェックリスト**

- [ ] GitHub アカウントを持っている
- [ ] Google アカウントを持っている
- [ ] Supabase アカウントを作成済み（または作成する）
- [ ] Vercel アカウントを作成済み（または作成する）
- [ ] リポジトリを GitHub に push 済み
- [ ] Node.js 20.x または 22.x がローカルにインストールされている

---

## 2. Supabase プロジェクトの初期セットアップ

### 2-1. プロジェクトの作成

- [ ] <https://app.supabase.com> にログイン
- [ ] 画面右上の **New project** をクリック
- [ ] 以下を入力して **Create new project** をクリック

  | 項目              | 推奨値                               |
  | ----------------- | ------------------------------------ |
  | Name              | `focuso`（任意）                     |
  | Database Password | 強力なランダムパスワードを生成・保存 |
  | Region            | `Northeast Asia (Tokyo)` を推奨      |

- [ ] プロジェクトのプロビジョニングが完了するまで待機（1〜2 分）

> ⚠️ **Database Password は後から確認できません。** パスワードマネージャーに保存してください。

---

### 2-2. Project URL と anon key の確認

- [ ] 左メニュー → **Project Settings** → **API** を開く
- [ ] **Project URL** をコピーしてメモ
  - 例: `https://abcdefghijklmn.supabase.co`
- [ ] **Project API keys** セクションの `anon` `public` キーをコピーしてメモ

> ℹ️ この 2 つの値は後ほど `.env.local` および Vercel の環境変数として設定します。

---

### 2-3. Callback URL の確認

後工程（GitHub / Google の設定）で必要になる Callback URL を確認します。

- [ ] 左メニュー → **Authentication** → **Providers** を開く
- [ ] **GitHub** または **Google** を選択すると、以下の URL が表示される

  ```
  Callback URL (for OAuth):
  https://<your-project-ref>.supabase.co/auth/v1/callback
  ```

- [ ] この URL をコピーしてメモ（次のセクションで使用）

---

### 2-4. Redirect URL の設定（本番・ローカル両対応）

- [ ] 左メニュー → **Authentication** → **URL Configuration** を開く
- [ ] **Site URL** に本番 URL を入力

  ```
  https://<your-app>.vercel.app
  ```

- [ ] **Redirect URLs** に以下を **追加**（改行区切り）

  ```
  http://localhost:3000
  https://<your-app>.vercel.app
  ```

- [ ] **Save** をクリック

> ⚠️ Site URL と Redirect URLs が正しく設定されていないと、ログイン後のリダイレクトに失敗します。

---

## 3. GitHub OAuth App の登録と Supabase への反映

### 3-1. GitHub OAuth App の作成

- [ ] GitHub にログイン
- [ ] 右上のアバター → **Settings** をクリック
- [ ] 左メニュー最下部 → **Developer settings** をクリック
- [ ] **OAuth Apps** → **New OAuth App** をクリック
- [ ] 以下を入力して **Register application** をクリック

  | 項目                       | 値                                                                          |
  | -------------------------- | --------------------------------------------------------------------------- |
  | Application name           | `Focuso`（任意）                                                            |
  | Homepage URL               | `https://<your-app>.vercel.app`（ローカルのみなら `http://localhost:3000`） |
  | Authorization callback URL | Supabase の Callback URL（手順 2-3 でメモしたもの）                         |

- [ ] 登録後、**Client ID** をコピーしてメモ
- [ ] **Generate a new client secret** をクリック
- [ ] 表示された **Client Secret** を即座にコピーしてメモ

> ⚠️ **Client Secret はこの画面でしか全文表示されません。** 必ずコピーしてパスワードマネージャーに保存してください。

---

### 3-2. Supabase への GitHub プロバイダー設定

- [ ] Supabase ダッシュボード → **Authentication** → **Providers** → **GitHub** を開く
- [ ] **Enable GitHub provider** をオンにする
- [ ] Client ID に GitHub でコピーした値を貼り付け
- [ ] Client Secret に GitHub でコピーした値を貼り付け
- [ ] **Save** をクリック

**確認チェック**

- [ ] GitHub プロバイダーが **Enabled** 状態になっている
- [ ] Client ID・Secret のフィールドに値が入っている（Secret はマスク表示でOK）

---

## 4. Google OAuth クライアントの登録と Supabase への反映

### 4-1. Google Cloud プロジェクトの作成

- [ ] <https://console.cloud.google.com> にログイン
- [ ] 上部のプロジェクト選択ドロップダウン → **新しいプロジェクト** をクリック
- [ ] 任意のプロジェクト名（例: `Focuso`）を入力して **作成**

---

### 4-2. OAuth 同意画面の設定

- [ ] 左メニュー → **APIとサービス** → **OAuth 同意画面** を開く
- [ ] **User Type: 外部** を選択して **作成** をクリック
- [ ] 以下を入力して **保存して次へ** をクリック

  | 項目                       | 値                   |
  | -------------------------- | -------------------- |
  | アプリ名                   | `Focuso`             |
  | ユーザーサポートメール     | 自分のメールアドレス |
  | デベロッパーの連絡先メール | 自分のメールアドレス |

- [ ] **スコープ** のページはそのまま **保存して次へ**
- [ ] **テストユーザー** のページはそのまま **保存して次へ**
- [ ] **概要** を確認して **ダッシュボードに戻る**

> ℹ️ ユーザー数が 100 人を超える / 本番公開する場合は Google によるアプリ審査が必要です。開発・テスト中はテストユーザーを登録しておくと便利です。

---

### 4-3. OAuth クライアント ID の作成

- [ ] 左メニュー → **APIとサービス** → **認証情報** を開く
- [ ] **認証情報を作成** → **OAuth クライアント ID** をクリック
- [ ] 以下を入力して **作成** をクリック

  | 項目                         | 値                                                                    |
  | ---------------------------- | --------------------------------------------------------------------- |
  | アプリケーションの種類       | **ウェブアプリケーション**                                            |
  | 名前                         | `Focuso Web`（任意）                                                  |
  | 承認済みの JavaScript 生成元 | `https://<your-app>.vercel.app`（ローカルは `http://localhost:3000`） |
  | 承認済みのリダイレクト URI   | Supabase の Callback URL（手順 2-3 でメモしたもの）                   |

- [ ] 表示された **クライアント ID** をコピーしてメモ
- [ ] 表示された **クライアントシークレット** をコピーしてメモ

> ⚠️ ダイアログを閉じた後も認証情報ページから再確認できますが、シークレットは再生成になります。必ずコピーしてパスワードマネージャーに保存してください。

---

### 4-4. Supabase への Google プロバイダー設定

- [ ] Supabase ダッシュボード → **Authentication** → **Providers** → **Google** を開く
- [ ] **Enable Google provider** をオンにする
- [ ] Client ID に Google でコピーした値を貼り付け
- [ ] Client Secret に Google でコピーした値を貼り付け
- [ ] **Save** をクリック

**確認チェック**

- [ ] Google プロバイダーが **Enabled** 状態になっている
- [ ] Client ID・Secret のフィールドに値が入っている

---

## 5. ローカル開発の `.env.local` 設定

### 5-1. ファイルの作成

プロジェクトルート（`package.json` と同じ階層）に `.env.local` ファイルを作成します。

```bash
# プロジェクトルートで実行
cp .env.example .env.local   # .env.example がある場合
# または新規作成
```

`.env.local` の内容:

```dotenv
# Supabase
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（anon key 全文）
```

> ℹ️ `VITE_` プレフィックスが付いている変数のみブラウザ側に公開されます。シークレットな値（service_role key など）は `VITE_` を付けないでください。

---

### 5-2. .gitignore の確認

- [ ] プロジェクトルートの `.gitignore` に `.env.local` が含まれていることを確認

  ```gitignore
  .env.local
  .env*.local
  ```

- [ ] `git status` で `.env.local` が **untracked / ignored** になっていることを確認

> ⚠️ `.env.local` をリポジトリにコミットしないでください。API キーの漏洩につながります。

---

### 5-3. 開発サーバーの起動確認

- [ ] 以下のコマンドで開発サーバーを起動

  ```bash
  npm run dev
  ```

- [ ] ブラウザで `http://localhost:3000` を開く
- [ ] ログインボタン（GitHub / Google）が表示される
- [ ] ログインフローが正常に動作する

---

## 6. Vercel デプロイと環境変数設定

### 6-1. Vercel プロジェクトの作成

- [ ] <https://vercel.com> にログイン
- [ ] **Add New** → **Project** をクリック
- [ ] **Import Git Repository** で本リポジトリを選択
- [ ] **Framework Preset** が `Vite` になっていることを確認
- [ ] **Build Command**: `npm run build`（デフォルトで OK）
- [ ] **Output Directory**: `dist`（デフォルトで OK）
- [ ] **Deploy** をクリック（初回は環境変数なしでも OK）

---

### 6-2. 環境変数の登録

デプロイ後、環境変数を設定します。

- [ ] Vercel プロジェクトページ → **Settings** → **Environment Variables** を開く
- [ ] 以下の変数を **Production** / **Preview** / **Development** の全環境に追加

  | 変数名                   | 値                      | Environments        |
  | ------------------------ | ----------------------- | ------------------- |
  | `VITE_SUPABASE_URL`      | Supabase の Project URL | Production, Preview |
  | `VITE_SUPABASE_ANON_KEY` | Supabase の anon key    | Production, Preview |

- [ ] 各変数を入力後 **Save** をクリック
- [ ] **Deployments** タブ → 最新のデプロイを **Redeploy** して環境変数を反映

> ⚠️ 環境変数を追加しただけでは既存のデプロイには反映されません。必ず **Redeploy** を実行してください。

---

### 6-3. 本番 URL の確認

- [ ] Vercel プロジェクトページ → **Domains** タブで本番 URL を確認
  - デフォルト: `https://<your-app>.vercel.app`
- [ ] この URL を手順 2-4 の **Site URL** / **Redirect URLs** に登録済みであることを確認

---

## 7. 本番 URL 変更時の更新手順

カスタムドメインを設定した場合や、Vercel プロジェクトの URL が変更された場合は以下を更新します。

### チェックリスト

#### Supabase

- [ ] **Authentication** → **URL Configuration** → **Site URL** を新しい URL に更新
- [ ] **Authentication** → **URL Configuration** → **Redirect URLs** に新しい URL を追加（古い URL は残してもよい）

#### GitHub OAuth App

- [ ] <https://github.com/settings/developers> → 対象の OAuth App を選択
- [ ] **Homepage URL** を新しい URL に更新
- [ ] **Authorization callback URL** は Supabase の Callback URL のままなので **変更不要**

> ℹ️ Supabase の Callback URL（`https://<your-project-ref>.supabase.co/auth/v1/callback`）は Vercel の URL に依存しないため、変更不要です。

#### Google OAuth クライアント

- [ ] Google Cloud Console → **APIとサービス** → **認証情報** → 対象のクライアントを選択
- [ ] **承認済みの JavaScript 生成元** に新しいドメインを追加
- [ ] **承認済みのリダイレクト URI** は Supabase の Callback URL のままなので **変更不要**

#### Vercel

- [ ] 環境変数の値は URL 依存がないため **変更不要**

---

## 8. 動作確認チェックリスト

セットアップ完了後、以下の動作確認を行ってください。

### ローカル環境

- [ ] `http://localhost:3000` にアクセスできる
- [ ] **GitHub でログイン** をクリックすると GitHub の認証画面にリダイレクトされる
- [ ] GitHub 認証後、アプリに戻ってログイン状態になる
- [ ] **Google でログイン** をクリックすると Google の認証画面にリダイレクトされる
- [ ] Google 認証後、アプリに戻ってログイン状態になる
- [ ] **ログアウト** が正常に動作する
- [ ] ページリロード後もログイン状態が維持される

### 本番環境（Vercel）

- [ ] `https://<your-app>.vercel.app` にアクセスできる
- [ ] GitHub / Google ログインが正常に動作する
- [ ] ログアウトが正常に動作する

### よくあるエラーと対処法

| エラーメッセージ                                | 原因                          | 対処法                                                                          |
| ----------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------- |
| `Unsupported provider: provider is not enabled` | Supabase でプロバイダーが無効 | 手順 3-2 / 4-4 を確認して Enable する                                           |
| `redirect_uri_mismatch`                         | Callback URL が一致しない     | GitHub / Google に設定した Callback URL と Supabase の URL が一致しているか確認 |
| `Invalid login credentials`                     | Session が無効                | ブラウザのキャッシュ・Cookie をクリアして再試行                                 |
| ログイン後に `/` に戻らない                     | Redirect URL 未設定           | 手順 2-4 の Redirect URLs を確認                                                |
| ローカルでのみ動作しない                        | `.env.local` の設定ミス       | 手順 5-1 の変数名・値を確認し、開発サーバーを再起動                             |

---

## 付録: 管理情報の一覧表（コピーして記録用に使用）

> ⚠️ この表に実際の値を入力してリポジトリにコミットしないこと。パスワードマネージャーや社内セキュアメモに保管すること。

| 項目                       | 値                                       | 保管場所 |
| -------------------------- | ---------------------------------------- | -------- |
| Supabase Project URL       | `https://<your-project-ref>.supabase.co` |          |
| Supabase anon key          | `eyJ...`                                 |          |
| Supabase Database Password | —                                        |          |
| GitHub OAuth Client ID     | —                                        |          |
| GitHub OAuth Client Secret | —                                        |          |
| Google OAuth Client ID     | —                                        |          |
| Google OAuth Client Secret | —                                        |          |
| Vercel 本番 URL            | `https://<your-app>.vercel.app`          |          |

---

*最終更新: 2026-03-08*
