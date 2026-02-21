---
applyTo: "src/features/timer/stores/**,src/stores/**"
---

# Zustand ストア実装規約

このプロジェクトの状態管理は Zustand 4 を使用します。以下の規約に従ってください。

## 必須構造

- `State` と `Actions` を **interface で明示**し、`type Store = State & Actions` としてエクスポートする
- ストアファイルは `create<Store>()(...)` パターンで作成する
- 永続化が必要な場合は `zustand/middleware` の `persist` のみ使用する

```ts
// 正しい例
interface TimerState { ... }
interface TimerActions { ... }
type TimerStore = TimerState & TimerActions;
export const useTimerStore = create<TimerStore>()(...);
```

## 禁止事項

- `any` 型の使用禁止 — 必要なら union / type guard を追加する
- 同一責務のストアを別名で重複作成しない
- ストア内から直接 `localStorage` を操作しない（`persist` ミドルウェア経由にする）
- 通知・ログを直接発火せず、`notification-manager.ts` / `logger.ts` を呼ぶ
- 1秒 tick 系の処理はストア side で最小演算に保つ — 複雑な派生計算は `useMemo` へ

## `set` の使い方

- 最小差分更新を優先する: `set((s) => ({ count: s.count + 1 }))` 形式
- オブジェクト全体の再代入は避ける

## import

- `@/` エイリアスを使用する（`../../` の相対パスより優先）
- ドメイン型は `@/types/*` から import し、ストア内で再定義しない
