# Feature Specification: Meeting Timer MVP

**Feature Branch**: `[001-meeting-timer-mvp]`  
**Created**: 2025-10-26  
**Status**: Draft  
**Input**: User description: "会議タイマーのMVP仕様。アジェンダ管理、アジェンダ単位のタイマー、議事録（メモ/決定/アクション）、参加者/日時/場所の記録、Markdown/PDF/CSV出力。超過時は延長/次へ/借用の三択。役割は司会/タイムキーパー/書記/参加者。オフライン編集可、±1秒表示精度、100ms以内のUI反応。初期データを生成（2025-11-01の定例、5名、3アジェンダ）。受入基準は各機能がE2Eで動作し、終了時にサマリーと出力が得られること。"

## Clarifications

### Session 2025-10-26

- Q: What fields must each agenda item capture as a standardized frame? → A: 題名（議題）、区分（報告/連絡/検討/提案/確認/伝達 など）、ゴール、論点・進め方・手順・理由・背景、所要時間、当日の担当者（起案者）名。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run a timed meeting by agenda (Priority: P1)

Facilitator starts a scheduled meeting, runs a timer per agenda item, and when time runs out chooses one of: extend time, move to next agenda, or borrow time from the next item. Throughout, the scribe records notes, decisions, and actions per agenda. At meeting end, the team sees a summary and can download outputs.

**Why this priority**: Delivers the core value of timely meetings with clear outcomes and accountability.

**Independent Test**: Simulate a meeting with 2–3 agenda items, force an overrun to exercise the three choices, enter minutes, and verify the end-of-meeting summary and downloads are produced.

**Acceptance Scenarios**:

1. **Given** a meeting with multiple agenda items and durations, **When** the facilitator starts the timer for item A, **Then** the countdown displays and updates once per second with ±1s accuracy.
2. **Given** the timer reaches zero on item A, **When** the facilitator chooses "extend", **Then** the remaining time increases by the selected amount and the overrun is recorded in the summary.
3. **Given** the timer reaches zero on item A, **When** the facilitator chooses "next", **Then** the app advances to item B and records that item A ended at timebox with no borrowed/extended time.
4. **Given** the timer reaches zero on item A, **When** the facilitator chooses "borrow", **Then** the selected amount is deducted from item B and recorded, and item A continues for that borrowed time.
5. **Given** the scribe inputs notes/decisions/actions during items, **When** the meeting ends, **Then** the summary shows per-agenda minutes grouped by category.

---

### User Story 2 - Prepare meeting and capture context (Priority: P2)

Organizer creates/edits agendas (title, goal, duration, order), sets date/time and location, and records participants with roles (facilitator, timekeeper, scribe, participant). On first use, an initial sample meeting (2025-11-01, 5 participants, 3 agenda items) is available.

**Why this priority**: Meeting prep improves execution quality and reduces setup overhead via initial data.

**Independent Test**: Create a meeting from scratch, reorder agendas, assign roles, and confirm the initial dataset exists exactly once unless deleted.

**Acceptance Scenarios**:

1. **Given** an empty system on first launch, **When** the app opens, **Then** one sample meeting dated 2025-11-01 exists with 5 participants and 3 agenda items.
2. **Given** an existing meeting, **When** the organizer edits titles/durations and reorders agendas, **Then** changes persist and reflect in subsequent timers.
3. **Given** participants are listed, **When** roles are assigned (multiple roles per person allowed), **Then** the assignment appears in the meeting header and summary.

---

### User Story 3 - Export and offline reliability (Priority: P3)

After the meeting, the organizer downloads outputs in Markdown, PDF, and CSV formats. All editing and running flows work without network connectivity, and data is preserved across reloads.

**Why this priority**: Outputs are needed for sharing and tracking; offline ensures reliability in real-world environments.

**Independent Test**: Disconnect network, run a meeting end-to-end, then reconnect and export files; verify file contents and that no data was lost.

**Acceptance Scenarios**:

1. **Given** a completed meeting with minutes, **When** export is requested, **Then** Markdown/PDF/CSV files are generated containing metadata, agendas, timing (planned vs actual), and minutes grouped by type.
2. **Given** the device is offline, **When** the user edits agendas and runs timers, **Then** edits and meeting progress persist locally and are available after reload.

### Edge Cases

- System clock changes during a meeting (forward/back) — timers remain based on elapsed time, not wall clock.
- Borrowed time cascades across multiple subsequent items — ensure total time accounting remains accurate and never negative.
- Zero-duration or very short agenda items (≤ 30s) — timers start and complete without error.
- Pausing/resuming timer mid-item — remaining time tracks correctly and summary records pause events.
- Skipping an agenda manually before timebox ends — record actual duration and reason.
- Editing agenda durations while a meeting is running — changes apply to future items only and are clearly indicated.
- Very long meetings (≥ 2 hours) — maintain ±1s display accuracy throughout.
- Minimal participants (1 person) or many participants (≥ 20) — roles assignment and summary scale appropriately.
- Offline device with no storage space — inform user and prevent data loss.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST create, edit, reorder, and delete agenda items with fields: title (議題), category (区分), goal, discussion outline (論点・進め方・手順・理由・背景), planned duration (mm:ss), presenter (当日の担当者/起案者)。
- **FR-002**: Users MUST record meeting metadata: title, date, start time, location, and participants list.
- **FR-003**: Users MUST assign roles per meeting: facilitator (司会), timekeeper, scribe, participant. A person MAY hold multiple roles.
- **FR-004**: The system MUST run a per-agenda countdown timer that updates the display once per second with ±1s accuracy.
- **FR-005**: On timer expiry, the system MUST present three choices: extend (specify minutes/seconds), move to next, or borrow time from the next agenda.
- **FR-006**: Choosing extend MUST increase the current agenda’s remaining time by the selected amount and record the extension in the summary.
- **FR-007**: Choosing next MUST end the current agenda at its timebox, advance to the next agenda, and record the outcome.
- **FR-008**: Choosing borrow MUST continue the current agenda and subtract the specified amount from the next agenda’s planned time; if multiple borrows occur, track cumulative impact.
- **FR-009**: Users MUST capture minutes per agenda categorized as Notes, Decisions, and Actions; Actions MUST include owner and due date when provided.
- **FR-010**: The system MUST provide a meeting summary view showing planned vs actual time per agenda, overrun/borrow/extend decisions, and minutes by category.
- **FR-011**: The system MUST export the completed meeting as Markdown, PDF, and CSV containing: meeting metadata, agendas (planned vs actual), agenda fields (title, category, goal, outline, presenter), overrun decisions, and minutes grouped by type; CSV MUST be structured for tabular data (e.g., agendas and actions).
- **FR-012**: All editing and meeting-running flows MUST be available offline; data MUST persist locally across reloads and power cycles.
- **FR-013**: The UI MUST respond to user interactions (start/pause/extend/next/borrow, text input, reordering) within 100ms for 95% of interactions under typical device conditions.
- **FR-014**: Timer display MUST maintain ±1s accuracy for the full session (up to at least 2 hours continuous use).
- **FR-015**: Initial data MUST be generated on first launch: one meeting on 2025-11-01 (regular), 5 participants, and 3 agenda items with reasonable default durations and titles; generation MUST be idempotent (do not duplicate if already present).
- **FR-016**: Users MUST be able to start, pause, resume, and reset a timer for the current agenda; manual advance to any agenda MUST be possible with confirmation.
- **FR-017**: Users MUST be warned before irreversible actions (e.g., clearing minutes or resetting timers) and have a way to cancel.
- **FR-018**: At meeting end, the system MUST present a completion screen with key metrics (total planned vs actual, number of decisions/actions) and provide export options.
 - **FR-019**: Agenda category (区分) MUST support a default vocabulary including: 報告, 連絡, 検討, 提案, 確認, 伝達; users MAY add custom categories as needed. Selected category MUST appear in the summary and exports.

### Key Entities *(include if feature involves data)*

- **Meeting**: id, title, date, start time, location, participants[], agendas[], role assignments, created/updated timestamps.
- **Participant**: id, name, optional affiliation/contact, roles[] (per meeting), attendance flag.
- **AgendaItem**: id, title, category, goal, discussionOutline, order, presenter, plannedDuration, actualDuration, start/end timestamps, overrunDecisions[] (extend/next/borrow with amounts), minutes[]
- **MinuteItem**: id, agendaId, type (Note | Decision | Action), content, optional owner, optional due date, created timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A facilitator can run a meeting end-to-end (start → per-agenda timing with at least one overrun decision → minutes captured → summary) without guidance on first attempt.
- **SC-002**: 95% of primary UI interactions complete within 100ms (start/pause/next/borrow/extend, text entry confirmation, reordering).
- **SC-003**: Timer display accuracy remains within ±1 second for the entire meeting up to 2 hours.
- **SC-004**: Export generation (Markdown, PDF, CSV) completes within 2 seconds on a typical device and files contain required sections (metadata, agendas with planned vs actual, overrun decisions, minutes grouped by type).
- **SC-005**: All critical flows (agenda edit, run timers, capture minutes, export) are operable offline; data persists after app reload.
- **SC-006**: Initial dataset is present exactly once on first launch and is not duplicated on subsequent launches.

## Assumptions

- Local storage is available and sufficient for meeting data; if storage is full, the app informs the user and prevents data loss.
- A person may hold multiple roles if the team is small; roles are per meeting (not global across meetings).
- Time calculations are based on monotonic elapsed time, not wall clock, to avoid clock drift issues.
- PDF/CSV formatting follows common, readable defaults; exact visual styling is out of scope for MVP.

## Dependencies & Risks

- Device storage limitations could prevent offline persistence (mitigated by user messaging and save failures prevention).
- Very long sessions could expose edge timing issues; we set a target of 2 hours for MVP.
- Printing to PDF may depend on platform capabilities; provide a fallback (downloadable content) if native print is unavailable.

