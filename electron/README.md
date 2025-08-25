# Timer App - Desktop Application

これは Timer App のデスクトップ版です。

## Electron統合

Webアプリケーションを Electron でラップしてデスクトップアプリケーションにしました。

### 主な機能

- システムトレイ統合
- ネイティブ通知
- 自動起動設定
- Windows インストーラー

### 開発

```bash
# 開発環境での実行
npm run electron:dev

# プロダクションビルド
npm run dist
```

### Windows インストーラー作成

```bash
npm run dist
```

これにより `release/` フォルダに Windows インストーラーが作成されます。