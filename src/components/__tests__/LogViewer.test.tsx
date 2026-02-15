import React, { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { LogLevel } from "@/utils/logger";
import LogViewer from "../LogViewer";

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    getStoredLogs: vi.fn(),
    getLogStatistics: vi.fn(),
    exportLogs: vi.fn(() => "[]"),
    clearLogs: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/utils/logger", async () => {
  const actual =
    await vi.importActual<typeof import("@/utils/logger")>("@/utils/logger");
  return {
    ...actual,
    logger: mockLogger,
  };
});

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    onOpenChange,
  }: {
    children: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
  }) => {
    React.useEffect(() => {
      onOpenChange?.(true);
    }, [onOpenChange]);

    return <div>{children}</div>;
  },
  DialogTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      aria-label="select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <>{placeholder}</>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} />
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3>{children}</h3>
  ),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TabsTrigger: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  TabsContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("lucide-react", () => ({
  Download: () => <span>download</span>,
  Trash2: () => <span>trash</span>,
  Copy: () => <span>copy</span>,
  Bug: () => <span>bug</span>,
  AlertTriangle: () => <span>alert</span>,
  Info: () => <span>info</span>,
  Zap: () => <span>zap</span>,
  Eye: () => <span>eye</span>,
}));

const logs = [
  {
    id: "1",
    timestamp: new Date("2024-01-01T00:00:00Z"),
    level: LogLevel.ERROR,
    category: "error",
    message: "Network down",
    data: { detail: "timeout" },
    sessionId: "s1",
  },
  {
    id: "2",
    timestamp: new Date("2024-01-01T00:00:01Z"),
    level: LogLevel.INFO,
    category: "ui",
    message: "UI loaded",
    data: { page: "home" },
    sessionId: "s1",
  },
];

describe("LogViewer", () => {
  let container: HTMLDivElement;
  const writeText = vi.fn();

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);

    mockLogger.getStoredLogs.mockReturnValue(logs);
    mockLogger.getLogStatistics.mockReturnValue({
      totalLogs: 2,
      logsByLevel: { ERROR: 1, INFO: 1 },
      logsByCategory: { error: 1, ui: 1 },
      sessionCount: 1,
      oldestLog: new Date("2024-01-01T00:00:00Z"),
      newestLog: new Date("2024-01-01T00:00:01Z"),
    });
    mockLogger.clearLogs.mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      },
    });
    writeText.mockResolvedValue(undefined);
  });

  // REQ-5.6
  it("レベル・カテゴリ・全文検索・各ログのAI向けコピー・クリア処理が動作する", async () => {
    await act(async () => {
      createRoot(container).render(
        <LogViewer>
          <button>open</button>
        </LogViewer>,
      );
    });

    expect(container.textContent).toContain("Network down");
    expect(container.textContent).toContain("UI loaded");

    const selects = container.querySelectorAll("select");
    const search = container.querySelector("input")!;
    const clearButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("クリア"),
    )!;

    await act(async () => {
      selects[0].value = "ERROR";
      selects[0].dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(container.textContent).toContain("Network down");
    expect(container.textContent).not.toContain("UI loaded");

    await act(async () => {
      const copyButton = Array.from(container.querySelectorAll("button")).find(
        (button) =>
          button.textContent?.includes("このログをAI解析文としてコピー"),
      )!;
      copyButton.click();
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("Network down");
    expect(writeText.mock.calls[0][0]).not.toContain("UI loaded");
    expect(container.textContent).toContain(
      "このログのAI分析文をコピーしました",
    );

    await act(async () => {
      selects[0].value = "all";
      selects[0].dispatchEvent(new Event("change", { bubbles: true }));
      selects[1].value = "all";
      selects[1].dispatchEvent(new Event("change", { bubbles: true }));
      search.value = "timeout";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      search.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.textContent).toContain("Network down");

    await act(async () => {
      clearButton.click();
    });

    expect(mockLogger.clearLogs).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("ログがありません");
  });
});
