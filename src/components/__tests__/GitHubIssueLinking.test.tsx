import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { useIntegrationLinkStore } from "@/features/timer/stores/integration-link-store";

// ─── モック ──────────────────────────────────────────────────────────────
const mockFetchGitHubIssue = vi.fn();
vi.mock("@/features/timer/api/github-issues", () => ({
  fetchGitHubIssue: (...args: any[]) => mockFetchGitHubIssue(...args),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, "aria-label": ariaLabel }: any) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ id, value, onChange, placeholder, type, min, className }: any) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      min={min}
      className={className}
    />
  ),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock("lucide-react", () => ({
  Github: () => <span>github</span>,
  Link2: () => <span>link</span>,
  Trash2: () => <span>trash</span>,
  Plus: () => <span>plus</span>,
  ChevronDown: () => <span>down</span>,
  ChevronUp: () => <span>up</span>,
}));

import { GitHubIssueLinking } from "../GitHubIssueLinking";

// ─── ストアリセット ────────────────────────────────────────────────────
const resetStore = () => {
  useIntegrationLinkStore.setState({
    linksByLogId: {},
    githubPat: null,
    aiProviderConfig: null,
  });
  localStorage.clear();
};

const LOG_ID = "test-log-1";

// ─── テスト ──────────────────────────────────────────────────────────────
describe("GitHubIssueLinking", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    resetStore();
    mockFetchGitHubIssue.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  /** ヘッダーボタンを押してセクションを展開する */
  const expandSection = async () => {
    const headerBtn = container.querySelector(
      "button[aria-expanded]",
    ) as HTMLButtonElement;
    await act(async () => {
      headerBtn.click();
    });
  };

  /** 「紐付ける」ボタンを押してフォームを表示する */
  const openForm = async () => {
    const addBtn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("紐付ける"),
    )!;
    await act(async () => {
      addBtn.click();
    });
  };

  // TC-GL-01
  it("timeLogId に紐づくリンク一覧が表示される", async () => {
    useIntegrationLinkStore.getState().addLink(LOG_ID, {
      owner: "test-owner",
      repo: "test-repo",
      issueNumber: 42,
      issueTitle: "修正Issue",
      issueUrl: "https://github.com/test-owner/test-repo/issues/42",
    });
    await act(async () => {
      createRoot(container).render(<GitHubIssueLinking timeLogId={LOG_ID} />);
    });
    await expandSection();
    expect(container.textContent).toContain("test-owner/test-repo #42");
    expect(container.textContent).toContain("修正Issue");
  });

  // TC-GL-02
  it("「リンク追加」フォームで owner/repo・issueNumber を入力できる", async () => {
    await act(async () => {
      createRoot(container).render(<GitHubIssueLinking timeLogId={LOG_ID} />);
    });
    await expandSection();
    await openForm();

    const ownerRepoInput = container.querySelector(
      `#owner-repo-${LOG_ID}`,
    ) as HTMLInputElement;
    const issueNumInput = container.querySelector(
      `#issue-num-${LOG_ID}`,
    ) as HTMLInputElement;
    expect(ownerRepoInput).not.toBeNull();
    expect(issueNumInput).not.toBeNull();
  });

  // TC-GL-03
  it("「紐付け」クリックで fetchGitHubIssue が呼ばれ、成功後 addLink される", async () => {
    mockFetchGitHubIssue.mockResolvedValue({
      title: "テストIssue",
      issueUrl: "https://github.com/owner/repo/issues/1",
    });
    await act(async () => {
      createRoot(container).render(<GitHubIssueLinking timeLogId={LOG_ID} />);
    });
    await expandSection();
    await openForm();

    const ownerRepoInput = container.querySelector(
      `#owner-repo-${LOG_ID}`,
    ) as HTMLInputElement;
    const issueNumInput = container.querySelector(
      `#issue-num-${LOG_ID}`,
    ) as HTMLInputElement;

    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      nativeSetter?.call(ownerRepoInput, "myowner/myrepo");
      ownerRepoInput.dispatchEvent(new Event("input", { bubbles: true }));
      nativeSetter?.call(issueNumInput, "1");
      issueNumInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const submitBtn = Array.from(container.querySelectorAll("button")).find(
      (b) =>
        b.textContent?.trim() === "紐付け" ||
        b.textContent?.trim() === "取得中...",
    )!;
    await act(async () => {
      submitBtn.click();
    });

    expect(mockFetchGitHubIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "myowner",
        repo: "myrepo",
        issueNumber: 1,
      }),
    );

    // 非同期完了後、リンクが追加されていることを確認
    await act(async () => {
      await Promise.resolve();
    });
    expect(useIntegrationLinkStore.getState().getLinks(LOG_ID)).toHaveLength(1);
  });

  // TC-GL-04
  it("fetchGitHubIssue が 404 エラーを返すときエラーメッセージが表示される", async () => {
    mockFetchGitHubIssue.mockRejectedValue(
      new Error("Issue が見つかりません (404)"),
    );
    await act(async () => {
      createRoot(container).render(<GitHubIssueLinking timeLogId={LOG_ID} />);
    });
    await expandSection();
    await openForm();

    const ownerRepoInput = container.querySelector(
      `#owner-repo-${LOG_ID}`,
    ) as HTMLInputElement;
    const issueNumInput = container.querySelector(
      `#issue-num-${LOG_ID}`,
    ) as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      nativeSetter?.call(ownerRepoInput, "owner/repo");
      ownerRepoInput.dispatchEvent(new Event("input", { bubbles: true }));
      nativeSetter?.call(issueNumInput, "999");
      issueNumInput.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const submitBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "紐付け",
    )!;
    await act(async () => {
      submitBtn.click();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain("404");
  });

  // TC-GL-05
  it("「削除」クリックで removeLink が呼ばれリンクが消える", async () => {
    useIntegrationLinkStore.getState().addLink(LOG_ID, {
      owner: "owner",
      repo: "repo",
      issueNumber: 10,
      issueTitle: "削除テスト",
      issueUrl: "https://github.com/owner/repo/issues/10",
    });
    await act(async () => {
      createRoot(container).render(<GitHubIssueLinking timeLogId={LOG_ID} />);
    });
    await expandSection();

    const deleteBtn = container.querySelector(
      '[aria-label*="連携を解除"]',
    ) as HTMLButtonElement;
    await act(async () => {
      deleteBtn.click();
    });
    expect(useIntegrationLinkStore.getState().getLinks(LOG_ID)).toHaveLength(0);
  });
});
