---
applyTo: "src/features/timer/components/**,src/components/**"
---

# コンポーネント実装規約（React + Radix UI + Tailwind）

## 責務の分離

- `containers/` は **配線専用**（ストアの値取得・アクション接続のみ）
- 表示ロジック・JSX は `components/*View.tsx` に置く
- コンポーネントから直接 `localStorage` / `Notification API` / `fetch` を呼ばない
  - 永続化 → ストア経由、通知 → `notification-manager.ts`、API → サービス層

## UI コンポーネント

- Radix UI プリミティブは `src/components/ui/` のラッパー経由で使用する（直接 import 不可）
- スタイルは Tailwind クラスで記述し、インラインスタイルは避ける
- レスポンシブ対応は `sm:` / `md:` プレフィックスを使用する

## パフォーマンス

- イベントハンドラが重い場合は `useCallback` でメモ化する
- 計算コストの高い派生値は `useMemo` を使用する
- `useState` は **UI ローカル状態**（開閉・タブ・一時入力）のみに使用する
  - ドメイン状態は Zustand ストアへ

## import

- `@/` エイリアスを優先する
- 未使用 import は残さない
- ドメイン型は `@/types/*` から import する（コンポーネント内で型を再定義しない）

## 命名規則

- コンポーネントファイル: `PascalCase.tsx`
- View コンポーネント: `*View.tsx`（例: `BasicTimerView.tsx`）
- フック: `use*` で始まる camelCase
- イベントハンドラ: `handle*` で始まる camelCase（例: `handleStart`）
