# 設計: クラウド認証・データ同期

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                            │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ React App (App.tsx)                                           │  │
│  │                                                               │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                    │  │
│  │  │  AuthContainer  │  │ SyncStatusInd.  │                    │  │
│  │  └────────┬────────┘  └────────┬────────┘                    │  │
│  │           │                   │                              │  │
│  │  ┌────────▼────────────────────▼────────────────────────┐    │  │
│  │  │              Zustand Stores (既存 + 新規)              │    │  │
│  │  │  auth-store │ sync-store │ timer-stores (変更なし)    │    │  │
│  │  └────────┬────────────────────┬─────────────────────────┘    │  │
│  │           │                   │                              │  │
│  │  ┌────────▼────────┐  ┌───────▼──────────────────────────┐   │  │
│  │  │  auth-service   │  │  sync-service / migration-svc    │   │  │
│  │  └────────┬────────┘  └───────┬──────────────────────────┘   │  │
│  │           │                   │                              │  │
│  │  ┌────────▼───────────────────▼──────────────────────────┐   │  │
│  │  │              src/lib/supabase.ts (singleton)           │   │  │
│  │  └────────────────────────────┬──────────────────────────┘   │  │
│  └───────────────────────────────┼───────────────────────────────┘  │
│                                  │                                  │
│  ┌───────────────────────────────▼──────────────────────────────┐   │
│  │  localStorage (既存、一次ストレージ)                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
                                   │ HTTPS / Realtime (WSS)
┌──────────────────────────────────▼──────────────────────────────────┐
│  Supabase                                                           │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  Auth (JWT) │  │  PostgreSQL      │  │  Realtime (Phoenix)  │   │
│  │  GitHub     │  │  sync_data table │  │  postgres_changes    │   │
│  │  Google     │  │  (JSONB + RLS)   │  │  channel             │   │
│  └─────────────┘  └──────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## データベーススキーマ

```sql
CREATE TABLE sync_data (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_key  TEXT NOT NULL,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, store_key)
);

ALTER TABLE sync_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_data" ON sync_data FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER sync_data_updated_at
  BEFORE UPDATE ON sync_data FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## 同期対象ストアキー

| store_key               | Zustand ストア           | 備考 |
|-------------------------|--------------------------|------|
| `task-store`            | task-store               |      |
| `basic-timer-store`     | basic-timer-store        |      |
| `pomodoro-store`        | pomodoro-store           |      |
| `agenda-timer-store`    | agenda-timer-store       |      |
| `multi-timer-store`     | multi-timer-store        |      |
| `meeting-report-store`  | meeting-report-store     |      |
| `integration-links`     | integration-link-store   | 秘密情報は partialize 済みで除外される |
| `ui-preferences`        | ui-preferences-store     |      |
| `meeting-knowledge-store` | meeting-knowledge-store |     |

## コンポーネント設計

### src/lib/supabase.ts
- `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)` のシングルトン
- 未設定時は `null` を返す（ゲストモードで graceful degradation）

### src/types/auth.ts
```typescript
export interface SyncUser {
  id: string;
  email: string | null;
  displayName: string | null;
  provider: 'github' | 'google';
  avatarUrl: string | null;
}
```

### src/types/sync.ts
```typescript
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncRecord {
  storeKey: string;
  data: unknown;
  updatedAt: string;
}
```

### src/features/auth/auth-store.ts
- State: `user: SyncUser | null`, `isLoading: boolean`
- Computed: `isAuthenticated` = `user !== null`
- Persistence: `userId` と `provider` のみ localStorage（セッション・トークンはメモリのみ）
- Actions: `setUser`, `clearUser`, `setLoading`

### src/features/auth/auth-service.ts
```typescript
signInWithGitHub(): Promise<void>
signInWithGoogle(): Promise<void>
signOut(): Promise<void>
onAuthStateChange(callback: (user: SyncUser | null) => void): () => void
```

### src/features/sync/sync-store.ts
- State: `status: SyncStatus`, `lastSyncAt: string | null`, `isOnline: boolean`
- Actions: `setStatus`, `setLastSyncAt`, `setOnline`
- 非永続（ページリロードでリセット）

### src/features/sync/sync-service.ts
```typescript
push(storeKey: string): Promise<void>         // localStorage → Supabase UPSERT
pull(storeKey: string): Promise<void>         // Supabase → localStorage（LWW）
syncAll(): Promise<void>                      // 全 9 ストアキーをループ
```

LWW ロジック:
1. Supabase から `updated_at` を取得
2. localStorage の `__sync_updated_at__` と比較
3. Supabase の方が新しければ localStorage 上書き → Zustand `setState` で再ロード
4. localStorage の方が新しければ Supabase に UPSERT

### src/features/sync/migration-service.ts
```typescript
migrateGuestData(): Promise<void>
```
- 全 STORE_KEYS をループ
- localStorage から raw JSON を読む
- 各キーを push（クラウドが新しければ LWW でスキップ）

### src/features/sync/realtime-service.ts
```typescript
subscribe(userId: string): void
unsubscribe(): void
```
- `supabase.channel('sync-{userId}').on('postgres_changes', ...)` で変更受信
- セッション ID でエコー防止
- 受信したデータを localStorage に書き込み → Zustand `setState` でリロード

## 同期フロー

### 書き込みフロー
```
ユーザー操作
  → Zustand store.setState()
  → Zustand persist middleware → localStorage（即時）
  → syncService.push(storeKey)（非同期・fire-and-forget）
  → Supabase UPSERT
```

### 読み込みフロー（アプリ起動時）
```
1. Zustand hydrate from localStorage（即時・既存動作）
2. if 認証済み: syncService.syncAll()（非同期）
   → 各ストア: Supabase から取得 → LWW 判定 → 必要なら localStorage 上書き + setState
```

### Realtime フロー
```
他タブ/デバイス でデータ変更
  → Supabase DB 更新
  → Realtime 通知 → このタブ受信
  → localStorage 上書き
  → Zustand setState でリロード
```

## セキュリティ設計

- **RLS**: `auth.uid() = user_id` でユーザーは自分のデータのみアクセス可能
- **認証トークン**: Supabase SDK がメモリ内で管理（localStorage に書き込まない設定は Supabase SDK 側で対応）
- **API キー**: `VITE_SUPABASE_ANON_KEY` は公開可能な匿名キー（RLS で保護）
- **秘密情報**: `githubPat`、`aiProviderConfig` はメモリのみ・sync 対象外（partialize で除外済み）

## 環境変数

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Supabase ダッシュボード > Authentication > Providers で GitHub・Google を有効化。
リダイレクト URL: `https://<app-domain>/auth/callback`（ローカル開発: `http://localhost:3000`）
