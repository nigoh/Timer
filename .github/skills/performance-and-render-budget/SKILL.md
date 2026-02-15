---
name: performance-and-render-budget
description: Optimize rendering performance and runtime cost in Timer App, focusing on tick loops, memoization, and unnecessary re-renders. Use when UI feels slow, timers jitter, or rendering work grows.
license: MIT
---

# Performance and Render Budget Skill

## Goal

Timer App の体感速度と安定性を維持するため、再レンダー量と tick 処理コストを予算内に抑える。

## Focus scope

- `tick` を含む 1秒周期処理
- Zustand store 更新頻度
- React 再レンダー回数
- 重い派生計算とイベントハンドラ

## Performance budget

- 1秒周期処理で不要なオブジェクト再生成を最小化する。
- 変更のない state フィールドは更新しない。
- 高頻度更新の描画範囲を局所化する。

## Procedure

1. 変更対象の更新頻度（毎秒/操作時）を分類する。
2. store の `set` が最小差分更新になっているか確認する。
3. View で重い派生計算がある場合は `useMemo` を検討する。
4. ハンドラ再生成が多い箇所は `useCallback` を検討する。
5. list 描画は key と不要再描画を確認する。
6. 変更後に主要フローの操作遅延がないか確認する。

## Timer-specific checklist

- tick で全件 map が必要か、対象限定更新にできるか。
- 通知やログが高頻度ループで過剰発火していないか。
- `isRunning` が false のとき不要処理を早期 return しているか。

## Output format

- ボトルネック候補
- 修正方針
- 実装差分
- 期待効果

## Guardrails

- 可読性を著しく落とす過剰最適化をしない。
- 体感改善のない複雑化は導入しない。
