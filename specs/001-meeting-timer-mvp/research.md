# Research: Meeting Timer MVP

Date: 2025-10-26
Spec: ./spec.md

## Decisions

### 1) PDF generation strategy
- Decision: Print-friendly HTML first
- Rationale: Fast (<2s)・依存軽量・レイアウト充分。将来の複雑化に段階的対応可能。
- Alternatives: (a) Heavy PDF libs（遅い/バンドル増） (b) Server-side rendering（オフライン要件に反）

### 2) CSV columns
- Decision: agendas.csv(title,category,goal,outline,presenter,plannedSec,actualSec,overrunDecision)
- Rationale: 仕様の議題フレームを忠実に反映し、表計算で扱いやすい列設計。
- Alternatives: (a) 1ファイル多シート（CSV非対応） (b) 列の動的拡張（互換性が不安定）

- Decision: actions.csv(agendaTitle,owner,dueISO,content)
- Rationale: アクションのトラッキングに必要十分。Owner/Due は任意だが列を持つ。
- Alternatives: (a) minutes.csv に統合（用途が異なる）

### 3) Timer update & accuracy
- Decision: Monotonic time (performance.now) + 250–500ms internal tick; UI display snaps to 1Hz
- Rationale: ±1s精度と軽快な表示を両立。バックグラウンド復帰時も再計算で誤差を抑制。
- Alternatives: (a) setInterval(1000ms)のみ（誤差累積） (b) requestAnimationFrame（過剰）

### 4) Storage full handling
- Decision: 書き込み失敗時はユーザーに通知し編集をブロック、再試行導線を提供
- Rationale: データ消失を回避。MVPでもユーザー体験を損ねない最小対策。
- Alternatives: (a) 自動削除（事故リスク） (b) サイレント失敗（発見困難）

### 5) Borrow cascading rules
- Decision: 借用は次アジェンダの残時間から差し引き、0未満は不可。最終アジェンダへの借用は禁止。
- Rationale: 合計時間の整合性を保持し、負の時間を防ぐ。
- Alternatives: (a) 負値許容（実装/表示が破綻） (b) 全体時間枠からの借用（会議全体の終了時刻が不安定）

## Resolved Unknowns
- PDF 実装・CSV カラム・タイマー精度戦略・ストレージ満杯時の扱い・借用ルール → 全て解決

## Follow-ups
- 実測で Export<=2s を検証し、必要なら軽量ライブラリ検討（段階的採用）
