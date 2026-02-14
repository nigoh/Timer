# Tasks — Meeting Timer MVP

Plan: ./plan.md | Spec: ./spec.md | Date: 2025-10-26

## Dependencies (User Story Order)
- US1 → US3（US3はUS1の完了データを想定）
- US2 は独立（準備機能）だが、US1の運用前にあると望ましい

## Parallel Execution Examples
- UI骨格とストア実装は別ファイルで並列化可能（[P]）
- Export生成（MD/CSV/PDF）は契約に基づき並列に実装可能（[P]）
- ロギングとUX微調整は非依存（[P]）

---

## Phase 1 — Setup

- [X] T001 Create feature directories per constitution in src/features/meeting/
- [X] T002 Add meeting constants file at src/features/meeting/constants/meetingConstants.ts
- [X] T003 Wire feature exports at src/features/meeting/index.ts
- [X] T004 Ensure design tokens available at src/theme/designSystem.ts (verify/import)
- [X] T005 Verify central logger exists at src/utils/logger.ts and add meeting categories if needed

## Phase 2 — Foundational

- [X] T006 Implement Meeting types in src/features/meeting/constants/meetingConstants.ts
- [X] T007 [P] Create useMeetingStore at src/features/meeting/stores/useMeetingStore.ts (meetings CRUD, seed)
 - [X] T008 [P] Create useAgendaStore at src/features/meeting/stores/useAgendaStore.ts (CRUD/reorder/borrow rules)
 - [X] T009 [P] Create useRunStore at src/features/meeting/stores/useRunStore.ts (monotonic timer, extend/next/borrow)
- [X] T010 Seed initial data (2025-11-01, 5 participants, 3 agendas) in useMeetingStore (idempotent)
- [X] T011 Add CSV/Markdown/PDF contract helpers at src/features/meeting/services/exportContracts.ts

---

## Phase 3 — User Story 1 (P1): Run a timed meeting by agenda
Goal: アジェンダごとの進行（超過：延長/次へ/借用）と議事録入力、終了時サマリー/出力の前段
Independent Test: 2–3アジェンダで開始→超過→三択→議事録入力→サマリー確認

- [X] T012 [P] [US1] Create MeetingRunPage at src/features/meeting/meeting.tsx using FeatureLayout/Header/Content
- [X] T013 [P] [US1] Implement TimerControls component at src/features/meeting/components/MeetingDialogs.tsx (start/pause/resume/reset/next)
- [X] T014 [P] [US1] Implement OverrunDialog in src/features/meeting/components/MeetingDialogs.tsx (extend/next/borrow)
- [X] T015 [P] [US1] Implement MinutesPane in src/features/meeting/components/MeetingDialogs.tsx (Note/Decision/Action入力)
- [X] T016 [US1] Wire stores to MeetingRunPage (selectors, useCallback, 100行以内分割)
- [X] T017 [US1] Record overrun decisions and actual durations (useAgendaStore/useRunStore)
- [X] T018 [US1] Add summary view shell in src/features/meeting/components/MeetingListTable.tsx (planned vs actual/decisions)
- [X] T019 [US1] Log key events (timer:start/extend/borrow/next/finish) via src/utils/logger.ts

---

## Phase 4 — User Story 2 (P2): Prepare meeting and capture context
Goal: 会議の準備（メタ/参加者/役割、アジェンダCRUD/並び替え）と初期データ
Independent Test: 新規作成→並べ替え→役割割当→初期データ一意

- [ ] T020 [P] [US2] Create MeetingSetupPage at src/features/meeting/EnhancedMeetingList.tsx
- [ ] T021 [P] [US2] Implement Agenda CRUD UI at src/features/meeting/components/MeetingListTable.tsx (title/category/goal/outline/presenter/duration)
- [ ] T022 [P] [US2] Implement Agenda reorder (D&D) at src/features/meeting/components/MeetingListTable.tsx
- [ ] T023 [US2] Implement Participants & Roles UI at src/features/meeting/components/MeetingFilters.tsx
- [ ] T024 [US2] Show roles in header (facilitator/timekeeper/scribe) in MeetingRunPage header
- [ ] T025 [US2] Persist edits offline (Dexie) with optimistic update & rollback

---

## Phase 5 — User Story 3 (P3): Export and offline reliability
Goal: エクスポート（MD/PDF/CSV）とオフライン完全動作
Independent Test: オフラインで運用→再接続→各形式を出力、内容整合

- [ ] T026 [P] [US3] Implement Markdown export at src/features/meeting/services/exportMarkdown.ts
- [ ] T027 [P] [US3] Implement CSV export at src/features/meeting/services/exportCsv.ts (agendas.csv/actions.csv)
- [ ] T028 [P] [US3] Implement PDF export at src/features/meeting/services/exportPdf.ts (print-friendly HTML)
- [ ] T029 [US3] Add Export actions in Summary view and header buttons
- [ ] T030 [US3] Offline mode: ensure all flows persist via Dexie and survive reload

---

## Final Phase — Polish & Cross-Cutting

- [ ] T031 Audit performance: ensure P95 100ms and ±1s accuracy (selectors/useCallback/memo)
- [ ] T032 Accessibility: focus order, key navigation, color contrast
- [ ] T033 Error handling: confirm dialogs for destructive actions; storage full handling UX
- [ ] T034 Constants & types centralization at src/features/meeting/constants/meetingConstants.ts
- [ ] T035 Update docs: quickstart, README change log for MVP, export sample files under docs/

```text
Format validation: ALL tasks follow `- [ ] T### [P]? [US?]? Description with file path`.
```
