import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { useIntegrationLinkStore } from "@/features/timer/stores/integration-link-store";
import { BasicTimerHistory } from "@/types/timer";

// ─── モック ──────────────────────────────────────────────────────────────────
vi.mock("@/components/ui/dialog", () => ({
  // Dialog は open に関わらず常に children を描画してコンテンツを可視化する
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: any) => (
    <span data-badge={variant}>{children}</span>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, size }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("lucide-react", () => ({
  History: () => <span>history</span>,
  CheckCircle2: () => <span data-testid="check">✓</span>,
  XCircle: () => <span data-testid="xcircle">✗</span>,
  Clock: () => <span>clock</span>,
  Trash2: () => <span>trash</span>,
  Calendar: () => <span>cal</span>,
}));

vi.mock("date-fns", () => ({
  formatDistanceToNow: () => "1日前",
}));

vi.mock("date-fns/locale", () => ({
  ja: {},
}));

vi.mock("@/constants/timer-theme", () => ({
  TIMER_STATUS_CONFIG: {
    completed: { color: "text-green-600" },
    paused: { color: "text-yellow-600" },
    warning: { color: "text-orange-600" },
  },
}));

vi.mock("@/components/GitHubIssueLinking", () => ({
  GitHubIssueLinking: () => null,
}));

vi.mock("@/features/timer/utils/integration-stats", () => ({
  buildIntegrationIssueStats: vi.fn().mockReturnValue([]),
}));

import { TimerHistory } from "../TimerHistory";

// ─── ストアリセット ───────────────────────────────────────────────────────────
const resetStore = () => {
  useIntegrationLinkStore.setState({
    linksByLogId: {},
    githubPat: null,
    aiProviderConfig: null,
  });
  localStorage.clear();
};

// ─── ヘルパー ─────────────────────────────────────────────────────────────────
const makeEntry = (
  overrides: Partial<BasicTimerHistory> = {},
): BasicTimerHistory => ({
  id: crypto.randomUUID(),
  duration: 1500,
  actualDuration: 1500,
  startTime: new Date("2026-02-20T09:00:00.000Z"),
  endTime: new Date("2026-02-20T09:25:00.000Z"),
  completed: true,
  label: "テスト作業",
  ...overrides,
});

const defaultProps = {
  history: [] as BasicTimerHistory[],
  onDeleteEntry: vi.fn(),
  onClearHistory: vi.fn(),
};

// ─── テスト ──────────────────────────────────────────────────────────────────
describe("TimerHistory", () => {
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

  // TC-TH-01: 履歴が空のとき「履歴がありません」が表示される
  it("履歴が空のとき「履歴がありません」が表示される", async () => {
    await act(async () => {
      createRoot(container).render(
        <TimerHistory {...defaultProps} history={[]} />,
      );
    });
    expect(container.textContent).toContain("履歴がありません");
  });

  // TC-TH-02: 各エントリの label・duration・日時が表示される
  it("各エントリの label・duration・日時が表示される", async () => {
    const entry = makeEntry({
      label: "レポート作成",
      duration: 900,
      actualDuration: 900,
    });
    await act(async () => {
      createRoot(container).render(
        <TimerHistory {...defaultProps} history={[entry]} />,
      );
    });
    expect(container.textContent).toContain("レポート作成");
    // formatTime(900) = "15:00"
    expect(container.textContent).toContain("15:00");
  });

  // TC-TH-03: completed=true のエントリに「完了」バッジが表示される
  it("completed=true のエントリに「完了」バッジが表示される", async () => {
    const entry = makeEntry({ completed: true });
    await act(async () => {
      createRoot(container).render(
        <TimerHistory {...defaultProps} history={[entry]} />,
      );
    });
    expect(container.textContent).toContain("完了");
  });

  // TC-TH-04: completed=false のエントリに「中断」バッジが表示される
  it("completed=false のエントリに「中断」バッジが表示される", async () => {
    const entry = makeEntry({ completed: false });
    await act(async () => {
      createRoot(container).render(
        <TimerHistory {...defaultProps} history={[entry]} />,
      );
    });
    expect(container.textContent).toContain("中断");
  });
});
