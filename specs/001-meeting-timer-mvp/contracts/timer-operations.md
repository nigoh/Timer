# Contract: Timer Operations (Local)

Version: 1.0.0

## Commands
- start(agendaId?: string): void — 現在/指定アジェンダで開始
- pause(): void — 一時停止
- resume(): void — 再開
- reset(): void — 現在アジェンダのタイマーをリセット（確認必須）
- next(): void — 次のアジェンダへ（確認必須）
- extend(seconds: number): void — 残時間を加算し、OverrunDecisionに記録
- borrow(seconds: number): void — 次アジェンダから借用（最終アジェンダ不可、残時間が負にならない）

## Queries
- getStatus(): { state: 'idle'|'running'|'paused'|'finished', currentAgendaId?: string }
- getRemaining(): number (sec)
- getPlanned(): number (sec)
- getActual(): number (sec)

## Events (log categories)
- timer:start, timer:pause, timer:resume, timer:next, timer:extend, timer:borrow, timer:finish
