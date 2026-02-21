import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { useMeetingReportStore } from "@/features/timer/stores/meeting-report-store";
import { MeetingReport } from "@/types/meetingReport";

// ─── モック ──────────────────────────────────────────────────────────────────
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, "aria-label": ariaLabel, type }: any) => (
    <button onClick={onClick} aria-label={ariaLabel} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({ value, readOnly }: any) => (
    <textarea value={value ?? ""} readOnly={readOnly} onChange={() => {}} />
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock("@radix-ui/themes", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
}));

vi.mock("lucide-react", () => ({
  ClipboardCopy: () => <span>copy</span>,
  Eye: () => <span>eye</span>,
  FileText: () => <span>file</span>,
  Trash2: () => <span>trash</span>,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

import { MeetingReportHistory } from "../MeetingReportHistory";

// ─── ストアリセット ───────────────────────────────────────────────────────────
const resetStore = () => {
  useMeetingReportStore.setState({
    reports: [],
    postedCommentHistory: [],
    draft: null,
    isDialogOpen: false,
  });
  localStorage.clear();
};

// ─── ヘルパー ─────────────────────────────────────────────────────────────────
const makeReport = (overrides: Partial<MeetingReport> = {}): MeetingReport => ({
  id: "r1",
  meetingId: "m1",
  meetingTitle: "週次定例",
  createdAt: "2026-02-20T09:00:00.000Z",
  heldAt: "2026-02-20T09:00:00.000Z",
  participants: ["山田", "佐藤"],
  summary: "サマリー",
  decisions: "決定事項",
  nextActions: "アクション",
  agendaItems: [],
  todos: [],
  markdown: "# 週次定例",
  ...overrides,
});

// ─── テスト ──────────────────────────────────────────────────────────────────
describe("MeetingReportHistory", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    resetStore();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  // TC-RH-01: reports が空のとき「レポートはまだありません」が表示される
  it("reports が空のとき「レポートはまだありません」が表示される", async () => {
    await act(async () => {
      createRoot(container).render(<MeetingReportHistory />);
    });
    expect(container.textContent).toContain("レポートはまだありません");
  });

  // TC-RH-02: 各レポートに会議タイトルが表示される
  it("各レポートに会議タイトルが表示される", async () => {
    useMeetingReportStore.setState({
      reports: [makeReport()],
      postedCommentHistory: [],
      draft: null,
      isDialogOpen: false,
    });
    await act(async () => {
      createRoot(container).render(<MeetingReportHistory />);
    });
    expect(container.textContent).toContain("週次定例");
  });

  // TC-RH-03: レポート行クリックでレポート詳細ダイアログが開く
  it("レポート行クリックでレポート詳細ダイアログが開く", async () => {
    useMeetingReportStore.setState({
      reports: [makeReport()],
      postedCommentHistory: [],
      draft: null,
      isDialogOpen: false,
    });
    await act(async () => {
      createRoot(container).render(<MeetingReportHistory />);
    });
    // 初期状態ではダイアログは表示されない
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    const row = container.querySelector('li[role="button"]') as HTMLElement;
    expect(row).not.toBeNull();
    await act(async () => {
      row.click();
    });
    // クリック後にダイアログが開く
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain("レポート詳細");
  });
});
