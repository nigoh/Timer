export interface GitHubIssue {
  title: string;
  issueUrl: string;
}

interface FetchGitHubIssueParams {
  owner: string;
  repo: string;
  issueNumber: number;
  pat?: string;
}

const GITHUB_API_VERSION = "2022-11-28";

export const fetchGitHubIssue = async ({
  owner,
  repo,
  issueNumber,
  pat,
}: FetchGitHubIssueParams): Promise<GitHubIssue> => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };

  if (pat?.trim()) {
    headers.Authorization = `Bearer ${pat.trim()}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}`,
    { headers },
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Issue が見つかりません（owner/repo と Issue 番号を確認してください）");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("認証に失敗しました（PAT を確認してください）");
    }
    throw new Error(`GitHub API エラー: ${response.status}`);
  }

  const data = (await response.json()) as { title?: unknown; html_url?: unknown };
  if (typeof data.title !== "string" || typeof data.html_url !== "string") {
    throw new Error("GitHub API のレスポンスが不正です");
  }

  return {
    title: data.title,
    issueUrl: data.html_url,
  };
};
