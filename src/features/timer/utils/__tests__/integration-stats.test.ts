import { describe, expect, it } from "vitest";
import { buildIntegrationIssueStats } from "../integration-stats";
import { BasicTimerHistory } from "@/types/timer";
import { IntegrationLink } from "@/types/integrationLink";

const createHistory = (
  id: string,
  actualDuration: number,
): BasicTimerHistory => ({
  id,
  duration: 1500,
  actualDuration,
  startTime: new Date("2026-02-19T09:00:00.000Z"),
  endTime: new Date("2026-02-19T09:25:00.000Z"),
  completed: true,
  label: "test",
});

const createLink = (
  issueUrl: string,
  issueTitle: string | undefined,
  issueNumber: number,
): IntegrationLink => ({
  id: crypto.randomUUID(),
  owner: "nigoh",
  repo: "Timer",
  issueNumber,
  issueTitle,
  issueUrl,
  createdAt: new Date().toISOString(),
});

describe("buildIntegrationIssueStats", () => {
  it("Issue ごとに actualDuration を集計できる", () => {
    const history = [createHistory("h1", 120), createHistory("h2", 300)];
    const linksByLogId = {
      h1: [createLink("https://github.com/nigoh/Timer/issues/36", "Issue 36", 36)],
      h2: [createLink("https://github.com/nigoh/Timer/issues/36", "Issue 36", 36)],
    };

    const stats = buildIntegrationIssueStats(history, linksByLogId);
    expect(stats).toHaveLength(1);
    expect(stats[0].issueUrl).toBe("https://github.com/nigoh/Timer/issues/36");
    expect(stats[0].totalActualDuration).toBe(420);
    expect(stats[0].sessionCount).toBe(2);
  });

  it("同一履歴内の重複リンクを二重集計しない", () => {
    const history = [createHistory("h1", 180)];
    const duplicated = createLink(
      "https://github.com/nigoh/Timer/issues/36",
      "Issue 36",
      36,
    );
    const linksByLogId = {
      h1: [duplicated, { ...duplicated, id: crypto.randomUUID() }],
    };

    const stats = buildIntegrationIssueStats(history, linksByLogId);
    expect(stats).toHaveLength(1);
    expect(stats[0].totalActualDuration).toBe(180);
    expect(stats[0].sessionCount).toBe(1);
  });

  it("タイトル未設定の場合は owner/repo#number を表示名に使う", () => {
    const history = [createHistory("h1", 60)];
    const linksByLogId = {
      h1: [createLink("https://github.com/nigoh/Timer/issues/37", undefined, 37)],
    };

    const stats = buildIntegrationIssueStats(history, linksByLogId);
    expect(stats[0].issueTitle).toBe("nigoh/Timer #37");
  });
});
