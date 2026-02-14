# Requirements / Specs / Implementation マップ

Timer機能の要件と仕様書、および実装コードの対応関係を整理するためのマップ。

| 要件領域 | 要件（`docs/REQUIREMENTS.md`） | 技術仕様（`docs/TECHNICAL_SPECS*.md`） | 実装（`src/features/timer/**`） |
| --- | --- | --- | --- |
| 基本タイマー | タイマー開始/停止/リセット、時間表示 | `docs/TECHNICAL_SPECS.md` のTimer関連セクション | `containers/BasicTimer.tsx`, `components/basic-timer/BasicTimerView.tsx`, `stores/basic-timer-store.ts`, `hooks/use-timer.ts` |
| ポモドーロ | 作業/休憩のサイクル管理、経過可視化 | `docs/TECHNICAL_SPECS.md`, `docs/TECHNICAL_SPECS_SHADCN.md` のポモドーロUI記述 | `containers/EnhancedPomodoroTimer.tsx`, `components/pomodoro/EnhancedPomodoroTimerView.tsx`, `stores/pomodoro-store.ts`, `hooks/use-pomodoro-timer.ts` |
| 複数タイマー | 複数タイマーの同時管理と一覧表示 | `docs/TECHNICAL_SPECS.md` の状態管理/一覧表示方針 | `containers/MultiTimer.tsx`, `components/multi-timer/MultiTimerView.tsx`, `stores/multi-timer-store.ts`, `components/timer-list.tsx` |
| アジェンダ連携 | アジェンダ単位でのタイマー運用 | `docs/TECHNICAL_SPECS.md` の機能拡張方針 | `containers/NewAgendaTimer.tsx`, `components/agenda/NewAgendaTimerView.tsx`, `stores/new-agenda-timer-store.ts` |
| 永続化/復元 | 状態保存と復元 | `docs/TECHNICAL_SPECS.md` のデータ永続化方針 | `services/persistence.ts`, 各`stores/*.ts`の永続化連携 |
| 品質保証 | 状態遷移・境界条件の検証 | テスト/品質基準に関する仕様記述 | `stores/__tests__/basic-timer-store.test.ts`, `stores/__tests__/pomodoro-store.test.ts` |

## 運用ルール
- 新規要件を追加したら、この表に「要件領域」を追加する。
- 仕様書への追記がある場合、対応する実装ディレクトリまで同一行で更新する。
- 実装ファイルの移動/改名時は、リンク切れ防止のため同時に更新する。
