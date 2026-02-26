# テスト一覧 (Test Inventory)

> 最終更新: 2026-02-21  
> テストフレームワーク: Vitest  
> テストファイル総数: **26**  
> テストケース総数: **約 150**

---

## 凡例

| マーク | 意味                               |
| ------ | ---------------------------------- |
| ✅      | テスト済み                         |
| ❌      | 未テスト                           |
| 🔲      | 部分的にテスト済み（主要パスのみ） |

---

## 1. ユーティリティ (`src/utils/`)

### 1-1. `logger.ts` ✅
**ファイル**: `src/utils/__tests__/logger.test.ts`  
**対応要件**: REQ-5.6

| #   | テスト名                                           | 検証内容                                           |
| --- | -------------------------------------------------- | -------------------------------------------------- |
| 1   | レベルフィルタとカテゴリフィルタでログを取得できる | `getLogsByLevel` / `getLogsByCategory` の絞り込み  |
| 2   | clearLogs で保存済みログがクリアされる             | `clearLogs()` 後に "Logs cleared" エントリのみ残る |

---

### 1-2. `color-mode.ts` ✅
**ファイル**: `src/utils/__tests__/color-mode.test.ts`

| #   | テスト名                               | 検証内容                                                  |
| --- | -------------------------------------- | --------------------------------------------------------- |
| 1   | 保存済みのテーマを優先して初期値を返す | localStorage に "dark" がある場合の `getInitialColorMode` |
| 2   | 保存値がない場合は OS 設定を参照する   | `matchMedia` mock で dark 判定                            |
| 3   | 指定テーマの適用と保存ができる         | `applyColorMode` + `persistColorMode` の連携              |

---

### 1-3. `notification-manager.ts` ❌
テストなし。

---

## 2. 共通コンポーネント (`src/components/`)

### 2-1. `LogViewer.tsx` ✅
**ファイル**: `src/components/__tests__/LogViewer.test.tsx`  
**対応要件**: REQ-5.6

| #   | テスト名                                                                 | 検証内容                                                                                                            |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 1   | レベル・カテゴリ・全文検索・各ログの AI 向けコピー・クリア処理が動作する | レベルフィルタ / カテゴリフィルタ / 検索フィルタ / clipboard コピー / clearLogs 呼び出し / 「ログがありません」表示 |

---

### 2-2. `SettingsDialog.tsx` ❌
### 2-3. `TimerHistory.tsx` ❌
### 2-4. `TimerSettings.tsx` ❌
### 2-5. `GitHubIssueLinking.tsx` ❌
### 2-6. `SettingsAndLogsPage.tsx` ❌
### 2-7. `Footer.tsx` ❌

---

## 3. Zustand ストア (`src/features/timer/stores/`)

### 3-1. `basic-timer-store.ts` ✅
**ファイル**: `src/features/timer/stores/__tests__/basic-timer-store.test.ts`  
**対応要件**: REQ-5.1

| #   | テスト名                                             | 検証内容                          |
| --- | ---------------------------------------------------- | --------------------------------- |
| 1   | initialises with default duration and remaining time | デフォルト 25 分・isRunning=false |
| 2   | counts down and records history on completion        | tick→カウントダウン→完了→履歴記録 |
| 3   | supports pausing and resetting the timer             | pause/reset の状態遷移            |

---

### 3-2. `agenda-timer-store.ts` ✅
**ファイル**: `src/features/timer/stores/__tests__/agenda-timer-store.test.ts`  
**対応要件**: REQ-5.4

| #   | テスト名                                                         | 検証内容                                            |
| --- | ---------------------------------------------------------------- | --------------------------------------------------- |
| 1   | 会議作成とアジェンダ追加/更新/削除ができる                       | CRUD・totalPlannedDuration 更新                     |
| 2   | 会議名更新時に meetings と currentMeeting のタイトルが同期される | 二重ストア同期                                      |
| 3   | 開始/停止/次アジェンダ遷移が動作する                             | startTimer / pauseTimer / nextAgenda / stopTimer    |
| 4   | セッション完了で現在議題を完了し次の議題へ遷移する               | stopTimer による自動完了遷移                        |
| 5   | 実行中は前へ/次へが無効で議題遷移しない                          | isRunning 中の nextAgenda ガード                    |
| 6   | 未開始の pending 議題では次へを実行できない                      | pending 状態での nextAgenda 抑制                    |
| 7   | 議事録フォーマットを更新できる                                   | `updateAgendaMinutes` で minutesFormat/Content 更新 |
| 8   | tick で経過時間が更新され、予定超過時は overtime になる          | overtime ステータス遷移                             |
| 9   | currentAgendaId を meetings と currentMeeting の両方で維持する   | 二重ストア同期（nextAgenda 後）                     |
| 10  | 現在議題削除時は order 順で次候補を優先し先頭候補へ再選択する    | deleteAgenda の再選択ロジック                       |
| 11  | 壊れた currentAgendaId から getCurrentAgenda で復旧し再同期する  | 不正 ID からの自動復旧                              |
| 12  | tick 実行時に running と currentTime が更新される                | tick の時間進行                                     |
| 13  | nextAgenda で現在議題を完了にして次の議題へ遷移する              | completed→次議題遷移                                |
| 14  | 最終議題完了時は会議を completed へ遷移し終了時刻を保持する      | meeting.status=completed / endTime                  |
| 15  | tick で経過時間を進め残り時間を更新する                          | remainingTime 計算                                  |
| 16  | pause 後に再開すると経過時間を保持したまま進行する               | pauseTimer→startTimer の継続計測                    |
| 17  | stop 後に再開すると計測を初期化して開始する                      | stopTimer→startTimer のリセット起動                 |
| 18  | startTimer は notificationManager のモックを呼び出す             | 通知発火確認                                        |

---

### 3-3. `multi-timer-store.ts` ✅
**ファイル**: `src/features/timer/stores/__tests__/multi-timer-store.test.ts`  
**対応要件**: REQ-5.5

| #   | テスト名                                      | 検証内容                                        |
| --- | --------------------------------------------- | ----------------------------------------------- |
| 1   | タイマー追加/複製/削除ができる                | addTimer / duplicateTimer / deleteTimer         |
| 2   | 個別 start/pause/stop/reset が動作する        | 各状態遷移 (isRunning / isPaused / isCompleted) |
| 3   | 全体操作 startAll/pauseAll/stopAll が動作する | isAnyRunning の同期                             |
| 4   | tick 完了時に isCompleted へ状態遷移する      | remainingTime=0 → isCompleted=true              |
| 5   | 完了済みタイマーに対する start は拒否される   | isCompleted ガード                              |

---

### 3-4. `pomodoro-store.ts` 🔲
**ファイル**: `src/features/timer/stores/__tests__/pomodoro-store.test.ts`  
**対応要件**: REQ-5.3

| #   | テスト名                                                        | 検証内容                       |
| --- | --------------------------------------------------------------- | ------------------------------ |
| 1   | starts and pauses the timer                                     | isRunning / isPaused 遷移      |
| 2   | transitions to break phase when work session completes          | work→short-break フェーズ遷移  |
| 3   | does not complete session twice before auto-start timeout fires | autoStartBreaks の二重完了防止 |
| 4   | resets the cycle and task name                                  | reset() 完全リセット           |

---

### 3-5. `dashboard-store.ts` ✅
**ファイル**: `src/features/timer/stores/__tests__/dashboard-store.test.ts`

| #   | テスト名                                      | 検証内容                           |
| --- | --------------------------------------------- | ---------------------------------- |
| 1   | initialises with day granularity              | 初期値検証                         |
| 2   | setGranularity updates granularity            | week/month への変更                |
| 3   | setGranularity to month                       | month への変更                     |
| 4   | setDateRange updates since and until          | 日付範囲更新                       |
| 5   | setTimerKind updates timerKind                | timerKind フィルタ設定             |
| 6   | setTimerKind with undefined clears the filter | timerKind クリア                   |
| 7   | setGranularity preserves existing date range  | dateRange を保持したままの粒度変更 |

---

### 3-6. `integration-link-store.ts` ✅
**ファイル**: `src/features/timer/stores/__tests__/integration-link-store.test.ts`

| #   | テスト名                                              | 検証内容                  |
| --- | ----------------------------------------------------- | ------------------------- |
| 1   | starts with empty linksByLogId and null githubPat     | 初期値                    |
| 2   | addLink adds a link with a generated id and createdAt | リンク追加・自動 ID 生成  |
| 3   | addLink appends multiple links to the same timeLogId  | 同 ID への複数リンク      |
| 4   | addLink does not affect other timeLogIds              | 独立性確認                |
| 5   | removeLink removes the correct link by id             | 指定 ID 削除              |
| 6   | removeLink on unknown id does not throw               | 未知 ID 削除の安全性      |
| 7   | getLinks returns empty array for unknown timeLogId    | unknown ID への空配列返却 |
| 8   | setGithubPat stores the PAT in memory                 | PAT 保存                  |
| 9   | setGithubPat can be cleared with null                 | PAT クリア                |
| 10  | setAiProviderConfig stores config in memory           | AI プロバイダー設定保存   |

---

### 3-7. `voice-store.ts` ✅
**ファイル**: `src/features/timer/stores/__tests__/voice-store.test.ts`

| #     | テスト名             | 検証内容                                                  |
| ----- | -------------------- | --------------------------------------------------------- |
| 1     | 初期状態が正しい     | isSupported/isListening/language/etc の初期値             |
| 2–4   | startListening       | isListening=true・error クリア・currentAgendaId セット    |
| 5–6   | stopListening        | isListening=false・interimTranscript クリア               |
| 7–8   | setLanguage          | en-US ↔ ja-JP 切り替え                                    |
| 9–10  | setInterimTranscript | テキスト更新・空クリア                                    |
| 11–13 | addConfirmedEntry    | エントリ追加・複数追加・追加後の interimTranscript クリア |
| 14    | clearTranscript      | confirmedEntries + interimTranscript クリア               |
| 15–19 | setError             | 各エラー種別セット・null クリア                           |
| 20–21 | setIsSupported       | true/false 切り替え                                       |
| 22–23 | setIsListening       | 直接セット                                                |

---

### 3-8. `meeting-report-store.ts` ❌
テストなし。

### 3-9. `new-agenda-timer-store.ts` ❌
テストなし。

---

## 4. API (`src/features/timer/api/`)

### 4-1. `github-issues.ts` ✅
**ファイル**: `src/features/timer/api/__tests__/github-issues.test.ts`

| #   | テスト名                                       | 検証内容                           |
| --- | ---------------------------------------------- | ---------------------------------- |
| 1   | GitHub API から title と html_url を取得できる | 正常系 fetch・レスポンスマッピング |
| 2   | PAT 指定時は Authorization ヘッダーを付与する  | Bearer トークン付与                |
| 3   | 404 の場合はわかりやすいエラーを返す           | Issue not found エラー文言         |
| 4   | 401/403 の場合は認証エラーを返す               | 認証失敗エラー文言                 |
| 5   | Issue コメントを投稿できる                     | POST /comments 正常系              |
| 6   | 投稿先が見つからない場合はエラーを返す         | コメント 404 エラー                |

---

## 5. サービス (`src/features/timer/services/`)

### 5-1. `analytics.ts` ✅
**ファイル**: `src/features/timer/services/__tests__/analytics.test.ts`

| #     | テスト名            | 検証内容                                                                    |
| ----- | ------------------- | --------------------------------------------------------------------------- |
| 1–2   | empty data          | 空データ時の KPI・trend・heatmap・donut                                     |
| 3–6   | basic timer history | focusMinutes 集計・日付範囲除外・timerKind=basic フィルタ・donut セグメント |
| 7–9   | pomodoro sessions   | work フェーズのみ集計・達成率計算・0% ケース                                |
| 10–12 | agenda meetings     | overtimeRate 計算・範囲外除外・startTime なし除外                           |
| 13–16 | trend aggregation   | 日次 7 点・ラベル正確性・週次ラベル・月次ラベル                             |
| 17–18 | heatmap             | weekday/hour への割り当て・同 slot への累積                                 |
| 19–21 | donut               | 複数セグメント・0 分セグメント除外・multiCategoryMap                        |
| 22–24 | timerKind filter    | pomodoro のみ・agenda 込み all-view・all-view 総計                          |

---

### 5-2. `meeting-ai-assist-service.ts` ✅
**ファイル**: `src/features/timer/services/__tests__/meeting-ai-assist-service.test.ts` / `summarize-voice-transcript.test.ts`

| #   | テスト名                                                             | 検証内容                        |
| --- | -------------------------------------------------------------------- | ------------------------------- |
| 1   | config=null 時ルールベースフォールバック (`generateMeetingAiAssist`) | usedFallback=true・summary 生成 |
| 2   | config 不正時ルールベースフォールバック                              | consensusAssist 生成            |
| 3–4 | config=null/不正時フォールバック (`summarizeVoiceTranscript`)        | 原文返却                        |
| 5   | entries 空のとき summary は空文字                                    | 空エントリー                    |
| 6   | ChatOpenAI モック正常系                                              | summary 返却フロー              |
| 7   | ChatOpenAI 例外時フォールバック                                      | usedFallback=true・原文返却     |
| 8   | ChatAnthropic 例外時フォールバック                                   | usedFallback=true・原文返却     |

---

### 5-3. `voice-recognition-service.ts` ✅
**ファイル**: `src/features/timer/services/__tests__/voice-recognition-service.test.ts`

| #     | テスト名          | 検証内容                                                                      |
| ----- | ----------------- | ----------------------------------------------------------------------------- |
| 1–3   | isSupported()     | SpeechRecognition あり/なし/webkit 代替                                       |
| 4–6   | start()           | インスタンス生成・lang/continuous/interimResults セット・未サポート時 onError |
| 7–8   | stop()            | stop() 呼び出し・onend 後 onStopped 呼び出し                                  |
| 9–11  | onresult ハンドラ | 最終結果 onConfirmed・中間結果 onInterim・空文字トリム後スキップ              |
| 12–15 | onerror ハンドラ  | not-allowed/network/aborted/no-speech の各分岐                                |
| 16–17 | onend ハンドラ    | stop 後の onStopped・interimTranscript クリア                                 |
| 18    | setLanguage()     | 認識中の言語変更                                                              |

---

## 6. フック (`src/features/timer/hooks/`)

### 6-1. `useVoiceRecognition.ts` ✅
**ファイル**: `src/features/timer/hooks/__tests__/useVoiceRecognition.test.ts`

| #     | テスト名                      | 検証内容                                                                                         |
| ----- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| 1–2   | マウント時の isSupported 取得 | true/false 両ケース                                                                              |
| 3–7   | start()                       | service.start 呼び出し・isListening=true・未サポート onError・onConfirmed→store・onInterim→store |
| 8     | start() onError コールバック  | error セット・isListening=false                                                                  |
| 9–10  | stop()                        | service.stop 呼び出し・isListening=false                                                         |
| 11    | setLanguage()                 | store 更新・service.setLanguage()                                                                |
| 12    | clearTranscript()             | confirmedEntries/interimTranscript クリア                                                        |
| 13–14 | アンマウント時の自動停止      | isListening=true/false 両ケース                                                                  |

---

## 7. ユーティリティ (`src/features/timer/utils/`)

### 7-1. `ai-provider-config.ts` ✅
**ファイル**: `src/features/timer/utils/__tests__/ai-provider-config.test.ts`

| #   | テスト名                     | 検証内容             |
| --- | ---------------------------- | -------------------- |
| 1   | 有効な設定を受け入れる       | valid=true           |
| 2   | 必須項目不足を検出する       | model 空エラー       |
| 3   | temperature 範囲外を検出する | 2.5 のバリデーション |

---

### 7-2. `github-issue-agenda-parser.ts` ✅
**ファイル**: `src/features/timer/utils/__tests__/github-issue-agenda-parser.test.ts`

| #   | テスト名                                                        | 検証内容                   |
| --- | --------------------------------------------------------------- | -------------------------- |
| 1   | Agenda セクション配下を優先して抽出する                         | 所要時間パース             |
| 2   | Agenda セクションがない場合はチェックリストと箇条書きを抽出する | フォールバック抽出         |
| 3   | チェックリストから担当者と期限を抽出する                        | @xxx / 期限: / due: パース |

---

### 7-3. `integration-stats.ts` ✅
**ファイル**: `src/features/timer/utils/__tests__/integration-stats.test.ts`

| #   | テスト名                                                | 検証内容               |
| --- | ------------------------------------------------------- | ---------------------- |
| 1   | Issue ごとに actualDuration を集計できる                | 正常集計               |
| 2   | 同一履歴内の重複リンクを二重集計しない                  | 重複排除               |
| 3   | タイトル未設定の場合は owner/repo#number を表示名に使う | タイトルフォールバック |

---

### 7-4. `meeting-ai-assist.ts` ✅
**ファイル**: `src/features/timer/utils/__tests__/meeting-ai-assist.test.ts`

| #   | テスト名                                                   | 検証内容                 |
| --- | ---------------------------------------------------------- | ------------------------ |
| 1   | 要約・合意形成・進行・アジェンダ・事前準備の提案を生成する | 全出力フィールド存在確認 |

---

### 7-5. `meeting-report-post-template.ts` ✅
**ファイル**: `src/features/timer/utils/__tests__/meeting-report-post-template.test.ts`

| #   | テスト名                             | 検証内容              |
| --- | ------------------------------------ | --------------------- |
| 1   | summary テンプレートを生成できる     | 見出し・ToDo 含有確認 |
| 2   | detailed + diffOnly で差分行のみ返す | 差分抽出ロジック      |

---

## 8. コンポーネント (`src/features/timer/components/`)

### 8-1. `agenda/agenda-minutes-quill.ts` ✅
**ファイル**: `src/features/timer/components/agenda/__tests__/agenda-minutes-quill.test.ts`

| #   | テスト名                           | 検証内容         |
| --- | ---------------------------------- | ---------------- |
| 1   | モバイル向けの簡易ツールバーを返す | toolbar 配列一致 |
| 2   | PC 向けの詳細ツールバーを返す      | toolbar 配列一致 |

---

### 8-2. `dashboard/DashboardView.tsx` ✅
**ファイル**: `src/features/timer/components/dashboard/__tests__/DashboardView.test.tsx`

| #   | テスト名                                                   | 検証内容                                       |
| --- | ---------------------------------------------------------- | ---------------------------------------------- |
| 1   | renders KPI values                                         | 集中時間・完了セッション・達成率・超過率の表示 |
| 2   | shows filter bar with date-range buttons                   | 直近 7/30/90 日ボタン表示                      |
| 3   | calls onSetDateRange when a range button is clicked        | 7 日ボタンの日付差検証                         |
| 4   | calls onExportCsv when CSV button is clicked               | CSV エクスポート呼び出し                       |
| 5   | calls onSetGranularity when granularity select changes     | week へ変更時のコールバック                    |
| 6   | calls onSetTimerKind when kind select changes              | pomodoro 選択のコールバック                    |
| 7   | calls onSetTimerKind with undefined when "all" is selected | all 選択時 undefined 渡し                      |
| 8   | displays completion rate derived from kpi                  | 完了率 75% 表示                                |
| 9   | shows 0分 for focusMinutes when result is zero             | ゼロ表示                                       |

---

### 8-3. `voice/VoiceRecognitionButton.tsx` ✅
**ファイル**: `src/features/timer/components/voice/__tests__/VoiceRecognitionButton.test.tsx`

| #    | テスト名                                        | 検証内容                              |
| ---- | ----------------------------------------------- | ------------------------------------- |
| 1    | isSupported=true のとき録音ボタンが enabled     | 有効状態                              |
| 2    | isSupported=false のとき録音ボタンが disabled   | 無効状態                              |
| 3    | isListening=true のとき「停止」が表示される     | destructive variant                   |
| 4    | isListening=false のとき「録音」が表示される    | outline variant                       |
| 5    | ボタンクリック時（停止中）に start() が呼ばれる | agendaId 渡し                         |
| 6    | ボタンクリック時（録音中）に stop() が呼ばれる  | stop 呼び出し                         |
| 7    | isListening=true のとき赤バッジが表示される     | バッジ存在確認                        |
| 8    | isListening=false のとき赤バッジが表示されない  | バッジ非表示確認                      |
| 9–11 | error 各種メッセージ表示                        | permission-denied / network / aborted |
| 12   | 言語セレクトの変更で setLanguage() が呼ばれる   | en-US 選択                            |
| 13   | isListening=true のとき言語セレクトが disabled  | 録音中は変更不可                      |

---

### 8-4. `voice/VoiceTranscriptPanel.tsx` ✅
**ファイル**: `src/features/timer/components/voice/__tests__/VoiceTranscriptPanel.test.tsx`

| #   | テスト名                                                                     | 検証内容                     |
| --- | ---------------------------------------------------------------------------- | ---------------------------- |
| 1   | 初期状態はパネルが折りたたまれている                                         | 本文非表示                   |
| 2   | ヘッダークリックでパネルが開く                                               | 展開後のプレースホルダー表示 |
| 3   | isListening=true のとき「録音中」バッジが表示される                          | バッジ表示                   |
| 4   | isListening=true のときパネルが自動展開される                                | 自動展開                     |
| 5   | confirmedEntries がある場合件数が表示される                                  | 2件 表示                     |
| 6   | パネルを開いたとき confirmedEntries のテキストが表示される                   | テキスト表示                 |
| 7   | interimTranscript が表示される                                               | リアルタイム表示             |
| 8   | minutesFormat=markdown のとき「議事録に追加」ボタンが表示される              | ボタン存在確認               |
| 9   | minutesFormat=richtext のとき「AI 要約して議事録に追加」ボタンが表示される   | ボタン存在確認               |
| 10  | confirmedEntries がないとき「議事録に追加」ボタンが disabled                 | disabled 確認                |
| 11  | markdown 形式で「議事録に追加」クリックすると updateAgendaMinutes が呼ばれる | 本文追記                     |
| 12  | richtext 形式で「AI 要約」クリックすると onRequestSummaryDialog が呼ばれる   | ダイアログ要求               |
| 13  | クリアボタンをクリックすると clearTranscript が呼ばれる                      | トランスクリプトクリア       |
| 14  | Enter キーでもパネルを開閉できる                                             | keyboard アクセシビリティ    |

---

### 8-5. `voice/VoiceTranscriptSummaryDialog.tsx` ✅
**ファイル**: `src/features/timer/components/voice/__tests__/VoiceTranscriptSummaryDialog.test.tsx`

| #   | テスト名                                                              | 検証内容           |
| --- | --------------------------------------------------------------------- | ------------------ |
| 1   | isOpen=false のときダイアログが表示されない                           | 非表示確認         |
| 2   | isOpen=true のときダイアログが表示される                              | 表示確認           |
| 3   | isEmpty のとき「文字起こしデータがありません」が表示される            | 空状態             |
| 4   | confirmedEntries があるとき原文テキストが表示される                   | 原文表示           |
| 5   | ダイアログ表示時に自動で summarizeVoiceTranscript が呼ばれる          | 自動要約起動       |
| 6   | AI 要約結果が textarea に表示される                                   | 要約テキスト反映   |
| 7   | usedFallback=true のとき AI 未構成の注記が表示される                  | フォールバック注記 |
| 8   | 「Quill に挿入して確定」ボタンクリックで editor.insertText が呼ばれる | 挿入処理           |
| 9   | 挿入後に clearTranscript / onInserted / onClose が呼ばれる            | 後処理連鎖         |
| 10  | summaryText が空のとき「Quill に挿入して確定」ボタンが disabled       | 挿入無効化         |
| 11  | 「キャンセル」ボタンクリックで onClose が呼ばれる                     | キャンセル処理     |
| 12  | 「再生成」ボタンクリックで summarizeVoiceTranscript が再度呼ばれる    | 再生成フロー       |

---

### 8-6. `task-list/TaskWidgetCanvas.tsx` ❌ （旧 `AgendaTimerView.tsx` を統合）
### 8-7. `agenda/MeetingReportDialog.tsx` ❌
### 8-8. `agenda/MeetingReportHistory.tsx` ❌
### 8-9. `basic-timer/BasicTimerView.tsx` ❌
### 8-10. `pomodoro/EnhancedPomodoroTimerView.tsx` ❌
### 8-11. `multi-timer/MultiTimerView.tsx` ❌

---

## 9. コンテナ (`src/features/timer/containers/`)

### ❌ 全コンテナ未テスト
- `BasicTimer.tsx`
- `EnhancedPomodoroTimer.tsx`
- `MultiTimer.tsx`

> **注**: `AgendaTimer.tsx`, `Dashboard.tsx`, `UnifiedTimer.tsx` は削除済み。タスクベース UI に統合。

---

## テストカバレッジ サマリー

| 領域                    | テスト済み      | 未テスト        | カバレッジ（感覚値） |
| ----------------------- | --------------- | --------------- | -------------------- |
| ユーティリティ (utils/) | 2/3             | 1               | ~67%                 |
| 共通コンポーネント      | 1/7             | 6               | ~14%                 |
| Zustand ストア          | 7/9             | 2               | ~78%                 |
| API                     | 1/1             | 0               | 100%                 |
| サービス                | 3/3             | 0               | 100%                 |
| フック                  | 1/1             | 0               | 100%                 |
| timer/utils             | 5/5             | 0               | 100%                 |
| timer/components        | 5/9             | 4               | ~56%                 |
| コンテナ                | 0/6             | 6               | 0%                   |
| **合計**                | **25 ファイル** | **19 ファイル** | **≈ 57%**            |
