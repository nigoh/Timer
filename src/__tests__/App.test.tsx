import React, { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, Root } from "react-dom/client";

vi.mock("../features/timer/components/task-list/TaskWidgetCanvas", () => ({
  TaskWidgetCanvas: ({ taskId }: { taskId: string }) => (
    <div>TaskWidgetCanvas:{taskId}</div>
  ),
}));

vi.mock("../features/timer/components/task-list/TaskListSidebar", () => ({
  TaskListSidebar: ({
    onCreateTask,
    onOpenSettings,
  }: {
    onCreateTask: () => void;
    onOpenSettings: () => void;
  }) => (
    <div>
      <button onClick={onCreateTask}>タスクを追加</button>
      <button onClick={onOpenSettings}>設定・ログを開く</button>
    </div>
  ),
}));

vi.mock("../features/timer/components/task-list/TaskCreateDialog", () => ({
  TaskCreateDialog: ({
    open,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
  }) => (open ? <div data-testid="create-dialog">CreateDialog</div> : null),
}));

vi.mock("../features/timer/components/task-list/EmptyTaskView", () => ({
  EmptyTaskView: ({ onCreateTask }: { onCreateTask: () => void }) => (
    <div>
      <span>タスクがありません</span>
      <button onClick={onCreateTask}>最初のタスクを作成</button>
    </div>
  ),
}));

vi.mock("../features/timer/components/agenda/MeetingReportDialog", () => ({
  MeetingReportDialog: () => null,
}));

vi.mock("../features/timer/components/task-list/CommandPalette", () => ({
  CommandPalette: () => null,
}));

vi.mock("../components/SettingsAndLogsPage", () => ({
  default: () => <div>SettingsAndLogsPage</div>,
}));

vi.mock("../components/ErrorBoundary", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("../components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("lucide-react", () => {
  const Icon = () => <span aria-hidden="true" />;
  return {
    Moon: Icon,
    Sun: Icon,
    PanelLeft: Icon,
    Cloud: Icon,
    CloudOff: Icon,
    CloudAlert: Icon,
    Loader2: Icon,
    LogIn: Icon,
    LogOut: Icon,
    User: Icon,
    Github: Icon,
    ChevronRight: Icon,
    Check: Icon,
    Circle: Icon,
  };
});

vi.mock("../features/auth/containers/AuthContainer", () => ({
  AuthContainer: () => null,
}));

vi.mock("../features/auth/auth-store", () => {
  const state = { user: null, isLoading: false, setUser: () => {}, setLoading: () => {}, clearUser: () => {} };
  const hook = (selector: (s: typeof state) => unknown) => selector(state);
  hook.getState = () => state;
  hook.setState = () => {};
  hook.subscribe = () => () => {};
  return {
    useAuthStore: hook,
    selectIsAuthenticated: (s: { user: unknown }) => s.user !== null,
  };
});

vi.mock("../features/auth/auth-service", () => ({
  onAuthStateChange: vi.fn(() => () => {}),
  getCurrentUser: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("../features/sync/sync-service", () => ({
  syncAll: vi.fn(() => Promise.resolve()),
}));

vi.mock("../features/sync/sync-store", () => {
  const syncState = { status: 'idle', lastSyncAt: null, isOnline: true, setStatus: () => {}, setOnline: () => {}, setLastSyncAt: () => {} };
  const hook = (selector: (s: typeof syncState) => unknown) => selector(syncState);
  hook.getState = () => syncState;
  hook.setState = () => {};
  hook.subscribe = () => () => {};
  return { useSyncStore: hook };
});

vi.mock("../features/sync/migration-service", () => ({
  migrateGuestData: vi.fn(() => Promise.resolve()),
}));

vi.mock("../features/sync/realtime-service", () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}));

const mockUIPreferencesState = {
  sidebarOpen: true,
  toggleSidebar: vi.fn(),
  setSidebarOpen: vi.fn(),
};

vi.mock("../features/timer/stores/ui-preferences-store", () => ({
  useUIPreferencesStore: (
    selector: (state: typeof mockUIPreferencesState) => unknown,
  ) => selector(mockUIPreferencesState),
}));

const mockTaskStore = {
  tasks: [] as Array<{
    id: string;
    name: string;
    icon: string;
    widgets: never[];
    order: number;
    createdAt: number;
    updatedAt: number;
  }>,
  activeTaskId: null as string | null,
  showSettings: false,
  setShowSettings: vi.fn(),
  setActiveTask: vi.fn(),
  isEditMode: false,
  presets: [],
};

vi.mock("../features/timer/stores/task-store", () => ({
  useTaskStore: (selector: (state: typeof mockTaskStore) => unknown) =>
    selector(mockTaskStore),
  selectActiveTask: (state: typeof mockTaskStore) =>
    state.tasks.find((t) => t.id === state.activeTaskId),
  selectSortedTasks: (state: typeof mockTaskStore) =>
    [...state.tasks].sort((a, b) => a.order - b.order),
}));

vi.mock("../features/timer/stores/tick-manager-store", () => ({
  useTickManagerStore: {
    getState: () => ({
      startGlobalTick: vi.fn(),
      stopGlobalTick: vi.fn(),
    }),
  },
}));

vi.mock("../features/timer/contexts/TaskIdContext", () => ({
  TaskIdProvider: ({
    children,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <>{children}</>,
}));

vi.mock("../utils/color-mode", () => ({
  applyColorMode: vi.fn(),
  getInitialColorMode: () => "light",
  persistColorMode: vi.fn(),
}));

vi.mock("../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    userAction: vi.fn(),
  },
}));

import App from "../App";

describe("App", () => {
  beforeEach(() => {
    // Reset mock task store
    mockTaskStore.tasks = [];
    mockTaskStore.activeTaskId = null;
    mockTaskStore.showSettings = false;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query === "(max-width: 767px)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it("タスクがない場合、EmptyTaskView が表示される", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain("タスクがありません");

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it("タスクがある場合、TaskWidgetCanvas が表示される", async () => {
    mockTaskStore.tasks = [
      {
        id: "t1",
        name: "テストタスク",
        icon: "Timer",
        widgets: [],
        order: 0,
        createdAt: 0,
        updatedAt: 0,
      },
    ];
    mockTaskStore.activeTaskId = "t1";

    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain("TaskWidgetCanvas:t1");

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
