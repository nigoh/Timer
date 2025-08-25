# Timer App - Windows デスクトップアプリケーション

## 🎯 概要

React + TypeScript + Vite で開発されたタイマーアプリケーションを、Electron を使用してWindows デスクトップアプリケーションに変換しました。

## ✅ 実装完了機能

### デスクトップアプリケーション機能
- ✅ **システムトレイ統合** - バックグラウンド動作とトレイメニュー
- ✅ **ネイティブ通知** - Windows 通知システム連携
- ✅ **ウィンドウ管理** - 最小化、復元、閉じる操作
- ✅ **自動起動設定** - Windows 起動時の自動開始
- ✅ **メニューシステム** - ネイティブメニューバー
- ✅ **セキュアAPI** - プリロードスクリプトによる安全な通信

### タイマー機能
- ✅ **基本タイマー** - シンプルなカウントダウンタイマー
- ✅ **ポモドーロタイマー** - 作業と休憩の自動切り替え
- ✅ **通知システム** - タイマー終了時の音声・視覚通知
- ✅ **履歴管理** - 過去のタイマーセッション記録

## 🚀 使用方法

### 開発環境セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd Timer

# 依存関係のインストール
npm install

# Web版開発サーバーの起動
npm run dev

# Electron版開発実行
npm run electron:dev
```

### プロダクションビルド

```bash
# Web版ビルド
npm run build

# Electron アプリ実行
npm run electron

# Windows インストーラー作成
npm run dist
```

## 📁 プロジェクト構造

```
Timer/
├── src/                        # React アプリケーション
│   ├── App.minimal.tsx        # Electron統合メインアプリ
│   ├── hooks/
│   │   └── useElectron.ts     # Electron API フック
│   ├── types/
│   │   └── electron.ts        # Electron 型定義
│   ├── components/            # UI コンポーネント
│   ├── stores/               # Zustand ストア
│   └── utils/                # ユーティリティ
├── electron/                  # Electron メインプロセス
│   ├── main.js               # メインプロセス
│   ├── preload.js            # セキュアAPI
│   ├── package.json          # CommonJS設定
│   └── assets/
│       └── icon.svg          # アプリアイコン
├── docs/                     # ドキュメント
├── scripts/                  # ビルドスクリプト
└── dist/                     # ビルド成果物
```

## 🎨 デスクトップ向け UI/UX

### 改善された機能
1. **デスクトップ環境認識**
   - Electronで実行中であることを表示
   - ブラウザ版との機能差別化

2. **ウィンドウ制御**
   - カスタム最小化・閉じるボタン
   - システムトレイへの最小化

3. **ネイティブ統合**
   - Windows 通知システム利用
   - システム起動時の自動開始

## 🔧 技術仕様

### フロントエンド
- **React 18** - UI フレームワーク
- **TypeScript 5** - 型安全な開発
- **Vite 5** - 高速ビルドツール
- **shadcn/ui** - モダンUIコンポーネント
- **Tailwind CSS** - ユーティリティファーストCSS
- **Zustand** - 軽量状態管理

### デスクトップ統合
- **Electron 32** - デスクトップアプリフレームワーク
- **electron-builder** - インストーラー作成
- **electron-updater** - 自動更新機能

### セキュリティ
- **contextIsolation: true** - コンテキスト分離
- **nodeIntegration: false** - Node.js API無効化
- **preload スクリプト** - 安全なAPI公開

## 📦 配布パッケージ

### Windows インストーラー特徴
- **NSIS インストーラー** - Windowsネイティブインストーラー
- **デスクトップショートカット** - 自動作成
- **スタートメニュー登録** - アプリケーション一覧に追加
- **アンインストーラー** - 完全なアンインストール機能

### ファイル構成（予想）
```
release/
└── Timer App Setup 0.1.0.exe  # インストーラー（約 150-200MB）
```

## 🔐 セキュリティ対策

### Electron セキュリティベストプラクティス
- ✅ Node.js 統合の無効化
- ✅ コンテキスト分離の有効化
- ✅ プリロードスクリプトによるAPI制御
- ✅ 外部コンテンツの適切な処理
- ✅ CSP (Content Security Policy) 設定

## 🎯 使用可能なコマンド

```bash
# 開発
npm run dev                 # Web版開発サーバー
npm run electron:dev        # Electron開発版

# ビルド
npm run build              # Web版ビルド
npm run electron           # Electron実行
npm run electron:pack      # パッケージ作成
npm run dist              # インストーラー作成

# 品質管理
npm run lint              # コード品質チェック
npm run type-check        # TypeScript型チェック
```

## 🚧 今後の改善予定

### 機能追加
- [ ] アプリケーション署名の実装
- [ ] 自動更新機能のテスト
- [ ] 多言語対応
- [ ] ダークモード対応

### パフォーマンス最適化
- [ ] バンドルサイズの最適化
- [ ] 起動時間の短縮
- [ ] メモリ使用量の最適化

### Windows統合強化
- [ ] Jumplistサポート
- [ ] タスクバープレビュー
- [ ] Windows 11 新機能対応

## 🛠 開発環境要件

- **Node.js**: v18.0.0 以上
- **npm**: v9.0.0 以上
- **OS**: Windows 10/11 (ビルドには Windows が推奨)

## 📚 関連ドキュメント

- [Windows App Development Plan](./docs/WINDOWS_APP_PLAN.md)
- [Technical Specifications](./docs/TECHNICAL_SPECS.md)
- [Requirements](./docs/REQUIREMENTS.md)

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

---

**Timer App Desktop** - Windows ユーザーの生産性向上をサポート 🚀