import React, { act } from "react";
import { describe, expect, beforeEach, afterEach, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import type { VoiceTranscriptEntry } from "@/types/voice";

// ---- useVoiceRecognition モック ----
const mockVoiceHook = {
  isListening: false,
  confirmedEntries: [] as VoiceTranscriptEntry[],
  interimTranscript: "",
  clearTranscript: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  setLanguage: vi.fn(),
  isSupported: true,
  language: "ja-JP" as const,
  error: null,
  currentAgendaId: null,
};

vi.mock("@/features/timer/hooks/useVoiceRecognition", () => ({
  useVoiceRecognition: () => mockVoiceHook,
}));

// ---- agenda-timer-store モック ----
const mockUpdateAgendaMinutes = vi.fn();
vi.mock("@/features/timer/stores/agenda-timer-store", () => ({
  useAgendaTimerStore: () => ({
    updateAgendaMinutes: mockUpdateAgendaMinutes,
    currentMeeting: {
      id: "meeting-1",
      agenda: [
        {
          id: "agenda-1",
          title: "議題1",
          minutesContent: "既存のメモ",
          minutesFormat: "markdown",
        },
      ],
    },
  }),
}));

// ---- UI コンポーネントのモック ----
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler;
    disabled?: boolean;
    "aria-label"?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("lucide-react", () => ({
  ChevronDown: () => <span>▼</span>,
  ChevronUp: () => <span>▲</span>,
  Trash2: () => <span>trash</span>,
  Mic: () => <span>mic</span>,
  MicOff: () => <span>micoff</span>,
  Check: () => <span>check</span>,
  Sparkles: () => <span>sparkles</span>,
}));

vi.mock("@radix-ui/themes", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

import { VoiceTranscriptPanel } from "../VoiceTranscriptPanel";

describe("VoiceTranscriptPanel", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    mockVoiceHook.isListening = false;
    mockVoiceHook.confirmedEntries = [];
    mockVoiceHook.interimTranscript = "";
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  const renderPanel = async (
    props: Partial<React.ComponentProps<typeof VoiceTranscriptPanel>> = {},
  ) => {
    const defaultProps = {
      meetingId: "meeting-1",
      agendaId: "agenda-1",
      minutesFormat: "markdown" as const,
      onRequestSummaryDialog: vi.fn(),
      ...props,
    };
    await act(async () => {
      createRoot(container).render(<VoiceTranscriptPanel {...defaultProps} />);
    });
    return defaultProps;
  };

  it("初期状態はパネルが折りたたまれている（本文が非表示）", async () => {
    await renderPanel();
    expect(container.textContent).toContain("文字起こし");
    expect(container.textContent).not.toContain("お話しください");
  });

  it("ヘッダークリックでパネルが開く", async () => {
    await renderPanel();

    const header = container.querySelector('[role="button"]')!;
    await act(async () => {
      header.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain(
      "録音を開始すると文字起こしが表示されます",
    );
  });

  it("isListening=true のとき「録音中」バッジが表示される", async () => {
    mockVoiceHook.isListening = true;
    await renderPanel();
    expect(container.textContent).toContain("録音中");
  });

  it("isListening=true のときパネルが自動展開される", async () => {
    mockVoiceHook.isListening = true;
    await renderPanel();
    expect(container.textContent).toContain("お話しください");
  });

  it("confirmedEntries がある場合、件数が表示される", async () => {
    mockVoiceHook.confirmedEntries = [
      { id: "e1", text: "発言1", timestamp: Date.now(), agendaId: null },
      { id: "e2", text: "発言2", timestamp: Date.now(), agendaId: null },
    ];
    await renderPanel();
    expect(container.textContent).toContain("2件");
  });

  it("パネルを開いたとき confirmedEntries のテキストが表示される", async () => {
    mockVoiceHook.confirmedEntries = [
      { id: "e1", text: "重要な発言", timestamp: Date.now(), agendaId: null },
    ];
    await renderPanel();

    const header = container.querySelector('[role="button"]')!;
    await act(async () => {
      header.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("重要な発言");
  });

  it("パネルを開いたとき interimTranscript が表示される", async () => {
    mockVoiceHook.interimTranscript = "入力途中のテキスト...";
    mockVoiceHook.isListening = true;
    await renderPanel();
    expect(container.textContent).toContain("入力途中のテキスト...");
  });

  it("minutesFormat=markdown のとき「議事録に追加」アイコンボタンが表示される", async () => {
    mockVoiceHook.isListening = true;
    await renderPanel({ minutesFormat: "markdown" });

    const buttons = Array.from(container.querySelectorAll("button"));
    const insertBtn = buttons.find(
      (b) => b.getAttribute("aria-label") === "議事録に追加",
    );
    expect(insertBtn).toBeTruthy();
  });

  it("minutesFormat=richtext のとき「AI要約して議事録に追加」アイコンボタンが表示される", async () => {
    mockVoiceHook.isListening = true;
    await renderPanel({ minutesFormat: "richtext" });

    const buttons = Array.from(container.querySelectorAll("button"));
    const insertBtn = buttons.find(
      (b) => b.getAttribute("aria-label") === "AI要約して議事録に追加",
    );
    expect(insertBtn).toBeTruthy();
  });

  it("confirmedEntries がないとき「議事録に追加」ボタンが disabled", async () => {
    mockVoiceHook.confirmedEntries = [];
    mockVoiceHook.isListening = true;
    await renderPanel({ minutesFormat: "markdown" });

    const buttons = Array.from(container.querySelectorAll("button"));
    const insertBtn = buttons.find(
      (b) => b.getAttribute("aria-label") === "議事録に追加",
    );
    expect(insertBtn?.disabled).toBe(true);
  });

  it("markdown 形式で「議事録に追加」クリックすると updateAgendaMinutes が呼ばれる", async () => {
    mockVoiceHook.confirmedEntries = [
      { id: "e1", text: "議事内容", timestamp: Date.now(), agendaId: null },
    ];
    mockVoiceHook.isListening = true;
    await renderPanel({ minutesFormat: "markdown" });

    const buttons = Array.from(container.querySelectorAll("button"));
    const insertBtn = buttons.find(
      (b) => b.getAttribute("aria-label") === "議事録に追加" && !b.disabled,
    )!;

    await act(async () => {
      insertBtn.click();
    });

    expect(mockUpdateAgendaMinutes).toHaveBeenCalledTimes(1);
    expect(mockUpdateAgendaMinutes).toHaveBeenCalledWith(
      "meeting-1",
      "agenda-1",
      expect.objectContaining({
        minutesContent: expect.stringContaining("議事内容"),
      }),
    );
  });

  it("richtext 形式で「AI要約して議事録に追加」クリックすると onRequestSummaryDialog が呼ばれる", async () => {
    mockVoiceHook.confirmedEntries = [
      { id: "e1", text: "発言", timestamp: Date.now(), agendaId: null },
    ];
    mockVoiceHook.isListening = true;
    const onRequestSummaryDialog = vi.fn();
    await renderPanel({ minutesFormat: "richtext", onRequestSummaryDialog });

    const buttons = Array.from(container.querySelectorAll("button"));
    const insertBtn = buttons.find(
      (b) =>
        b.getAttribute("aria-label") === "AI要約して議事録に追加" &&
        !b.disabled,
    )!;

    await act(async () => {
      insertBtn.click();
    });

    expect(onRequestSummaryDialog).toHaveBeenCalledTimes(1);
    expect(mockUpdateAgendaMinutes).not.toHaveBeenCalled();
  });

  it("クリアボタンをクリックすると clearTranscript が呼ばれる", async () => {
    mockVoiceHook.confirmedEntries = [
      { id: "e1", text: "発言", timestamp: Date.now(), agendaId: null },
    ];
    mockVoiceHook.isListening = true;
    await renderPanel();

    const buttons = Array.from(container.querySelectorAll("button"));
    const clearBtn = buttons.find(
      (b) => b.getAttribute("aria-label") === "文字起こしをクリア",
    );

    expect(clearBtn).toBeTruthy();
    await act(async () => {
      clearBtn!.click();
    });
    expect(mockVoiceHook.clearTranscript).toHaveBeenCalledTimes(1);
  });

  it("Enter キーでもパネルを開閉できる", async () => {
    await renderPanel();

    const header = container.querySelector('[role="button"]')!;
    await act(async () => {
      header.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });

    expect(container.textContent).toContain(
      "録音を開始すると文字起こしが表示されます",
    );
  });
});
