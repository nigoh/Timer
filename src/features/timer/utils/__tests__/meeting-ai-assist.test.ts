import { describe, expect, it } from "vitest";
import { buildMeetingAiAssist } from "../meeting-ai-assist";
import { MeetingReport } from "@/types/meetingReport";

const baseReport: MeetingReport = {
  id: "r1",
  meetingId: "m1",
  meetingTitle: "週次定例",
  createdAt: "2026-02-20T00:00:00.000Z",
  heldAt: "2026-02-20T00:00:00.000Z",
  participants: ["山田", "佐藤"],
  summary: "",
  decisions: "",
  nextActions: "",
  agendaItems: [
    {
      agendaId: "a1",
      title: "進捗共有",
      plannedDurationSec: 600,
      actualDurationSec: 900,
      varianceSec: 300,
    },
    {
      agendaId: "a2",
      title: "課題整理",
      plannedDurationSec: 900,
      actualDurationSec: 900,
      varianceSec: 0,
    },
  ],
  todos: [],
  markdown: "",
};

describe("buildMeetingAiAssist", () => {
  it("要約・合意形成・進行・アジェンダ・事前準備の提案を生成する", () => {
    const assist = buildMeetingAiAssist(baseReport);

    expect(assist.summary).toContain("週次定例");
    expect(assist.summary).toContain("予定");
    expect(assist.consensusAssist).toContain("期限");
    expect(assist.facilitationAssist).toContain("時間配分");
    expect(assist.agendaAssist).toContain("次回アジェンダ案");
    expect(assist.preparationAssist).toContain("事前準備案");
  });
});
