---
applyTo: '**'
---

# レイアウト統一ルール

各機能画面のレイアウトは以下のルールに従って実装してください。

## 🎯 基本方針

### 統一されたレイアウト構造
すべての機能ページは共通レイアウトコンポーネントを使用し、一貫性のあるユーザー体験を提供します。

## 📐 共通レイアウトコンポーネント

### 1. FeatureLayout（必須）
```tsx
import { FeatureLayout } from '../../components/layout';

<FeatureLayout maxWidth={false}>
  {/* コンテンツ */}
</FeatureLayout>
```

**設定項目:**
- `maxWidth`: 画面全体に表示する場合は`false`、制限する場合は`"xl"`等を指定
- `showHeader`: ヘッダー表示の有無（デフォルト: false）
- `title`: ページタイトル
- `headerContent`: カスタムヘッダーコンテンツ

### 2. FeatureHeader（推奨）
```tsx
import { FeatureHeader } from '../../components/layout';

<FeatureHeader
  title="機能名"
  subtitle="機能の説明文"
  onAdd={handleCreate}
  addButtonText="新規作成"
  actions={customActions}
  buttons={[
    {
      text: "エクスポート",
      onClick: handleExport,
      variant: "outlined",
      icon: <DownloadIcon />
    },
    {
      text: "削除",
      onClick: handleDelete,
      variant: "outlined",
      color: "error",
      icon: <DeleteIcon />
    }
  ]}
/>
```

**設定項目:**
- `title`: 機能名（必須）
- `subtitle`: 機能説明（推奨）
- `onAdd`: 新規作成ハンドラー
- `addButtonText`: 作成ボタンテキスト
- `actions`: カスタムアクション（検索フィールド等）
- `buttons`: ボタン群の配列（テキスト、アクション、スタイル指定）
- `showAddButton`: 作成ボタン表示制御

### 3. FeatureContent（推奨）
```tsx
import { FeatureContent } from '../../components/layout';

<FeatureContent variant="transparent" padding={0}>
  {/* メインコンテンツ */}
</FeatureContent>
```

**設定項目:**
- `variant`: `"paper"` | `"transparent"`
- `padding`: パディング値（デザイントークン使用）
- `elevation`: 影の深さ（paperの場合）

## 📱 レスポンシブ設計ルール

### ブレークポイント統一
```tsx
// パディング設定
px: { xs: 1, sm: 2, md: 3 }

// マージン設定  
py: spacingTokens.md

// 幅設定
width: { xs: '100%', sm: 'auto', md: 'fit-content' }
```

### コンテナ幅の統一
- **フル幅表示**: `maxWidth={false}` で画面全体を活用
- **制限幅表示**: `maxWidth="xl"` (1536px) で適度な幅制限
- **タブレット**: 自動調整
- **モバイル**: 全幅（適切なパディング付き）

## 🎨 スタイリングルール

### デザイントークンの使用（必須）
```tsx
import { spacingTokens, shapeTokens } from '../../theme/designSystem';

// 間隔
py: spacingTokens.md  // 16px
px: spacingTokens.lg  // 24px

// 角丸
borderRadius: shapeTokens.corner.medium  // 12px
```

### 色とテーマ
```tsx
// テーマの適切な使用
const theme = useTheme();
backgroundColor: theme.palette.background.paper
color: theme.palette.text.primary
```

## 🔄 スクロール管理

### 統一されたスクロール設定
```tsx
// FeatureLayoutが自動で以下を適用
sx={{
  overflow: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.action.hover,
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.action.selected,
    borderRadius: '4px',
  },
}}
```

## 📋 実装パターン

### パターン1: 標準的な管理画面
```tsx
const FeaturePage: React.FC = () => {
  const { openCreateDialog } = useFeatureForm();

  return (
    <FeatureLayout maxWidth={false}>
      <FeatureHeader
        title="機能名"
        subtitle="機能の説明"
        onAdd={openCreateDialog}
        addButtonText="新規作成"
      />
      <FeatureContent variant="transparent" padding={0}>
        <EnhancedFeatureList />
      </FeatureContent>
    </FeatureLayout>
  );
};
```

### パターン2: カスタムアクション付き
```tsx
const FeaturePage: React.FC = () => {
  const [month, setMonth] = useState('2025-01');

  const headerActions = (
    <TextField
      type="month"
      value={month}
      onChange={(e) => setMonth(e.target.value)}
      size="small"
    />
  );

  return (
    <FeatureLayout maxWidth={false}>
      <FeatureHeader
        title="機能名"
        subtitle="機能の説明"
        actions={headerActions}
        showAddButton={false}
      />
      <FeatureContent variant="transparent" padding={0}>
        {/* コンテンツ */}
      </FeatureContent>
    </FeatureLayout>
  );
};
```

### パターン4: 複数ボタン付きヘッダー
```tsx
const FeaturePage: React.FC = () => {
  const handleExport = () => { /* エクスポート処理 */ };
  const handleImport = () => { /* インポート処理 */ };
  const handleBulkDelete = () => { /* 一括削除処理 */ };

  const actionButtons = [
    {
      text: "CSVエクスポート",
      onClick: handleExport,
      variant: "outlined" as const,
      icon: <DownloadIcon />
    },
    {
      text: "インポート",
      onClick: handleImport,
      variant: "outlined" as const,
      icon: <UploadIcon />
    },
    {
      text: "一括削除",
      onClick: handleBulkDelete,
      variant: "outlined" as const,
      color: "error" as const,
      icon: <DeleteIcon />
    }
  ];

  return (
    <FeatureLayout maxWidth={false}>
      <FeatureHeader
        title="機能名"
        subtitle="機能の説明"
        buttons={actionButtons}
        showAddButton={false}
      />
      <FeatureContent variant="transparent" padding={0}>
        {/* コンテンツ */}
      </FeatureContent>
    </FeatureLayout>
  );
};
```

## ❌ 禁止事項

### レイアウト関連
- `Container`の直接使用（FeatureLayoutを使用）
- `height: '100vh'`の直接指定
- 独自のスクロール実装
- 異なる`maxWidth`設定

### スタイリング関連
- ハードコードされたサイズ値
- インラインスタイル（`style`属性）
- テーマを使用しない色指定
- レスポンシブ対応の省略

### コンポーネント関連
- 100行を超えるコンポーネント
- ベースレイアウトの重複実装
- 非統一のヘッダー構造

## ✅ チェックリスト

新機能実装時の確認項目：

### レイアウト構造
- [ ] FeatureLayoutを使用している
- [ ] maxWidth={false}を設定している
- [ ] 適切なヘッダーコンポーネントを使用している
- [ ] レスポンシブ対応を実装している

### スタイリング
- [ ] デザイントークンを使用している
- [ ] テーマカラーを適切に使用している
- [ ] 統一されたスクロール実装
- [ ] アクセシビリティを考慮している

### コンポーネント設計
- [ ] 100行以内のコンポーネント分割
- [ ] 適切なprops設計
- [ ] TypeScript型定義の完備
- [ ] エラーハンドリングの実装

## 🔗 関連ファイル

### レイアウトコンポーネント
- `src/components/layout/FeatureLayout.tsx`
- `src/components/layout/FeatureHeader.tsx`
- `src/components/layout/FeatureContent.tsx`

### デザインシステム
- `src/theme/designSystem.ts`
- `src/theme/componentStyles.ts`

### 参考実装
- `src/features/teamManagement/TeamManagement.tsx`
- `src/features/employeeRegister/EmployeeRegister.tsx`
- `src/features/timecard/Timecard.tsx`

このルールに従うことで、統一感のある高品質なユーザーインターフェースを効率的に開発できます。