# Implementation Plan: Meeting Timer MVP

**Branch**: `[001-meeting-timer-mvp]` | **Date**: 2025-10-26 | **Spec**: specs/001-meeting-timer-mvp/spec.md
**Input**: Feature specification from `/specs/001-meeting-timer-mvp/spec.md`

## Summary

MVPとして「アジェンダ単位の会議進行（超過時：延長/次へ/借用）」「議事録（メモ/決定/アクション）」「参加者/日時/場所/役割の記録」「Markdown/PDF/CSVエクスポート」「オフライン完結」「初期データの冪等生成」を提供する。技術的には React 19 + TypeScript 5 + Vite 6、shadcn/ui + Tailwind、Zustand 5、Dexie（IndexedDB）を用い、タイマーは monotonic 時間（performance.now）基準、UI 更新は1Hzスナップで±1s精度、P95 100ms応答を満たす。

## Technical Context

**Language/Version**: TypeScript 5 / JSX (React 19)
**Primary Dependencies**: React 19, shadcn/ui（Radix UI + Tailwind CSS）, Zustand 5, Dexie（IndexedDB）, lucide-react, date-fns
**Storage**: IndexedDB（Dexie）でローカル永続化（オフライン前提、冪等シード）
**Testing**: Vitest（unit/integration）。E2E は手順書で補助（任意）。
**Target Platform**: Web（モダンブラウザ最新2世代、モバイル対応）
**Project Type**: Web single project（feature-first 構成）
**Performance Goals**: P95 100ms UI 応答、±1s 表示精度（〜2h）、Export<=2s
**Constraints**: オフライン・一人利用が前提、Zustand 5 統一、コンポーネント100行以内、定数/型は一元管理
**Scale/Scope**: 単一ユーザー・1会議あたり数十エンティティ（小規模）

## Constitution Check

Gate項目（抜粋）
- UIスタック: shadcn/ui + Tailwind + Radix → 準拠
- 状態管理: Zustand 5 統一、propsバケツリレー禁止 → 設計で準拠
- コンポーネント100行以内・分割、定数/型の一元管理 → 設計で準拠
- パフォーマンス: P95 100ms、±1s精度、2h運用 → 設計で準拠
- ロギング: 中央ロガー使用、重要イベントを記録 → 設計に反映
- ゲート: build/lint/type/test/spec-kit-check PASS → 維持

結論: 事前チェック PASS（違反なし）。Phase 1 後に再評価を実施。

### Post-Design Re-check (Phase 1)
研究/設計物の結果を踏まえて再評価：
- PDF: 印刷用HTML開始（依存軽量）→ 憲法のパフォーマンス要件（Export<=2s）に整合
- CSV: 列仕様を固定 → 定数の一元管理で準拠
- タイマー: monotonic基準 + 1Hz表示 → ±1s精度要件に整合

結論: 再チェック PASS（違反なし）

## Project Structure

### Documentation (this feature)

```text
specs/001-meeting-timer-mvp/
├── plan.md              # このファイル
├── research.md          # Phase 0 出力
├── data-model.md        # Phase 1 出力
├── quickstart.md        # Phase 1 出力
├── contracts/           # Phase 1 出力
└── tasks.md             # Phase 2（/speckit.tasks で生成）
```

### Source Code (intended layout per constitution)

```text
src/features/meeting/
├── meeting.tsx
├── EnhancedMeetingList.tsx
├── components/
│   ├── MeetingDialogs.tsx
│   ├── MeetingFilterDialog.tsx
│   ├── MeetingFilters.tsx
│   ├── MeetingListTable.tsx
│   └── SearchField.tsx
├── hooks/
│   └── useMeetingForm.ts
├── stores/
│   ├── useMeetingStore.ts
│   └── useMeetingFormStore.ts
├── constants/
│   └── meetingConstants.ts
└── index.ts

src/utils/logger.ts          # 既存の中央ロガー
src/theme/designSystem.ts    # デザイントークン
```

**Structure Decision**: Feature-first。`.github/copilot-instructions.md`と`layout_rule.instructions.md`に準拠した meeting 機能配下へ実装を配置。

## Phase 0: Outline & Research

Unknowns/Decisions（研究タスク化）
1) PDF 生成: 印刷用HTMLで開始し、必要な場合のみ軽量ライブラリ検討。
2) CSV カラム: agendas.csv（title,category,goal,outline,presenter,planned,actual,decision）、actions.csv（agenda,title,owner,due,content）。
3) タイマー更新間隔: UIは1Hz、内部は250–500ms tick + monotonic再計算。
4) ストレージ満杯時の扱い: 保存失敗をユーザーに通知し編集をブロック。
5) 借用の多段波及の下限: 次アジェンダの残時間は0未満不可、最終アジェンダへの借用は不可にする。

出力: research.md に Decision/Rationale/Alternatives 形式で記録（本計画で即時作成）。

## Phase 1: Design & Contracts

1) Data Model: spec 由来のエンティティを data-model.md に整理（フィールド、検証、関係）。
2) Contracts: /contracts に OpenAPI（export）、およびタイマー操作の契約（md）を配置。
3) Quickstart: ローカル開発・テスト・Spec Kit 操作の手順を quickstart.md に記載。
4) Agent Context: `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot` を実行。

Phase 1 完了後に Constitution Check を再評価し、Gate 維持を確認。

## Complexity Tracking

（違反なしにつき空欄）
