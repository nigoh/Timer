import React, { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { useMeetingReportStore } from "@/features/timer/stores/meeting-report-store";
import { useIntegrationLinkStore } from "@/features/timer/stores/integration-link-store";
import { MeetingReport } from "@/types/meetingReport";

// ─── モック ──────────────────────────────────────────────────────────────────
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ value, children }: any) => (
    <button data-tab={value}>{children}</button>
  ),
  TabsContent: ({ value, children }: any) => (
    <div data-tabcontent={value}>{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ id, value, onChange, placeholder, readOnly }: any) => (
    <input
      id={id}
      value={value ?? ""}
      onChange={onChange ?? (() => {})}
      placeholder={placeholder}
      readOnly={readOnly}
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

vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({ id, value, onChange, readOnly, rows }: any) => (
    <textarea
      id={id}
      value={value ?? ""}
      onChange={onChange ?? (() => {})}
      readOnly={readOnly}
      rows={rows}
    />
  ),
}));

vi.mock("lucide-react", () => ({
  Plus: () => <span>plus</span>,
  Copy: () => <span>copy</span>,
  Save: () => <span>save</span>,
  Trash2: () => <span>trash</span>,
}));

vi.mock("@/features/timer/api/github-issues", () => ({
  fetchGitHubIssue: vi.fn().mockResolvedValue({ title: "Issue", body: "" }),
  postGitHubIssueComment: vi
    .fn()
    .mockResolvedValue({ commentUrl: "https://github.com/test" }),
}));

vi.mock("@/features/timer/utils/github-issue-agenda-parser", () => ({
  parseIssueTodoItems: vi.fn().mockReturnValue([]),
}));

vi.mock("@/features/timer/utils/meeting-report-post-template", () => ({
  buildPostPreviewMarkdown: vi.fn().mockReturnValue("# プレビュー"),
}));

vi.mock("@/features/timer/services/meeting-ai-assist-service", () => ({
  generateMeetingAiAssist: vi.fn().mockResolvedValue({
    assist: null,
    usedFallback: true,
  }),
}));

import { MeetingReportDialog } from "../MeetingReportDialog";

// ─── ストアリセット ───────────────────────────────────────────────────────────
const resetStores = () => {
  useMeetingReportStore.setState({
    reports: [],
    postedCommentHistory: [],
    draft: null,
    isDialogOpen: false,
  });
  useIntegrationLinkStore.setState({
    linksByLogId: {},
    githubPat: null,
    aiProviderConfig: null,
  });
  localStorage.clear();
};

// ─── ヘルパー ─────────────────────────────────────────────────────────────────
const makeDraft = (overrides: Partial<MeetingReport> = {}): MeetingReport => ({
  id: "r1",
  meetingId: "m1",
  meetingTitle: "週次定例",
  createdAt: "2026-02-20T09:00:00.000Z",
  heldAt: "2026-02-20T09:00:00.000Z",
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
  ],
  todos: [],
  markdown: "",
  ...overrides,
});

// ─── テスト ──────────────────────────────────────────────────────────────────
describe("MeetingReportDialog", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    resetStores();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  // TC-RD-01: draft=null のとき何も描画されない
  it("draft=null のとき何も描画されない", async () => {
    useMeetingReportStore.setState({ draft: null, isDialogOpen: false });
    await act(async () => {
      createRoot(container).render(<MeetingReportDialog />);
    });
    // コンポーネントが null を返すため dialog が存在しない
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.innerHTML).toBe("");
  });

  // TC-RD-02: isDialogOpen=true + draft あり → 会議名が input に表示される
  it("isDialogOpen=true かつ draft あり → 会議名が表示される", async () => {
    useMeetingReportStore.setState({
      draft: makeDraft(),
      isDialogOpen: true,
      reports: [],
      postedCommentHistory: [],
    });
    await act(async () => {
      createRoot(container).render(<MeetingReportDialog />);
    });
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    // meeting title は readOnly input に表示される
    const titleInput = container.querySelector(
      'input[id$="-meeting-title"]',
    ) as HTMLInputElement;
    expect(titleInput).not.toBeNull();
    expect(titleInput.value).toBe("週次定例");
  });

  // TC-RD-03: 参加者リスト input が表示される
  it("参加者リストが input に表示される", async () => {
    useMeetingReportStore.setState({
      draft: makeDraft(),
      isDialogOpen: true,
      reports: [],
      postedCommentHistory: [],
    });
    await act(async () => {
      createRoot(container).render(<MeetingReportDialog />);
    });
    const participantsInput = container.querySelector(
      'input[id$="-participants"]',
    ) as HTMLInputElement;
    expect(participantsInput).not.toBeNull();
    expect(participantsInput.value).toBe("山田, 佐藤");
  });

  // TC-RD-04: アジェンダ項目のタイトルが表示される
  it("アジェンダ項目のタイトルが表示される", async () => {
    useMeetingReportStore.setState({
      draft: makeDraft(),
      isDialogOpen: true,
      reports: [],
      postedCommentHistory: [],
    });
    await act(async () => {
      createRoot(container).render(<MeetingReportDialog />);
    });
    expect(container.textContent).toContain("進捗共有");
  });

  // TC-RD-09: 「キャンセル」クリックで setDialogOpen(false) が呼ばれる
  it("「キャンセル」クリックで isDialogOpen が false になる", async () => {
    useMeetingReportStore.setState({
      draft: makeDraft(),
      isDialogOpen: true,
      reports: [],
      postedCommentHistory: [],
    });
    await act(async () => {
      createRoot(container).render(<MeetingReportDialog />);
    });
    const cancelBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "キャンセル",
    )!;
    expect(cancelBtn).toBeDefined();
    await act(async () => {
      cancelBtn.click();
    });
    expect(useMeetingReportStore.getState().isDialogOpen).toBe(false);
  });
});
