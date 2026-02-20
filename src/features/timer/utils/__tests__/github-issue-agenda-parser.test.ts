import { describe, expect, it } from "vitest";
import {
  parseIssueAgendaItems,
  parseIssueTodoItems,
} from "../github-issue-agenda-parser";

describe("parseIssueAgendaItems", () => {
  it("Agenda セクション配下を優先して抽出する", () => {
    const body = `
## Agenda
- [ ] オープニング（所要: 5分）
- [ ] KPIレビュー (Duration: 15m)

## Notes
- 補足メモ
- [ ] フォローアップ
`;

    const result = parseIssueAgendaItems(body);
    expect(result.slice(0, 2)).toEqual([
      { title: "オープニング", plannedDurationMinutes: 5 },
      { title: "KPIレビュー", plannedDurationMinutes: 15 },
    ]);
  });

  it("Agenda セクションがない場合はチェックリストと箇条書きを抽出する", () => {
    const body = `
- [ ] タスクA
1. タスクB
`;

    const result = parseIssueAgendaItems(body);
    expect(result).toEqual([
      { title: "タスクA", plannedDurationMinutes: undefined },
      { title: "タスクB", plannedDurationMinutes: undefined },
    ]);
  });
});

describe("parseIssueTodoItems", () => {
  it("チェックリストから担当者と期限を抽出する", () => {
    const body = `
- [ ] レビュー資料準備 @alice 期限: 2026-03-10
- [x] 議事録共有 担当: bob due: 2026-03-12
`;

    const result = parseIssueTodoItems(body);
    expect(result).toEqual([
      {
        text: "レビュー資料準備",
        owner: "alice",
        dueDate: "2026-03-10",
      },
      {
        text: "議事録共有",
        owner: "bob",
        dueDate: "2026-03-12",
      },
    ]);
  });
});
