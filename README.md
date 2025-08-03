# タイマーアプリケーション

業務効率化を目的とした多機能タイマーアプリケーション。ポモドーロテクニック、作業時間管理、チーム協業を支援する統合型タイマーシステムです。

## 🚀 機能概要

### Core機能
- **基本タイマー**: カウントダウン/カウントアップタイマー
- **ポモドーロタイマー**: 25分作業 + 5分休憩の自動サイクル
- **複数タイマー**: 最大10個のタイマー同時実行
- **作業記録**: セッション記録・統計・分析機能
- **通知システム**: 音声・ブラウザ通知・バイブレーション

### Advanced機能
- **チーム協業**: メンバー間でのタイマー共有
- **目標管理**: 時間目標設定・達成度追跡
- **詳細分析**: プロジェクト別・時間帯別分析
- **データ連携**: CSV・PDFエクスポート、外部ツール連携

## 🛠 技術スタック

- **フロントエンド**: React 18 + TypeScript 5 + Vite 5
- **UI**: shadcn/ui + Tailwind CSS + Lucide React Icons
- **状態管理**: Zustand 4
- **データベース**: IndexedDB (Dexie.js)
- **ツール**: ESLint + Prettier

## 📋 プロジェクト構成

```
src/
├── features/           # 機能別モジュール
│   ├── timer/         # 基本タイマー
│   ├── pomodoroTimer/ # ポモドーロタイマー
│   ├── multiTimer/    # 複数タイマー管理
│   ├── analytics/     # 統計・分析
│   └── settings/      # 設定管理
├── components/        # 共通コンポーネント
├── hooks/            # カスタムフック
├── stores/           # Zustand状態管理
├── utils/            # ユーティリティ
└── types/            # TypeScript型定義
```

## 🎯 開発ロードマップ

### Phase 1: MVP (2週間)
- 基本タイマー機能
- レスポンシブUI
- 基本通知機能

### Phase 2: Enhanced (3週間)
- ポモドーロタイマー
- 複数タイマー管理
- データ永続化

### Phase 3: Advanced (4週間)
- 統計・分析機能
- チーム機能
- PWA対応

### Phase 4: Polish (2週間)
- パフォーマンス最適化
- アクセシビリティ向上
- ドキュメント整備

## 📚 ドキュメント

- [機能要件書](./docs/REQUIREMENTS.md)
- [技術仕様書](./docs/TECHNICAL_SPECS.md)
- [API仕様書](./docs/API_SPECS.md) *(予定)*
- [デザインガイド](./docs/DESIGN_GUIDE.md) *(予定)*

## 🔧 開発環境構築

```bash
# プロジェクトクローン
git clone <repository-url>
cd timer-app

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**開発開始準備完了** 🎉

Phase 1のMVP開発から始めて、段階的に機能を拡張していきます。
