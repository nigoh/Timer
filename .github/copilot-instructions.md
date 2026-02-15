## Timer App 用 Copilot 実装ガイド

このファイルは、Timer App（React + TypeScript + Vite + Zustand）で
Copilot が一貫した実装を行うための最優先ガイドです。

## 現行アーキテクチャ（必須）

```txt
src/
├── App.tsx
├── components/                  # 共通 UI（LogViewer / ErrorBoundary / ui/*）
├── features/
│   └── timer/
│       ├── components/          # 機能別 View
│       │   ├── agenda/
│       │   ├── basic-timer/
│       │   ├── multi-timer/
│       │   └── pomodoro/
│       ├── containers/          # 画面コンテナ
│       └── stores/              # Zustand ストア（機能の単一責務）
├── types/                       # ドメイン型
└── utils/                       # logger / notification manager
```

**技術スタック（実態）**: React 18 / TypeScript 5 / Vite 5 / Zustand 4 / Radix UI / Tailwind

## 実装ルール

### 1. 状態管理

- ドメイン状態は `src/features/timer/stores/*` の Zustand に集約する。
- React の `useState` は「UIローカル状態（開閉、タブ、一時入力）」のみに限定する。
- `set` は最小差分更新を優先し、不要な再代入を避ける。
- ストアは **State / Actions を interface で明示**し、公開 API を固定化する。

### 2. コンポーネント責務

- `containers` は配線専用、表示ロジックは `components/*View.tsx` に置く。
- 1ファイルが肥大化する場合は、機能単位で `components/{feature}` に分割する。
- コンポーネントから直接 `localStorage` や通知 API を叩かず、ストア/ユーティリティ経由にする。

### 3. 通知・ログ

- 通知は必ず `src/utils/notification-manager.ts` を利用する。
- 重要なユーザー操作・エラーは `src/utils/logger.ts` を通して記録する。
- 新規機能追加時は「開始/完了/失敗」のログポイントを定義する。

### 4. 型・命名

- ドメイン型は `src/types/*` を正本とし、同等型を再定義しない。
- import は `@/` エイリアスを優先する。
- 一時的な any の導入は禁止。必要なら union/type guard を追加する。

### 5. パフォーマンス

- 重いハンドラは `useCallback`、派生計算は `useMemo` を検討する。
- 1秒 tick 系処理は store 側で最小演算に保つ。
- 不要な `useEffect` を増やさず、依存配列を厳密に管理する。

## 禁止事項

- ❌ 廃止済みファイル（`App.full.tsx` など）を復活させる実装
- ❌ 同一責務のストア重複作成（例: 同じタイマー種別の別名 store）
- ❌ UI から直接の副作用呼び出し（通知/永続化/複雑ログ）
- ❌ 未使用 import / 未使用 state の残置
- ❌ 仕様変更を伴うのに docs 未更新のまま終了

## 品質チェック（PR前）

- [ ] `npm run type-check` が成功
- [ ] 変更範囲に応じて `npm run test` を実行
- [ ] 仕様変更がある場合、`docs/REQUIREMENTS.md` を更新
- [ ] README 参照リンクが有効
- [ ] 追加依存がある場合、理由を PR に明記

## 参照ドキュメント

- 要件: `docs/REQUIREMENTS.md`
- 機能一覧: `docs/FEATURES.md`
- 技術仕様: `docs/TECHNICAL_SPECS.md`
- UX仕様: `docs/UX_DESIGN_SPEC.md`
- AI協業運用: `docs/AI_COLLABORATION_GUIDE.md`
