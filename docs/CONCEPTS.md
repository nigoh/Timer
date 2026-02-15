# CONCEPTS

## ドメイン概念
- 基本タイマー: 単一セッションの集中管理
- ポモドーロ: フェーズ遷移型の集中管理
- アジェンダタイマー: 会議議題の時間進行管理
- 複数タイマー: 並行タスクの個別時間管理
- 会議レポート: 会議結果の構造化記録

## 共通概念
- Session: タイマー実行単位
- Duration: 予定時間（秒）
- Remaining Time: 残時間（秒）
- Completed: 完了状態
- Overtime: 予定時間超過状態

## 横断関心
- Notification: 音・ブラウザ通知・バイブレーション
- Logging: LocalStorage ベースの監査ログ
- Persistence: Zustand persist による状態保存
