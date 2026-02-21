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

## 文字サイズ規約（厳守）

アプリ全体で使用できる文字サイズは以下の **7種類のみ**。それ以外（`text-[10px]`、`text-3xl` など任意値・非許可ステップ）は禁止。

| クラス                | サイズ             | 用途                                                        |
| --------------------- | ------------------ | ----------------------------------------------------------- |
| `text-xs`             | 12px               | メタ情報・補足・バッジ件数・タイムスタンプ                  |
| `text-sm`             | 14px               | 本文・フォームラベル・ボタン・CardTitle（コンパクト）       |
| `text-base`           | 16px               | **UI Primitive のみ**（`textarea`・Quill エディタモバイル） |
| `text-lg`             | 18px               | 空状態見出し・セクションサブタイトル                        |
| `text-xl`             | 20px               | `.stat-value` クラス・アジェンダ名などの強調値              |
| `text-2xl`            | 24px               | `CardTitle` デフォルト・TimerSettings の時間プレビュー      |
| `timer-display-digit` | clamp(2.5–5.75rem) | メインタイマー数字のみ                                      |

- 統計値には `.stat-value`（`text-xl font-bold`）、そのラベルには `.stat-label`（`text-xs text-muted-foreground`）を使用する
- `text-base` をアプリ独自コンポーネントに使うことは禁止（UI Primitive ラッパー内のみ許容）

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
