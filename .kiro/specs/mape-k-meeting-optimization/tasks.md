# 実装計画: MAPE-K 会議効率化（アジェンダ自律最適化）

## P0（逐次ゲート — 後続タスクの前提）

- [x] 1. ドメイン型定義
- [x] 1.1 `src/types/meetingOptimization.ts` に MeetingRecord, AgendaRecord, MeetingInsight, LearnedPattern, Suggestion, KnowledgeSettings 型を定義
  - MeetingRecord: meetingId, title, agendaRecords, totalPlannedDuration, totalActualDuration, completedAt, suggestionApplied
  - AgendaRecord: agendaId, title, plannedDuration, actualDuration, wasOvertime, overtimeAmount
  - MeetingInsight: type, description, confidence, data
  - LearnedPattern: id, titlePattern, avgPlannedDuration, avgActualDuration, avgOvertimeRate, sampleCount, updatedAt
  - Suggestion: id, agendaId, type, currentValue, suggestedValue, reason, confidence, basedOnCount
  - KnowledgeSettings: enabled, learningWindow, movingAverageWindow, suggestionThreshold
  - _Requirements: 1, 2, 3, 5_
- [x] 1.2 MeetingKnowledgeState / MeetingKnowledgeActions interface を定義
  - State: records, learnedPatterns, settings
  - Actions: addMeetingRecord, getRecords, getPatterns, updateSettings, resetKnowledge
  - _Requirements: 1, 5_

## P1（並列実行可）

- [x] 2. Knowledge Store 実装 (P)
- [x] 2.1 `src/features/timer/stores/meeting-knowledge-store.ts` を作成
  - Zustand create + persist で MeetingKnowledgeState を管理
  - addMeetingRecord: Meeting 型 → MeetingRecord 変換 + 100 件制限ロジック
  - resetKnowledge: records, learnedPatterns をクリア
  - partialize: records, learnedPatterns, settings のみ永続化
  - _Requirements: 1, 5_
- [x] 2.2 会議完了時の自動記録フック
  - agenda-timer-store の completeMeeting アクション内から meeting-knowledge-store.addMeetingRecord を呼び出す
  - logger.ts でログ出力（「会議記録を Knowledge Store に追加: {meetingTitle}」）
  - _Requirements: 1_

- [x] 3. Meeting Optimization Service 実装 (P)
- [x] 3.1 `src/features/timer/services/meeting-optimization-service.ts` を作成
  - analyze 関数: MeetingRecord[] → MeetingInsight[] を生成
  - 超過率計算: (actualDuration - plannedDuration) / plannedDuration
  - 移動平均: 直近 N 件（デフォルト 5）の全体超過率
  - _Requirements: 2_
- [x] 3.2 パターンマッチングロジック
  - 議題タイトルを正規化（トリム、小文字化、番号除去）してグルーピング
  - LearnedPattern の avgOvertimeRate を更新
  - _Requirements: 2_
- [x] 3.3 提案生成ロジック
  - generateSuggestions 関数: MeetingInsight[] + AgendaItem[] + LearnedPattern[] → Suggestion[]
  - 生成条件: avgOvertimeRate >= suggestionThreshold（デフォルト 0.2）
  - suggestedValue = avgActualDuration * 1.1（実績 110%）
  - confidence = min(1, sampleCount / learningWindow)
  - 最低 3 件のデータがないと提案なし
  - _Requirements: 3_
- [x] 3.4 公開 API: getSuggestionsForAgenda 関数
  - Knowledge Store からデータを取得し、analyze → generateSuggestions を実行
  - _Requirements: 2, 3_

## P2（P1 完了後 — 並列実行可）

- [x] 4. UI コンポーネント実装
- [x] 4.1 `src/features/timer/components/agenda/SuggestionBadge.tsx` を作成 (P)
  - props: suggestion: Suggestion | null
  - 提案あり: オレンジバッジ + SimpleTooltip で概要表示
  - クリックで SuggestionDialog を開く
  - _Requirements: 3, 4_
- [x] 4.2 `src/features/timer/components/agenda/SuggestionDialog.tsx` を作成 (P)
  - Radix Dialog で提案詳細を表示
  - 表示: 現在値 → 提案値、根拠、信頼度、データ件数
  - 「適用」ボタン: agenda-timer-store.updateAgendaDuration 呼び出し
  - 「却下」ボタン: フィードバック記録 + ダイアログ閉じ
  - _Requirements: 4_
- [x] 4.3 AgendaView への SuggestionBadge 統合
  - アジェンダ項目リストの各行に SuggestionBadge を配置
  - meeting-optimization-service.getSuggestionsForAgenda を呼び出し
  - 3 件未満の場合は「データ収集中」ツールチップのみ表示
  - _Requirements: 3, 4_
- [x] 4.4 MAPE-K 設定パネル (P)
  - 提案表示 ON/OFF スイッチ
  - 学習期間（件数）スライダー
  - 学習データリセットボタン（確認ダイアログ付き）
  - 設定画面（SettingsAndLogsPage）に統合
  - _Requirements: 5_

## P3（P2 完了後）

- [x] 5. 統合テストとドキュメント
- [x] 5.1 ユニットテスト作成
  - meeting-optimization-service: 超過率計算、移動平均、提案生成ロジック
  - meeting-knowledge-store: CRUD、100 件制限、リセット
  - エッジケース: 0 件、全超過なし、全超過
  - _Requirements: 1, 2, 3, 5_
- [x] 5.2 統合テスト作成
  - 会議完了→Monitor→Knowledge 記録フロー
  - 提案表示→承認→予定時間更新フロー
  - _Requirements: 1, 4_
- [x] 5.3 ドキュメント更新
  - docs/REQUIREMENTS.md に RQ-08 MAPE-K 会議効率化を追加
  - docs/FEATURES.md に機能追加
  - docs/TECHNICAL_SPECS.md にアーキテクチャ追記
  - _Requirements: 1, 2, 3, 4, 5_
- [x] 5.4 品質ゲート実行
  - npm run type-check
  - npm run test:run
  - npm run build
  - _Requirements: 1, 2, 3, 4, 5_
