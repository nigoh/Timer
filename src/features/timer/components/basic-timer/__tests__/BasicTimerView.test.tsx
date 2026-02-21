import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";

// ─── モック ──────────────────────────────────────────────────────────────
vi.mock("@/lib/utils", () => ({
  formatDuration: (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  },
}));

vi.mock("@/constants/timer-theme", () => ({
  TIMER_STATUS_CONFIG: {
    running: { badgeVariant: "default", label: "実行中" },
    paused: { badgeVariant: "secondary", label: "一時停止" },
    completed: { badgeVariant: "outline", label: "完了" },
    idle: { badgeVariant: "outline", label: "待機" },
  },
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-card>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ id, value, onChange, disabled, placeholder }: any) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: any) => <div data-progress={value} />,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock("@/components/TimerSettings", () => ({
  TimerSettings: ({ onDurationChange, duration }: any) => (
    <input
      data-testid="timer-settings"
      type="number"
      defaultValue={duration}
      onChange={(e) => onDurationChange(Number(e.target.value))}
    />
  ),
}));

vi.mock("@/components/TimerHistory", () => ({
  TimerHistory: () => <div data-testid="timer-history" />,
}));

vi.mock("lucide-react", () => ({
  Timer: () => <span>icon</span>,
  Play: () => <span>play</span>,
  Pause: () => <span>pause</span>,
  Square: () => <span>square</span>,
  RotateCcw: () => <span>reset</span>,
}));

import { BasicTimerView, BasicTimerViewProps } from "../BasicTimerView";
import type { BasicTimerHistory } from "@/types/timer";

// ─── ヘルパー ────────────────────────────────────────────────────────────
const makeProps = (
  overrides: Partial<BasicTimerViewProps> = {},
): BasicTimerViewProps => ({
  duration: 25 * 60,
  remainingTime: 25 * 60,
  isRunning: false,
  isPaused: false,
  sessionLabel: "",
  history: [],
  onSessionLabelChange: vi.fn(),
  onDurationChange: vi.fn(),
  onStart: vi.fn(),
  onPause: vi.fn(),
  onStop: vi.fn(),
  onReset: vi.fn(),
  onDeleteHistoryEntry: vi.fn(),
  onClearHistory: vi.fn(),
  ...overrides,
});

const makeHistoryEntry = (
  overrides: Partial<BasicTimerHistory> = {},
): BasicTimerHistory => ({
  id: "h1",
  duration: 1500,
  actualDuration: 1500,
  startTime: new Date(),
  endTime: new Date(),
  completed: true,
  label: "作業A",
  ...overrides,
});

// ─── テスト ──────────────────────────────────────────────────────────────
describe("BasicTimerView", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  // ── 表示 ──────────────────────────────────────────────────────────────
  describe("表示", () => {
    // TC-BV-01
    it('残り時間が "25:00" で表示される', async () => {
      await act(async () => {
        createRoot(container).render(<BasicTimerView {...makeProps()} />);
      });
      expect(container.textContent).toContain("25:00");
    });

    // TC-BV-02
    it("isRunning=false のとき「開始」ボタンが表示される", async () => {
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView
            {...makeProps({ isRunning: false, isPaused: false })}
          />,
        );
      });
      expect(container.textContent).toContain("開始");
      expect(container.textContent).not.toContain("一時停止");
    });

    // TC-BV-03
    it("isRunning=true のとき「一時停止」ボタンが表示される", async () => {
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView {...makeProps({ isRunning: true })} />,
        );
      });
      expect(container.textContent).toContain("一時停止");
    });

    // TC-BV-04
    it("isPaused=true のとき「再開」ボタンが表示される", async () => {
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView
            {...makeProps({ isRunning: false, isPaused: true })}
          />,
        );
      });
      expect(container.textContent).toContain("再開");
    });

    // TC-BV-05: remainingTime=0 かつ !isRunning → 完了バッジ
    it("remainingTime=0 かつ isRunning=false のとき「完了」バッジが表示される", async () => {
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView
            {...makeProps({ remainingTime: 0, isRunning: false })}
          />,
        );
      });
      const badge = container.querySelector('[data-testid="badge"]')!;
      expect(badge.textContent).toBe("完了");
    });
  });

  // ── 操作 ──────────────────────────────────────────────────────────────
  describe("操作", () => {
    // TC-BV-06
    it("「開始」ボタンクリックで onStart が呼ばれる", async () => {
      const onStart = vi.fn();
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView {...makeProps({ onStart })} />,
        );
      });
      const startBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("開始"),
      )!;
      await act(async () => {
        startBtn.click();
      });
      expect(onStart).toHaveBeenCalledTimes(1);
    });

    // TC-BV-07
    it("「一時停止」ボタンクリックで onPause が呼ばれる", async () => {
      const onPause = vi.fn();
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView {...makeProps({ isRunning: true, onPause })} />,
        );
      });
      const pauseBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("一時停止"),
      )!;
      await act(async () => {
        pauseBtn.click();
      });
      expect(onPause).toHaveBeenCalledTimes(1);
    });

    // TC-BV-08
    it("「リセット」ボタンクリックで onReset が呼ばれる", async () => {
      const onReset = vi.fn();
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView {...makeProps({ onReset })} />,
        );
      });
      const resetBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("リセット"),
      )!;
      await act(async () => {
        resetBtn.click();
      });
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    // TC-BV-09: 「停止」ボタンクリックで onStop が呼ばれる
    it("「停止」ボタンクリックで onStop が呼ばれる", async () => {
      const onStop = vi.fn();
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView {...makeProps({ isRunning: true, onStop })} />,
        );
      });
      const stopBtn = Array.from(container.querySelectorAll("button")).find(
        (b) =>
          b.textContent?.includes("停止") && !b.textContent?.includes("一時"),
      )!;
      await act(async () => {
        stopBtn.click();
      });
      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  // ── 履歴 ──────────────────────────────────────────────────────────────
  describe("履歴", () => {
    // TC-BV-10
    it("history にエントリがあるとき「最近のセッション」が表示される", async () => {
      const history = [makeHistoryEntry()];
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView {...makeProps({ history })} />,
        );
      });
      expect(container.textContent).toContain("最近のセッション");
    });

    // TC-BV-11
    it("history が空のとき「最近のセッション」は表示されない", async () => {
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView {...makeProps({ history: [] })} />,
        );
      });
      expect(container.textContent).not.toContain("最近のセッション");
    });

    it("completed=true のエントリに「完了」バッジが表示される", async () => {
      const history = [makeHistoryEntry({ completed: true })];
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView {...makeProps({ history })} />,
        );
      });
      const badges = Array.from(
        container.querySelectorAll('[data-testid="badge"]'),
      );
      expect(badges.some((b) => b.textContent === "完了")).toBe(true);
    });

    it("completed=false のエントリに「中断」バッジが表示される", async () => {
      const history = [makeHistoryEntry({ completed: false })];
      await act(async () => {
        createRoot(container).render(
          <BasicTimerView {...makeProps({ history })} />,
        );
      });
      const badges = Array.from(
        container.querySelectorAll('[data-testid="badge"]'),
      );
      expect(badges.some((b) => b.textContent === "中断")).toBe(true);
    });
  });
});
