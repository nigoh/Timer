# Data Model — Meeting Timer MVP

Spec: ./spec.md
Date: 2025-10-26

## Entities

### Meeting
- id: string (uuid)
- title: string (1..120)
- date: ISO date (YYYY-MM-DD)
- startTime: ISO time (HH:mm)
- location: string (0..120)
- participants: Participant[]
- agendas: AgendaItem[] (order defines sequence)
- roles: { facilitator?: participantId, timekeeper?: participantId, scribe?: participantId, participants: participantId[] }
- createdAt: ISO datetime
- updatedAt: ISO datetime

Validation
- title required; date required; agendas length >= 1
- role assignment optional; participant ids must exist

---

### Participant
- id: string (uuid)
- name: string (1..80)
- affiliation?: string (0..80)
- contact?: string (0..120)
- attendance?: boolean (default true)

Validation
- name required

---

### AgendaItem
- id: string (uuid)
- title: string (1..120)
- category: enum ("報告"|"連絡"|"検討"|"提案"|"確認"|"伝達"|custom)
- goal: string (0..200)
- discussionOutline: string (0..2000)
- order: integer (>=0, unique within meeting)
- presenter: string (0..80)
- plannedDuration: integer seconds (>=0)
- actualDuration: integer seconds (>=0)
- startAt?: ISO datetime
- endAt?: ISO datetime
- overrunDecisions: OverrunDecision[]
- minutes: MinuteItem[]

Validation
- title, plannedDuration required
- order unique per meeting
- borrow may not reduce next agenda remaining below 0; no borrow from last agenda

---

### MinuteItem
- id: string (uuid)
- agendaId: string (uuid)
- type: enum ("Note"|"Decision"|"Action")
- content: string (1..2000)
- owner?: string (0..80)
- due?: ISO date
- createdAt: ISO datetime

Validation
- type/content required; when type = Action and owner/due provided, record both columns in CSV

---

### OverrunDecision
- type: enum ("extend"|"next"|"borrow")
- amountSec?: integer (>=0)  # not required for "next"
- at: ISO datetime
- fromAgendaId?: string (uuid)
- toAgendaId?: string (uuid)

Notes
- For "borrow", amountSec is required; fromAgendaId = current, toAgendaId = next
