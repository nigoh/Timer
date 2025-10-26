# タイマ�Eアプリケーション 機�E一覧

本ドキュメント�E、現在リポジトリに実裁E��れてぁE��機�EをカチE��リ別に整琁E��た一覧です。画面・コンポ�Eネント�Eストアの実裁E��況をもとに記載してぁE��す、E
## 基本タイマ�E�E�EasicTimer�E�E- 時間設定（�E・秒）、�EリセチE��選択、セチE��ョン名ラベル
- 操佁E 開始�E一時停止・停止・リセチE��
- 進捗バーと経過玁E��示、状態バチE���E�実行中/一時停止/征E��E完亁E��E- 履歴ダイアログ�E�一覧/個別削除/全削除�E�E- 履歴の統計サマリー�E�セチE��ョン数/完亁E��/合計時閁E平坁E��間！E- 最近セチE��ョンのクイチE��ビュー表示
- 主要ソース: `src/features/timer/containers/BasicTimer.tsx`, `src/features/timer/components/basic-timer/BasicTimerView.tsx`, `src/components/TimerSettings.tsx`, `src/components/TimerHistory.tsx`, `src/features/timer/stores/basic-timer-store.ts`

## ポモド�Eロ�E�EnhancedPomodoroTimer�E�E- フェーズ管琁E 作業/短休�E/長休�E、サイクルの自動進衁E- 操佁E 開始�E一時停止・停止・スキチE�E・リセチE��
- 設定ダイアログ:
  - 作業/短休�E/長休�Eの時間、E��休�E間隔
  - 自動開始（休�E→作業/作業→休�E�E�ON/OFF
  - プリセチE���E�クラシチE��/雁E��垁E短時間垁E長時間型！E- 今日の統訁E 完亁E�Eモド�Eロ数・雁E��時間・休�E時間・効玁E 表示
- フェーズ別カラー表示、E��捗バー、タスク名�E力（作業フェーズ�E�E- Web通知と簡易音通知�E�権限リクエストを含む�E�E- 主要ソース: `src/features/timer/containers/EnhancedPomodoroTimer.tsx`, `src/features/timer/components/pomodoro/EnhancedPomodoroTimerView.tsx`, `src/features/timer/stores/pomodoro-store.ts`

## 会議アジェンダタイマ�E�E�EewAgendaTimer�E�E- 会議の作�E/削除/選択、会議設定（�E動�E移/サイレンチEベル種別�E�E- アジェンダの追加/編雁E削除/並び替え、予定時間とメモ
- アジェンダの状態管琁E��未開姁E実行中/完亁E趁E���E�E- 操佁E 開始�E一時停止・停止・前へ/次へ
- 現在/合計�E進捗表示�E�色は進捗に応じて変化�E�E- ベル通知�E�開姁E5刁E��/終亁E趁E���E�とサイレント時のバイブレーション
- バックグラウンド滞在からの時間同期、Web通知権限リクエスチE- 主要ソース: `src/features/timer/containers/NewAgendaTimer.tsx`, `src/features/timer/components/agenda/NewAgendaTimerView.tsx`, `src/features/timer/stores/new-agenda-timer-store.ts`, `src/utils/bellSoundManager.ts`

## 褁E��タイマ�E�E�EultiTimer�E�E- タイマ�E追加�E�名称/時間入劁E MM:SS・H:MM:SS・刁E��カチE��リ、説明、色�E�E- 個別操佁E 開始�E一時停止・停止・リセチE��・褁E��・削除
- グローバル制御: すべて開姁E一時停止/停止/リセチE��
- サマリーカーチE 実行中/征E��中/完亁E総数
- グローバル設定トグル: 通知表示、完亁E��の音
- 主要ソース: `src/features/timer/containers/MultiTimer.tsx`, `src/features/timer/components/multi-timer/MultiTimerView.tsx`, `src/features/timer/stores/multi-timer-store.ts`

## ログと監視！EogViewer + logger�E�E- 構造化ロガー�E�レベル/カチE��リ/スタチE��/セチE��ョンID�E�。window エラーと未処琁Eromiseの捕捉
- ログ保孁E取得！EocalStorage�E�、�E力（コンソール�E�E- ログビューア:
  - 検索、レベル/カチE��リフィルタ
  - 統計（総数/レベル別/カチE��リ別/期間�E�E  - エクスポ�EチEクリア
- 監視フチE��:
  - パフォーマンス/レンダ時間、ユーザーアクション、API呼び出し、メモリ使用釁E- 主要ソース: `src/utils/logger.ts`, `src/components/LogViewer.tsx`, `src/hooks/useLogging.ts`

## エラーハンドリング�E�ErrorBoundary�E�E- 例外捕捉とフォールバックUI表示
- 再試行�Eペ�Eジ再読み込みボタン
- ログ記録�E�メチE��ージ/スタチE��/コンポ�EネントスタチE���E�E- ログビューアを起動して確認可能
- 主要ソース: `src/components/ErrorBoundary.tsx`

## チE�Eタ永続化�E�EndexedDB / Dexie�E�E- タイマ�E/セチE��ョン/設定�E保存�E読込
- エクスポ�EチEインポ�Eト、�E期化/クリアAPI
- 実裁E `src/lib/database.ts` および `src/features/timer/stores/timer-store.ts`�E�Eeatures層での読み書き実裁E��り！E- 主要ソース: `src/lib/database.ts`, `src/features/timer/stores/timer-store.ts`

## UI/ナビゲーション
- タブ式ナビ（基本/ポモド�Eロ/アジェンダ/褁E���E�E- shadcn/ui + Tailwind UIコンポ�EネンチE- Lucideアイコン
- レスポンシブ対応（コンチE��幁EグリチE��刁E���E�E- ログビューア呼び出し�Eタン�E��EチE��ー�E�E- 主要ソース: `src/App.tsx`, `src/components/ui/tabs.tsx`, `src/components/ui/button.tsx`, `src/globals.css`

---

補足:
- 通知/音はブラウザの権限状態に依存します、E- Dexie連携は features 層に実裁E��あり、`src/components` ベ�Eスの画面とは用途が刁E��れてぁE��す（段階的統合を想定）、E
