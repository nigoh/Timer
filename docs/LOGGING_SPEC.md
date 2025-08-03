# ログシステム仕様書

## 概要

タイマーアプリケーションに統合された包括的ログシステムです。開発・デバッグ・運用時のトラブルシューティングを支援し、ユーザー体験の向上とシステム品質の維持を目的としています。

## 🏗️ システム構成

### 1. コアログライブラリ (`src/utils/logger.ts`)

**レベル別ログ管理**
- `ERROR` (0): システムエラー・例外・失敗
- `WARN` (1): 警告・注意が必要な状況
- `INFO` (2): 一般的な情報・操作記録
- `DEBUG` (3): デバッグ情報・開発支援
- `TRACE` (4): 詳細なトレース情報

**カテゴリ別分類**
- `timer`: タイマー関連の操作・状態変更
- `ui`: ユーザーインターフェース・ユーザーアクション
- `store`: Zustand状態管理・データ変更
- `notification`: 通知・ベル音・アラート
- `error`: エラー・例外・失敗
- `performance`: パフォーマンス・計測・最適化
- `api`: API呼び出し・外部連携
- `app`: アプリケーション全体・ライフサイクル

### 2. ログビューアー (`src/components/LogViewer.tsx`)

**機能**
- リアルタイムログ表示
- レベル・カテゴリ別フィルタリング
- 全文検索機能
- 統計情報表示
- CSVエクスポート
- ログクリア機能

**UI構成**
- ダイアログベースの表示
- タブ切り替え（ログ一覧・統計情報）
- レスポンシブ対応

### 3. エラーバウンダリー (`src/components/ErrorBoundary.tsx`)

**機能**
- React エラーの自動キャッチ
- エラー詳細の自動ログ記録
- ユーザー向けエラー画面表示
- 復旧オプション提供

### 4. パフォーマンス監視フック (`src/hooks/useLogging.ts`)

**提供フック**
- `usePerformanceMonitor`: コンポーネントレンダリング監視
- `useErrorLogger`: エラーログ記録
- `useUserActionLogger`: ユーザーアクション追跡
- `useApiLogger`: API呼び出し監視
- `useMemoryMonitor`: メモリ使用量監視

## 📊 ログエントリ構造

```typescript
interface LogEntry {
  id: string;              // 一意識別子
  timestamp: Date;         // 記録時刻
  level: LogLevel;         // ログレベル
  category: string;        // カテゴリ
  message: string;         // メッセージ
  data?: any;             // 関連データ
  stackTrace?: string;     // スタックトレース（エラー時）
  userAgent?: string;      // ブラウザ情報
  url?: string;           // URL
  userId?: string;        // ユーザーID（将来拡張）
  sessionId: string;      // セッション識別子
}
```

## 🎯 使用方法

### 1. 基本的なログ記録

```typescript
import { logger } from '@/utils/logger';

// レベル別ログ
logger.error('エラーメッセージ', { エラー詳細 });
logger.warn('警告メッセージ', { 警告詳細 });
logger.info('情報メッセージ', { 情報詳細 });
logger.debug('デバッグメッセージ', { デバッグ詳細 });
logger.trace('トレースメッセージ', { トレース詳細 });

// カテゴリ指定
logger.info('タイマー開始', { timerId: 'timer1' }, 'timer');
logger.userAction('ボタンクリック', { buttonId: 'start' });
```

### 2. タイマー特化ログ

```typescript
// タイマー操作ログ
logger.timerStart('timer1', 'pomodoro', 1500);
logger.timerStop('timer1', 'pomodoro', 1200);
logger.timerComplete('timer1', 'pomodoro', 1500);

// 状態変更ログ
logger.stateChange('pomodoroStore', { 前の状態 }, { 新しい状態 });

// 通知ログ
logger.notification('bell', '作業終了', true);

// パフォーマンスログ
logger.performance('レンダリング', 16.5, { component: 'Timer' });
```

### 3. フック使用例

```typescript
import { usePerformanceMonitor, useUserActionLogger } from '@/hooks/useLogging';

const MyComponent = () => {
  // パフォーマンス監視
  const { measureOperation } = usePerformanceMonitor('MyComponent');

  // ユーザーアクション監視
  const { logClick, logSubmit } = useUserActionLogger('MyComponent');

  const handleClick = () => {
    logClick('submit-button', { formValid: true });
    
    // 重い処理の測定
    measureOperation('data-processing', () => {
      // 重い処理
    });
  };

  return (
    <button onClick={handleClick}>
      送信
    </button>
  );
};
```

### 4. エラーバウンダリー使用例

```typescript
import ErrorBoundary from '@/components/ErrorBoundary';

const App = () => (
  <ErrorBoundary componentName="MainApp">
    <MyComponent />
  </ErrorBoundary>
);
```

## 🔧 設定・カスタマイズ

### 1. ログレベル設定

```typescript
// 本番環境ではINFO以上のみ
logger.updateConfig({
  level: LogLevel.INFO,
  enableConsole: false,
  maxStorageEntries: 500
});
```

### 2. カテゴリ追加

```typescript
logger.updateConfig({
  categories: [...defaultCategories, 'custom-category']
});
```

### 3. ストレージ設定

```typescript
logger.updateConfig({
  enableStorage: true,
  maxStorageEntries: 2000  // 最大保存数
});
```

## 📈 統計・分析機能

### 1. 基本統計

```typescript
const stats = logger.getLogStatistics();
// {
//   totalLogs: 1500,
//   logsByLevel: { ERROR: 5, WARN: 20, INFO: 800, ... },
//   logsByCategory: { timer: 400, ui: 300, store: 200, ... },
//   sessionCount: 5,
//   oldestLog: Date,
//   newestLog: Date
// }
```

### 2. フィルタリング・検索

```typescript
// カテゴリ別取得
const timerLogs = logger.getLogsByCategory('timer');

// レベル別取得
const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);

// 期間別取得
const todayLogs = logger.getLogsByDateRange(
  new Date('2025-01-01'),
  new Date('2025-01-02')
);
```

### 3. エクスポート機能

```typescript
// JSON形式でエクスポート
const logsJson = logger.exportLogs();

// ダウンロード
const blob = new Blob([logsJson], { type: 'application/json' });
// ... ダウンロード処理
```

## 🚀 パフォーマンス最適化

### 1. 自動クリーンアップ

- 最大保存数に達すると古いログを自動削除
- セッション終了時の自動クリーンアップ
- メモリ使用量監視による最適化

### 2. 非同期処理

- ログ記録は非同期で実行
- UI ブロッキングなし
- バックグラウンド処理

### 3. 環境別最適化

- 開発環境: 全レベル有効、詳細ログ
- 本番環境: INFO以上のみ、最適化されたストレージ

## 🛡️ セキュリティ・プライバシー

### 1. データ保護

- 機密情報の自動マスキング
- パスワード・トークンの除外
- 個人情報の適切な処理

### 2. ローカルストレージのみ

- 外部送信なし
- ブラウザローカルでの完結
- ユーザー制御によるデータ管理

### 3. GDPR対応

- ユーザーによるログ削除機能
- データエクスポート機能
- 明確なプライバシーポリシー

## 🔍 トラブルシューティング

### 1. よくある問題

**ログが表示されない**
- ブラウザコンソールでエラー確認
- ログレベル設定の確認
- ローカルストレージの容量確認

**パフォーマンスの低下**
- ログレベルを INFO 以上に制限
- 最大保存数を削減
- 不要なカテゴリを無効化

### 2. デバッグ支援

```typescript
// 開発環境でのデバッグ
if (process.env.NODE_ENV === 'development') {
  window.logger = logger;  // グローバルアクセス
  
  // ログ詳細表示
  logger.debug('Debug info', { detail: 'debugging' });
}
```

### 3. ログ分析

- エラーログの優先確認
- パフォーマンスボトルネックの特定
- ユーザー行動パターンの分析

## 📚 今後の拡張予定

### Phase 3: 高度な分析機能

- ダッシュボード形式の統計表示
- グラフ・チャートによる可視化
- 傾向分析・予測機能

### Phase 4: 外部連携

- ログ管理サービス連携
- アラート・通知機能
- 自動レポート生成

---

このログシステムにより、タイマーアプリケーションの品質向上、問題の早期発見、ユーザー体験の継続的改善が実現されます。
