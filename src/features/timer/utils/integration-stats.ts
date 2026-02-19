import { BasicTimerHistory } from "@/types/timer";
import { IntegrationLink } from "@/types/integrationLink";

export interface IntegrationIssueStat {
  issueUrl: string;
  issueTitle: string;
  totalActualDuration: number;
  sessionCount: number;
}

export const buildIntegrationIssueStats = (
  history: BasicTimerHistory[],
  linksByLogId: Record<string, IntegrationLink[]>,
): IntegrationIssueStat[] => {
  const stats = new Map<string, IntegrationIssueStat>();

  for (const entry of history) {
    const links = linksByLogId[entry.id] ?? [];
    if (links.length === 0) continue;

    const uniqueUrls = new Set(links.map((link) => link.issueUrl));
    for (const issueUrl of uniqueUrls) {
      const link = links.find((candidate) => candidate.issueUrl === issueUrl);
      if (!link) continue;

      const fallbackTitle = `${link.owner}/${link.repo} #${link.issueNumber}`;
      const existing = stats.get(issueUrl);

      if (existing) {
        existing.totalActualDuration += entry.actualDuration;
        existing.sessionCount += 1;
      } else {
        stats.set(issueUrl, {
          issueUrl,
          issueTitle: link.issueTitle || fallbackTitle,
          totalActualDuration: entry.actualDuration,
          sessionCount: 1,
        });
      }
    }
  }

  return Array.from(stats.values()).sort((a, b) => {
    if (b.totalActualDuration !== a.totalActualDuration) {
      return b.totalActualDuration - a.totalActualDuration;
    }
    return b.sessionCount - a.sessionCount;
  });
};
