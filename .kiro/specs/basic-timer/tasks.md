# タスク計画: 基本タイマー

## フェーズ概要

既存実装との差分（ギャップ）を埋めるタスク群。
要件 1〜3（カウントダウン・操作・履歴）は実装済み。
**ギャップ: `tick()` が `lastTickTime` による deltaTime 補正を持たない**（バックグラウンドタブで遅延蓄積が起こる）

---

## P0: tick deltaTime 補正

### タスク 1.1: `BasicTimerInstanceState` に `lastTickTime` を追加する

- [x] `src/features/timer/stores/basic-timer-store.ts` の `BasicTimerInstanceState` に `lastTickTime: number | null` を追加する
- [x] `createDefaultInstance()` の初期値を `lastTickTime: null` にする

### タスク 1.2: start / pause / stop / reset で `lastTickTime` を管理する

- [x] `start()`: `lastTickTime: Date.now()` をセットする
- [x] `pause()`: `lastTickTime: null` をセットする
- [x] `stop()`: `lastTickTime: null` をセットする
- [x] `reset()`: `lastTickTime: null` をセットする
- [x] `completeSession()`: `lastTickTime: null` をセットする

### タスク 1.3: `tick()` に deltaTime 補正を追加する

- [x] `inst.lastTickTime` が存在する場合は `Math.round((now - inst.lastTickTime) / 1000)` を delta として使用する
- [x] `lastTickTime` が null の場合は `deltaTime = 1` にフォールバックする
- [x] `deltaTime <= 0` のときは早期リターンする
- [x] `set()` 内で `lastTickTime: now` を更新する

---

## P1: 品質ゲート

### タスク 2.1: 品質ゲートを実行する

- [x] `npm run type-check` が通過すること
- [x] `npm run test:run` が全件通過すること
- [x] `npm run build` が成功すること
