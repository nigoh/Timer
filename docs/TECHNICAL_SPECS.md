# 技術仕様書（参照版）

> このドキュメントは参照用です。要件の正本は `docs/REQUIREMENTS.md` です。

## 1. 正本参照

- 正式な要件・受け入れ基準・Phase定義: `docs/REQUIREMENTS.md`
- 本書は実装方式と技術補足のみを扱う

## 2. 技術スタック（`package.json` 準拠）

- React `^18.3.1`
- TypeScript `^5.9.2`
- Vite `^5.4.19`
- Zustand `^4.5.0`
- shadcn/ui + Tailwind CSS `^3.4.0`
- Dexie `^4.0.11`

## 3. UI実装方針

- 現行標準: **shadcn/ui + Tailwind CSS**
- MUIは現行採用対象外（過去検討案）

## 4. 実装済みコンテナ（Phase突合元）

- `src/features/timer/containers/BasicTimer.tsx`
- `src/features/timer/containers/EnhancedPomodoroTimer.tsx`
- `src/features/timer/containers/NewAgendaTimer.tsx`
- `src/features/timer/containers/MultiTimer.tsx`

## 5. 非機能の測定観点

具体的な合格基準値は `docs/REQUIREMENTS.md` 第7章を正とし、本書は測定手段の補足に限定する。

## 6. 検証補助コマンド

```bash
npm run lint
npm run test
```
