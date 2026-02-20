import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchGitHubIssue, postGitHubIssueComment } from "../github-issues";

describe("fetchGitHubIssue", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("GitHub API から title と html_url を取得できる", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Issue title from API",
        html_url: "https://github.com/nigoh/Timer/issues/36",
        body: "## Agenda\n- [ ] Topic",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const issue = await fetchGitHubIssue({
      owner: "nigoh",
      repo: "Timer",
      issueNumber: 36,
    });

    expect(issue.title).toBe("Issue title from API");
    expect(issue.issueUrl).toBe("https://github.com/nigoh/Timer/issues/36");
    expect(issue.body).toBe("## Agenda\n- [ ] Topic");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/nigoh/Timer/issues/36",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        }),
      }),
    );
  });

  it("PAT 指定時は Authorization ヘッダーを付与する", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Issue title from API",
        html_url: "https://github.com/nigoh/Timer/issues/36",
        body: "",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchGitHubIssue({
      owner: "nigoh",
      repo: "Timer",
      issueNumber: 36,
      pat: "ghp_test_token",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/nigoh/Timer/issues/36",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer ghp_test_token",
        }),
      }),
    );
  });

  it("404 の場合はわかりやすいエラーを返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchGitHubIssue({
        owner: "nigoh",
        repo: "Timer",
        issueNumber: 9999,
      }),
    ).rejects.toThrow(
      "Issue が見つかりません（owner/repo と Issue 番号を確認してください）",
    );
  });

  it("401/403 の場合は認証エラーを返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchGitHubIssue({
        owner: "nigoh",
        repo: "Timer",
        issueNumber: 36,
        pat: "invalid",
      }),
    ).rejects.toThrow("認証に失敗しました（PAT を確認してください）");
  });
});

describe("postGitHubIssueComment", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Issue コメントを投稿できる", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
    });
    vi.stubGlobal("fetch", fetchMock);

    await postGitHubIssueComment({
      owner: "nigoh",
      repo: "Timer",
      issueNumber: 36,
      body: "comment body",
      pat: "ghp_test_token",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/nigoh/Timer/issues/36/comments",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer ghp_test_token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ body: "comment body" }),
      }),
    );
  });

  it("投稿先が見つからない場合はエラーを返す", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      postGitHubIssueComment({
        owner: "nigoh",
        repo: "Timer",
        issueNumber: 9999,
        body: "comment body",
      }),
    ).rejects.toThrow("コメント投稿先の Issue が見つかりません");
  });
});
