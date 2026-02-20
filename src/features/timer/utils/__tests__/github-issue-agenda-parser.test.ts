import { describe, expect, it } from "vitest";
import { parseIssueAgendaItems } from "../github-issue-agenda-parser";

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
