# タスク分解: クラウド認証・データ同期

## フェーズ 1: 基盤（Supabase クライアント・型定義）

- [x] `@supabase/supabase-js` を package.json に追加・インストール
- [x] `.env.example` にプレースホルダー追加
- [x] `supabase/migrations/001_create_sync_data.sql` 作成
- [x] `src/lib/supabase.ts` — Supabase クライアントシングルトン
- [x] `src/types/auth.ts` — `SyncUser` 型定義
- [x] `src/types/sync.ts` — `SyncStatus`, `SyncRecord` 型定義

## フェーズ 2: 認証

- [x] `src/features/auth/auth-store.ts` — Zustand 認証ストア（セッションはメモリのみ）
- [x] `src/features/auth/auth-service.ts` — signInWithGitHub/Google/signOut/onAuthStateChange
- [x] `src/features/auth/components/LoginButton.tsx` — GitHub/Google ログインボタン
- [x] `src/features/auth/components/UserMenu.tsx` — ユーザーアバター・ログアウトドロップダウン
- [x] `src/features/auth/components/AuthModal.tsx` — ログインモーダル
- [x] `src/features/auth/containers/AuthContainer.tsx` — auth-store → UI 配線
- [x] `src/App.tsx` — AuthContainer 追加・onAuthStateChange 購読

## フェーズ 3: 同期サービス

- [x] `src/features/sync/sync-store.ts` — SyncStatus, lastSyncAt, isOnline
- [x] `src/features/sync/sync-service.ts` — push/pull/syncAll（LWW）
- [x] `src/App.tsx` — online/offline イベント・visibilitychange フック追加

## フェーズ 4: ゲストデータ移行

- [x] `src/features/sync/migration-service.ts` — migrateGuestData()

## フェーズ 5: リアルタイム同期

- [x] `src/features/sync/realtime-service.ts` — subscribe/unsubscribe

## フェーズ 6: UX

- [x] `src/features/auth/components/SyncStatusIndicator.tsx` — 同期ステータス表示
- [x] `src/App.tsx` — SyncStatusIndicator をサイドバーフッターに追加

## フェーズ 7: ドキュメント更新

- [x] `docs/REQUIREMENTS.md` — RQ-09 クラウド認証・データ同期 追加
- [x] `docs/FEATURES.md` — クラウド同期・認証 セクション追加
- [x] `docs/TECHNICAL_SPECS.md` — 技術スタック・ディレクトリ・環境変数・同期アーキテクチャ 更新
- [x] `docs/UX_DESIGN_SPEC.md` — ログインフロー・ユーザーメニュー・同期ステータス UX 追加
- [x] `CLAUDE.md` — 主要ファイル早見表に auth/sync 追加

## 品質確認

- [x] `npm run type-check` — エラーなし
- [x] `npm run test:run` — 既存テストすべてパス
- [x] `npm run build` — ビルド成功
