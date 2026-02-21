import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRoot } from "react-dom/client";
import { useMultiTimerStore } from "@/features/timer/stores/multi-timer-store";

// ─── モック ──────────────────────────────────────────────────────────────
vi.mock("@/utils/notification-manager", () => ({
  notificationManager: {
    ensureInitialized: vi.fn().mockResolvedValue(undefined),
    playSound: vi.fn().mockResolvedValue(undefined),
    stopSound: vi.fn(),
    notify: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/utils", () => ({
  formatDuration: (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  },
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/constants/timer-theme", () => ({
  TIMER_STATUS_CONFIG: {
    running: {
      color: "text-green",
      label: "実行中",
      badgeVariant: "default",
      surfaceClass: "",
      icon: null,
    },
    paused: {
      color: "text-yellow",
      label: "一時停止",
      badgeVariant: "secondary",
      surfaceClass: "",
      icon: null,
    },
    completed: {
      color: "text-blue",
      label: "完了",
      badgeVariant: "outline",
      surfaceClass: "bg-green-50",
      icon: null,
    },
    idle: {
      color: "text-gray",
      label: "待機",
      badgeVariant: "outline",
      surfaceClass: "",
      icon: null,
    },
    overtime: {
      color: "text-red",
      label: "超過",
      badgeVariant: "destructive",
      surfaceClass: "",
      icon: null,
    },
    warning: {
      color: "text-orange",
      label: "警告",
      badgeVariant: "outline",
      surfaceClass: "",
      icon: null,
    },
  },
  getTimerStatus: (
    isRunning: boolean,
    isPaused: boolean,
    isCompleted: boolean,
  ) => {
    if (isRunning) return "running";
    if (isPaused) return "paused";
    if (isCompleted) return "completed";
    return "idle";
  },
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ id, value, onChange, required, placeholder, type, min }: any) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      type={type}
      min={min}
    />
  ),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: any) => (
    <span data-badge={variant}>{children}</span>
  ),
}));

vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value }: any) => <div data-progress={value} />,
}));

vi.mock("@/components/ui/dialog", () => ({
  // Dialog は open に関わらず常に children を描画（AddTimerDialog のフォームを可視化するため）
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({ id, value, onChange, rows, placeholder }: any) => (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
    />
  ),
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  ),
}));

vi.mock("lucide-react", () => ({
  Timer: () => <span>timer</span>,
  Clock: () => <span>clock</span>,
  Play: () => <span>play</span>,
  Pause: () => <span>pause</span>,
  Square: () => <span>square</span>,
  RotateCcw: () => <span>reset</span>,
  Plus: () => <span>plus</span>,
  Trash2: () => <span>trash</span>,
  Copy: () => <span>copy</span>,
  Settings: () => <span>settings</span>,
  PlayCircle: () => <span>playcircle</span>,
  PauseCircle: () => <span>pausecircle</span>,
}));

import { MultiTimerView } from "../MultiTimerView";

// ─── ストアリセット ────────────────────────────────────────────────────
const resetStore = () => {
  useMultiTimerStore.setState({
    timers: [],
    categories: ["仕事", "勉強", "運動", "休憩", "その他"],
    isAnyRunning: false,
    globalSettings: {
      autoStartNext: false,
      showNotifications: true,
      soundEnabled: true,
    },
    sessions: [],
  });
};

// ─── テスト ──────────────────────────────────────────────────────────────
describe("MultiTimerView", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    resetStore();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  // TC-MV-01
  it("timers が空のとき「タイマーがありません」が表示される", async () => {
    await act(async () => {
      createRoot(container).render(<MultiTimerView />);
    });
    expect(container.textContent).toContain("タイマーがありません");
  });

  // TC-MV-02
  it("timers が 2 件のときカード名が 2 つ表示される", async () => {
    useMultiTimerStore
      .getState()
      .addTimer({ name: "タイマーA", duration: 60, color: "bg-blue-500" });
    useMultiTimerStore
      .getState()
      .addTimer({ name: "タイマーB", duration: 120, color: "bg-red-500" });
    await act(async () => {
      createRoot(container).render(<MultiTimerView />);
    });
    expect(container.textContent).toContain("タイマーA");
    expect(container.textContent).toContain("タイマーB");
  });

  // TC-MV-03
  it("「開始」クリックでタイマーが実行状態になる", async () => {
    useMultiTimerStore
      .getState()
      .addTimer({ name: "作業", duration: 60, color: "bg-blue-500" });
    await act(async () => {
      createRoot(container).render(<MultiTimerView />);
    });
    const startBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("開始") && !b.disabled,
    )!;
    await act(async () => {
      startBtn.click();
    });
    const timer = useMultiTimerStore.getState().timers[0];
    expect(timer.isRunning).toBe(true);
  });

  // TC-MV-04
  it("「一時停止」クリックでタイマーが一時停止状態になる", async () => {
    useMultiTimerStore
      .getState()
      .addTimer({ name: "作業", duration: 60, color: "bg-blue-500" });
    const timerId = useMultiTimerStore.getState().timers[0].id;
    useMultiTimerStore.getState().startTimer(timerId);
    await act(async () => {
      createRoot(container).render(<MultiTimerView />);
    });
    const pauseBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("一時停止"),
    )!;
    await act(async () => {
      pauseBtn.click();
    });
    expect(useMultiTimerStore.getState().timers[0].isPaused).toBe(true);
  });

  // TC-MV-07
  it("「削除」クリックでタイマーが削除される", async () => {
    useMultiTimerStore
      .getState()
      .addTimer({ name: "消えるタイマー", duration: 60, color: "bg-blue-500" });
    await act(async () => {
      createRoot(container).render(<MultiTimerView />);
    });
    const deleteBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("削除"),
    )!;
    await act(async () => {
      deleteBtn.click();
    });
    expect(useMultiTimerStore.getState().timers).toHaveLength(0);
  });

  // TC-MV-08
  it("「すべて開始」クリックでタイマーが全て実行状態になる", async () => {
    useMultiTimerStore
      .getState()
      .addTimer({ name: "A", duration: 60, color: "bg-blue-500" });
    useMultiTimerStore
      .getState()
      .addTimer({ name: "B", duration: 60, color: "bg-red-500" });
    await act(async () => {
      createRoot(container).render(<MultiTimerView />);
    });
    const startAllBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("すべて開始"),
    )!;
    await act(async () => {
      startAllBtn.click();
    });
    const allRunning = useMultiTimerStore
      .getState()
      .timers.every((t) => t.isRunning);
    expect(allRunning).toBe(true);
  });

  // TC-MV-09
  it("「すべて停止」クリックでタイマーが全て停止する", async () => {
    useMultiTimerStore
      .getState()
      .addTimer({ name: "A", duration: 60, color: "bg-blue-500" });
    const timerId = useMultiTimerStore.getState().timers[0].id;
    useMultiTimerStore.getState().startTimer(timerId);
    await act(async () => {
      createRoot(container).render(<MultiTimerView />);
    });
    const stopAllBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("すべて停止"),
    )!;
    await act(async () => {
      stopAllBtn.click();
    });
    const noneRunning = useMultiTimerStore
      .getState()
      .timers.every((t) => !t.isRunning);
    expect(noneRunning).toBe(true);
  });

  // TC-MV-10: タイマー追加フォーム
  it("名前・時間入力→作成クリックで addTimer が呼ばれる", async () => {
    await act(async () => {
      createRoot(container).render(<MultiTimerView />);
    });
    const nameInput = container.querySelector(
      "#timer-name",
    ) as HTMLInputElement;
    const durationInput = container.querySelector(
      "#timer-duration",
    ) as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    await act(async () => {
      nativeSetter?.call(nameInput, "新タイマー");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      nativeSetter?.call(durationInput, "10:00");
      durationInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const createBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "作成",
    )!;
    await act(async () => {
      createBtn.click();
    });
    expect(useMultiTimerStore.getState().timers).toHaveLength(1);
    expect(useMultiTimerStore.getState().timers[0].name).toBe("新タイマー");
  });

  // TC-MV-12
  it("isCompleted=true のタイマーに「完了」バッジが表示される", async () => {
    useMultiTimerStore
      .getState()
      .addTimer({ name: "完了済み", duration: 60, color: "bg-blue-500" });
    const timerId = useMultiTimerStore.getState().timers[0].id;
    // 直接 completed に更新
    useMultiTimerStore.setState((state) => ({
      timers: state.timers.map((t) =>
        t.id === timerId ? { ...t, isCompleted: true } : t,
      ),
    }));
    await act(async () => {
      createRoot(container).render(<MultiTimerView />);
    });
    // 完了タイマーカードは TIMER_STATUS_CONFIG.completed.surfaceClass='bg-green-50' クラスを持つ
    expect(container.querySelector(".bg-green-50")).not.toBeNull();
  });
});
