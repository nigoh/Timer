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

## スペーシング規約（厳守）

アプリ全体で使用できるスペーシングスケール値は以下の **8種類＋例外2種のみ**。それ以外（`0.5`、`2.5`、`5`、`12` など）は禁止。

| 値     | rem      | 用途                                       |
| ------ | -------- | ------------------------------------------ |
| `0`    | 0rem     | リセット専用 (`pt-0`, `mt-0` など)         |
| `1`    | 0.25rem  | 極小（バッジ周辺・インラインアイコン余白）  |
| `2`    | 0.5rem   | 小（ラベル下 `mb-2`・コンパクトボタン縦）  |
| `3`    | 0.75rem  | 標準（行間・ボタン縦 `py-3`）              |
| `4`    | 1rem     | 中（カード内パッド・セクション間）         |
| `6`    | 1.5rem   | 大（標準カード `p-6`・CardHeader デフォルト）|
| `8`    | 2rem     | 特大（設定系パネル・空状態縦 `py-8`）      |
| `auto` | -        | 中央揃え / 右寄せ (`ml-auto`, `mx-auto`)   |

### 許可例外（2種のみ）

| クラス     | 用途                                                        |
| ---------- | ----------------------------------------------------------- |
| `mr-1.5`   | ボタン内アイコンの右マージン（唯一の非整数スケール許可値）  |
| `px-1.5`   | コンパクトバッジ (`h-5 px-1.5 text-xs`) の横パッドのみ     |

### 禁止パターン例

```
❌ mb-0.5, py-0.5, pt-0.5  → ✅ mb-1, py-1, pt-1
❌ py-2.5, px-2.5           → ✅ py-3, px-3
❌ pl-5                     → ✅ pl-4 or pl-6
❌ py-12                    → ✅ py-8
❌ mr-1, mr-2（ボタンアイコン用途） → ✅ mr-1.5
```

> **注意**: shadcn/Radix UI プリミティブ (`badge.tsx`, `select.tsx`, `tabs.tsx`) は例外。変更しないこと。

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
