# Quickstart — Meeting Timer MVP

## Prerequisites
- Node.js 18+
- Windows PowerShell 5.1（既定シェル）

## Install & Run
```powershell
# 依存をインストール
npm install

# 開発サーバー起動（例: Vite）
npm run dev
```

## Tests
```powershell
# Lint/Typecheck/Test を順に
npm run lint; npm run typecheck; npm test
```

## Spec Kit
```powershell
# 環境チェック
npm run spec:check

# 仕様から計画生成（現在のブランチで）
# 実行はチャットから /speckit.plan を推奨
```

## Build
```powershell
npm run build
```

## Notes
- 憲法の品質ゲート（build/lint/type/test/spec-kit-check）をPASSしたもののみPRをマージ
- 仕様は `specs/001-meeting-timer-mvp/spec.md` を唯一のソースとして参照
