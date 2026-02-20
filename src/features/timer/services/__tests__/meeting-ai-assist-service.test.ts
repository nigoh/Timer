import { describe, expect, it } from "vitest";
import { generateMeetingAiAssist } from "../meeting-ai-assist-service";
import { MeetingReport } from "@/types/meetingReport";

const baseReport: MeetingReport = {
  id: "r1",
  meetingId: "m1",
  meetingTitle: "週次定例",
  createdAt: "2026-02-20T00:00:00.000Z",
  heldAt: "2026-02-20T00:00:00.000Z",
  participants: ["山田"],
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
  ],
  todos: [],
  markdown: "",
};

describe("generateMeetingAiAssist", () => {
  it("config 未設定時はルールベース提案へフォールバックする", async () => {
    const result = await generateMeetingAiAssist(baseReport, null);

    expect(result.usedFallback).toBe(true);
    expect(result.assist.summary).toContain("週次定例");
  });

  it("config 不正時はルールベース提案へフォールバックする", async () => {
    const result = await generateMeetingAiAssist(baseReport, {
      provider: "openai",
      model: "",
      apiKey: "",
    });

    expect(result.usedFallback).toBe(true);
    expect(result.assist.consensusAssist).toContain("期限");
  });
});
