# 設計書: GitHub 連携機能（Issue #36）

> **ステータス**: 設計中  
> **対象Issue**: [#36 githubやgitlabなど、プロジェクト管理ツールとの連携ができるようにしたい。](https://github.com/nigoh/Timer/issues/36)  
> **関連ドキュメント**: [REQUIREMENTS.md](./REQUIREMENTS.md) / [TECHNICAL_SPECS.md](./TECHNICAL_SPECS.md)

---

## 1. 概要・目標

タイマーアプリで記録した作業ログ（TimeLog）を、**GitHub Issues** と紐付け可能にする。GitLab 対応は将来フェーズとして設計上の拡張余地を残す。

**主な目標**

- タスク（Issue）ごとの実績時間を可視化する。
- 外部ツールへの手動転記を不要にする（ローカル連携の記録を残す）。
- ランタイムコード変更は将来フェーズとし、本ドキュメントでは設計を確定する。

**スコープ外（本フェーズ）**

- GitLab 対応（将来フェーズ）
- 外部ツールへの自動コメント投稿・Issue ステータス更新
- OAuth フロー（PAT による手動認証を先行する）
- PAT の永続保存（メモリ保持のみ）

---

## 2. アーキテクチャ概要

```mermaid
flowchart TD
    subgraph UI["UIレイヤー (React)"]
        TLD["TimeLog Detail Screen"]
        TLS["Task Linking Section"]
    end

    subgraph Store["状態管理 (Zustand)"]
        ILS["integrationLinkStore\n(リンク CRUD・フェッチ状態)"]
        TLS2["timerLogStore\n(既存: ログ保存)"]
    end

    subgraph Persist["永続化"]
        LS["LocalStorage\n(integrationLinks)"]
    end

    subgraph External["外部 API"]
        GH["GitHub REST API\nhttps://api.github.com\n/repos/:owner/:repo/issues/:number"]
    end

    TLD --> TLS
    TLS --> ILS
    ILS --> LS
    ILS -->|"Issue タイトル取得 (Phase 2)"| GH
    TLS2 --> TLD
    PAT["PAT (メモリのみ・非永続)"] -->|"Authorization ヘッダー"| GH
```

---

## 3. UI ワイヤーフレーム

### 3.1 TimeLog 詳細画面 — タスク連携セクション

```mermaid
flowchart LR
    A["TimeLog 詳細\n---\n開始: 09:00\n終了: 09:45\n作業時間: 45 min"] --> B["タスク連携\n---\n[+ GitHub Issue を紐付ける]"]
    B --> C{"連携済みタスク一覧\n---\n[GitHub] nigoh/Timer #36 ×"}
```

**ASCII モックアップ（Phase 2: PAT 入力 UI を含む）**

```
┌─────────────────────────────────────────────────────┐
│  ⏱  TimeLog 詳細                                    │
│─────────────────────────────────────────────────────│
│  開始   2026-02-19 09:00                            │
│  終了   2026-02-19 09:45                            │
│  時間   45 分                                        │
│  メモ   設計書作成                                   │
│─────────────────────────────────────────────────────│
│  🔗 GitHub Issue 連携                                │
│                                                     │
│  GitHub PAT (任意・Private リポジトリ用):            │
│  [••••••••••••••••]  ← メモリのみ保持、保存しない    │
│                                                     │
│  [GitHub] nigoh/Timer #36  ✕                        │
│                                                     │
│  [ + GitHub Issue を紐付ける ]                       │
│    Owner/Repo: [__________]  Issue #: [______]      │
│    [ 紐付け ]                                        │
└─────────────────────────────────────────────────────┘
```

### 3.2 タスク紐付けフォームの UX フロー

1. 「+ GitHub Issue を紐付ける」ボタンを押すとインライン入力欄が展開される。
2. Owner/Repo・Issue 番号を入力し「紐付け」を押す。
3. `integrationLinkStore.addLink(timeLogId, link)` が呼ばれ LocalStorage に保存。
4. 連携済みリストにカードが追加される。
5. `×` ボタンで個別リンクを削除できる。

---

## 4. データモデル

```typescript
// src/types/integrationLink.ts

/** 外部タスクへのリンク情報 */
export interface IntegrationLink {
  /** ローカル一意 ID (crypto.randomUUID) */
  id: string;
  /** リポジトリ所有者 */
  owner: string;
  /** リポジトリ名 */
  repo: string;
  /** Issue 番号 */
  issueNumber: number;
  /** Issue タイトル (任意キャッシュ: Phase 2 で API から自動取得) */
  issueTitle?: string;
  /** GitHub Issue URL */
  issueUrl: string;
  /** 作成日時 */
  createdAt: string; // ISO 8601
}

/** TimeLog に付加される連携情報 */
export interface TimeLogWithLinks {
  timeLogId: string;
  links: IntegrationLink[];
}
```

> **注意**: `TimeLog` 自体の型は既存の `src/types/` を流用し、`IntegrationLink` を別テーブル（LocalStorage キー: `integration-links`）として管理する。`timeLogId` で JOIN する。

---

## 5. API 連携仕様

### 5.1 方針

GitHub REST API（`https://api.github.com`）をブラウザから直接呼び出す。  
GitHub API は CORS を許可しているため、フロントエンドから直接 `fetch` で呼び出せる。プロキシは不要。

| フェーズ | API 呼び出し | 内容 |
|---------|------------|------|
| **Phase 1** | なし | Owner/Repo・Issue 番号・タイトルを手入力。URL は `https://github.com/{owner}/{repo}/issues/{number}` で自動生成する |
| **Phase 2** | あり | Issue 番号入力後に API でタイトルを自動取得する |

### 5.2 使用エンドポイント（Phase 2）

```
GET https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}
```

**レスポンス（利用フィールドのみ）**

```json
{
  "number": 36,
  "title": "githubやgitlabなど、プロジェクト管理ツールとの連携ができるようにしたい。",
  "html_url": "https://github.com/nigoh/Timer/issues/36",
  "state": "open"
}
```

### 5.3 認証とセキュリティ

#### ケース別認証方式

| ケース | 方法 | 備考 |
|--------|------|------|
| **Public リポジトリ** | 認証なし | レート制限: 60 req/h |
| **Private リポジトリ** | `Authorization: Bearer {PAT}` ヘッダー | レート制限: 5000 req/h |

#### アプリ内 PAT 入力（採用方針）

**アプリ内でユーザーが PAT を入力し、メモリのみに保持する方式は一般的な SPA の実装パターンであり、適切に実装すれば受け入れ可能なセキュリティレベルを確保できる。**

採用する条件と制約:

| 項目 | 方針 |
|------|------|
| 保管場所 | **メモリのみ（非永続 Zustand フィールド）** |
| `localStorage` への保存 | **禁止**（XSS で常時盗取可能） |
| `sessionStorage` への保存 | **禁止**（XSS で同セッション中に盗取可能） |
| ページリロード後 | PAT は破棄される（再入力が必要） |
| 通信経路 | HTTPS 必須（GitHub Pages 前提） |
| PAT スコープ | `repo`（read-only アクセスで十分な場合は `public_repo` + Fine-grained PAT の read-only を推奨） |

#### XSS リスクについて

メモリ保持もゼロリスクではない（既存コードに XSS 脆弱性があれば JavaScript から読み取れる）。ただし:

- `localStorage` / `sessionStorage` と比べてリスクは低い（ページを閉じれば消去）。
- アプリ本体の XSS 対策（React の標準的な出力エスケープ、CSP ヘッダー設定）を前提とすれば、PAT のメモリ保持は **現実的なリスク許容範囲**内である。
- 認証情報の扱いをユーザー自身が判断できるよう、UI に「PAT はこのページを閉じると破棄されます」の旨を明示する。

### 5.4 エラーハンドリング

| HTTP ステータス | 原因 | UIへの伝え方 |
|----------------|------|------------|
| 404 | リポジトリ or Issue が存在しない | 「Issue が見つかりません」トースト |
| 401 / 403 | 認証失敗 / 権限なし | 「認証エラー: PAT を確認してください」トースト |
| 429 | レート制限超過 | 「しばらく時間をおいて再試行してください」トースト |

---

## 6. ストア設計（Zustand）

### 6.1 `integrationLinkStore`

**配置先**: `src/features/timer/stores/integrationLinkStore.ts`

```typescript
// 概念コード（実装は Phase 1 以降）

interface IntegrationLinkState {
  /** timeLogId → IntegrationLink[] のマップ */
  linksByLogId: Record<string, IntegrationLink[]>;
  /**
   * GitHub PAT（メモリのみ・非永続）
   * - localStorage / sessionStorage には保存しない
   * - ページリロードで null にリセットされる
   */
  githubPat: string | null;
}

interface IntegrationLinkActions {
  /** リンクを追加する */
  addLink: (timeLogId: string, link: Omit<IntegrationLink, "id" | "createdAt">) => void;
  /** リンクを削除する */
  removeLink: (timeLogId: string, linkId: string) => void;
  /** 指定 timeLogId のリンク一覧を返す */
  getLinks: (timeLogId: string) => IntegrationLink[];
  /** PAT をメモリにセット（persist 対象外） */
  setGithubPat: (pat: string | null) => void;
}
```

**永続化**: Zustand `persist` ミドルウェア、LocalStorage キー: `integration-links`  
**注意**: `githubPat` は `persist` の `partialize` オプションで**永続化対象から除外**する。

### 6.2 既存ストアとの関係

| ストア | 責務 | 変更有無 |
|--------|------|---------|
| `timerLogStore` | 基本タイマーのログ保存 | 変更なし |
| `pomodoroStore` | ポモドーロ状態管理 | 変更なし |
| `integrationLinkStore` | 外部タスク連携（新規） | **新規追加** |

---

## 7. フェーズ別ロールアウト

| フェーズ | 内容 | 成果物 |
|---------|------|--------|
| **Phase 1** | データモデル・ストア実装、手入力 UI（Owner/Repo + Issue 番号 + タイトル）、LocalStorage 永続化 | `integrationLinkStore.ts`, `IntegrationLink` 型, TimeLog 詳細 UI 更新 |
| **Phase 2** | GitHub REST API 連携（Issue タイトル自動取得）、PAT 入力 UI（メモリ保持）、Public/Private リポジトリ対応 | GitHub API クライアント, PAT 入力フォーム, エラーハンドリング |
| **Phase 3** | 統計ビュー（Issue ごとの合計作業時間）、エクスポート機能 | 統計コンポーネント, CSV/JSON エクスポート |

---

## 8. 未解決事項・検討事項

| # | 項目 | ステータス |
|---|------|-----------|
| 1 | Private リポジトリ対応 → **対象とする。PAT をアプリ内で入力し、メモリのみに保持する** | ✅ **確定** |
| 2 | PAT をメモリ保持とした場合の UX（ページリロードごとに再入力を許容できるか） | 未決定 |
| 3 | TimeLog と IntegrationLink の整合性（ログ削除時のリンク孤立） | 未決定 |
| 4 | 同一 Issue の重複登録の扱い | 未決定 |
| 5 | GitLab 対応（将来フェーズ）の設計拡張方針 | 将来検討 |
