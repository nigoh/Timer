---
applyTo: "src/**/__tests__/**,src/**/*.test.ts,src/**/*.test.tsx"
---

# テスト実装規約（Vitest + happy-dom）

このプロジェクトのテストは **Vitest** を使用します。`jest` の API は使用しません。

## テストランナーと環境

- テストランナー: `vitest`
- DOM 環境: `happy-dom`（`@testing-library/jest-dom` のマッチャーは `src/test/setup.ts` で import 済み）
- モック: `vi.fn()`, `vi.spyOn()`, `vi.mock()` を使用（`jest.fn()` は使わない）

## ファイル命名

- コンポーネント: `ComponentName.test.tsx`
- ストア / ユーティリティ: `fileName.test.ts`
- テストファイルは対象ファイルと同じ `__tests__/` ディレクトリに配置する

## 構造

- **Arrange-Act-Assert** パターンに従う
- テストケース名は「何をすると何になるか」を日本語または英語で明確に記述する
- 1テストケースにつき1つの検証に集中する

## ストアのテスト

- ストアを直接 `import` してテストする（React コンポーネントは不要）
- `beforeEach` で `store.setState(初期値)` またはストアの reset アクションを呼ぶ
- `persist` ミドルウェアは `vi.mock('zustand/middleware', ...)` でスタブ化する必要がある場合のみ対応する

## コンポーネントのテスト

- `@testing-library/react` の `render` / `screen` / `userEvent` を使用する
- 実装詳細（CSS クラス名）ではなく、ユーザーが見るテキスト・ロール・ラベルで検証する

## 禁止事項

- `any` 型の使用禁止
- `setTimeout` のテストには `vi.useFakeTimers()` を使用し、テスト後は `vi.useRealTimers()` でリストアする
- スナップショットテストは原則避ける（変更が多いため）
