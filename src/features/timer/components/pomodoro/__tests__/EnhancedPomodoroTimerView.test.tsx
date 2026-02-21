import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import type { PomodoroPhase, PomodoroSettings } from "@/types/pomodoro";

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
    running: {
      label: "実行中",
      badgeVariant: "default",
      color: "text-green-500",
    },
    paused: {
      label: "一時停止",
      badgeVariant: "secondary",
      color: "text-yellow-500",
    },
    idle: { label: "待機", badgeVariant: "outline", color: "text-gray-500" },
    completed: { color: "text-blue-500" },
    overtime: { color: "text-red-500" },
  },
  POMODORO_PHASE_COLORS: {
    work: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      progress: "bg-orange-500",
    },
    shortBreak: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      progress: "bg-green-500",
    },
    longBreak: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      progress: "bg-blue-500",
    },
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

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange, id }: any) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

vi.mock("@/components/ui/slider", () => ({
  Slider: ({ value, onValueChange, id }: any) => (
    <input
      id={id}
      type="range"
      value={value?.[0] ?? 0}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
    />
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: any) => <>{children}</>,
}));

vi.mock("lucide-react", () => ({
  Target: () => <span>target</span>,
  Play: () => <span>play</span>,
  Pause: () => <span>pause</span>,
  Square: () => <span>square</span>,
  RotateCcw: () => <span>reset</span>,
  Settings: () => <span>settings</span>,
  Coffee: () => <span>coffee</span>,
  Zap: () => <span>zap</span>,
  SkipForward: () => <span>skip</span>,
  Calendar: () => <span>calendar</span>,
  TrendingUp: () => <span>trend</span>,
}));

import { EnhancedPomodoroTimerView } from "../EnhancedPomodoroTimerView";

// ─── ヘルパー ────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartWork: false,
};

const DEFAULT_STATS = {
  completedPomodoros: 0,
  totalFocusTime: 0,
  totalBreakTime: 0,
  efficiency: 0,
};

const makeProps = (
  overrides: Partial<Parameters<typeof EnhancedPomodoroTimerView>[0]> = {},
) => ({
  currentPhase: "work" as PomodoroPhase,
  timeRemaining: 25 * 60,
  isRunning: false,
  isPaused: false,
  cycle: 1,
  settings: { ...DEFAULT_SETTINGS },
  todayStats: { ...DEFAULT_STATS },
  taskName: "",
  onTaskNameChange: vi.fn(),
  onStart: vi.fn(),
  onPause: vi.fn(),
  onStop: vi.fn(),
  onSkip: vi.fn(),
  onReset: vi.fn(),
  onSettingsSave: vi.fn(),
  ...overrides,
});

// ─── テスト ──────────────────────────────────────────────────────────────
describe("EnhancedPomodoroTimerView", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  // ── フェーズ表示 ───────────────────────────────────────────────────────
  describe("フェーズ表示", () => {
    // TC-PV-01
    it("currentPhase=work のとき「作業時間」が表示される", async () => {
      await act(async () => {
        createRoot(container).render(
          <EnhancedPomodoroTimerView
            {...makeProps({ currentPhase: "work" })}
          />,
        );
      });
      expect(container.textContent).toContain("作業時間");
    });

    // TC-PV-02
    it("currentPhase=short-break のとき「短い休憩」が表示される", async () => {
      await act(async () => {
        createRoot(container).render(
          <EnhancedPomodoroTimerView
            {...makeProps({
              currentPhase: "short-break",
              timeRemaining: 5 * 60,
            })}
          />,
        );
      });
      expect(container.textContent).toContain("短い休憩");
    });

    // TC-PV-03
    it("currentPhase=long-break のとき「長い休憩」が表示される", async () => {
      await act(async () => {
        createRoot(container).render(
          <EnhancedPomodoroTimerView
            {...makeProps({
              currentPhase: "long-break",
              timeRemaining: 15 * 60,
            })}
          />,
        );
      });
      expect(container.textContent).toContain("長い休憩");
    });

    // TC-PV-04
    it('残り時間が正しくフォーマット表示される（例: "25:00"）', async () => {
      await act(async () => {
        createRoot(container).render(
          <EnhancedPomodoroTimerView
            {...makeProps({ timeRemaining: 25 * 60 - 1 })}
          />,
        );
      });
      expect(container.textContent).toContain("24:59");
    });
  });

  // ── 操作 ──────────────────────────────────────────────────────────────
  describe("操作", () => {
    // TC-PV-05
    it("「開始」クリックで onStart が呼ばれる", async () => {
      const onStart = vi.fn();
      await act(async () => {
        createRoot(container).render(
          <EnhancedPomodoroTimerView
            {...makeProps({ isRunning: false, onStart })}
          />,
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

    // TC-PV-06
    it("「一時停止」クリックで onPause が呼ばれる", async () => {
      const onPause = vi.fn();
      await act(async () => {
        createRoot(container).render(
          <EnhancedPomodoroTimerView
            {...makeProps({ isRunning: true, onPause })}
          />,
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

    // TC-PV-07
    it("「リセット」クリックで onReset が呼ばれる", async () => {
      const onReset = vi.fn();
      await act(async () => {
        createRoot(container).render(
          <EnhancedPomodoroTimerView {...makeProps({ onReset })} />,
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

    // TC-PV-08: workフェーズ以外ではタスク名 input が表示されない
    it("currentPhase=short-break のときタスク名 input が表示されない", async () => {
      await act(async () => {
        createRoot(container).render(
          <EnhancedPomodoroTimerView
            {...makeProps({
              currentPhase: "short-break",
              timeRemaining: 5 * 60,
            })}
          />,
        );
      });
      expect(container.querySelector("#task-name")).toBeNull();
    });
  });

  // ── 統計 ──────────────────────────────────────────────────────────────
  describe("統計", () => {
    // TC-PV-11
    it("completedPomodoros の数が表示される", async () => {
      await act(async () => {
        createRoot(container).render(
          <EnhancedPomodoroTimerView
            {...makeProps({
              todayStats: { ...DEFAULT_STATS, completedPomodoros: 3 },
            })}
          />,
        );
      });
      expect(container.textContent).toContain("3");
      expect(container.textContent).toContain("完了ポモドーロ");
    });

    // TC-PV-12
    it("completedPomodoros>0 のとき達成率がパーセント表示される", async () => {
      await act(async () => {
        createRoot(container).render(
          <EnhancedPomodoroTimerView
            {...makeProps({
              settings: { ...DEFAULT_SETTINGS, workDuration: 25 },
              todayStats: {
                ...DEFAULT_STATS,
                completedPomodoros: 1,
                totalFocusTime: 25,
              },
            })}
          />,
        );
      });
      // (25 / (1 * 25)) * 100 = 100%
      expect(container.textContent).toContain("100%");
    });
  });
});
