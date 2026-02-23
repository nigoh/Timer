import React from "react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, Root } from "react-dom/client";

vi.mock("../features/timer/containers/UnifiedTimer", () => ({
  UnifiedTimer: () => <div>UnifiedTimer</div>,
}));

vi.mock("../features/timer/containers/AgendaTimer", () => ({
  AgendaTimer: () => <div>AgendaTimer</div>,
}));

vi.mock("../features/timer/containers/Dashboard", () => ({
  Dashboard: () => <div>Dashboard</div>,
}));

vi.mock("../features/timer/containers/MeetingReports", () => ({
  MeetingReports: () => <div>MeetingReports</div>,
}));

vi.mock("../features/timer/components/agenda/MeetingReportDialog", () => ({
  MeetingReportDialog: () => null,
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

vi.mock("../components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
  }) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
}));

vi.mock("../components/ui/tabs", () => {
  const TabsContext = React.createContext<string>("");
  return {
    Tabs: ({
      value,
      children,
    }: {
      value: string;
      onValueChange?: (value: string) => void;
      className?: string;
      children: React.ReactNode;
    }) => <TabsContext.Provider value={value}>{children}</TabsContext.Provider>,
    TabsContent: ({
      value,
      children,
    }: {
      value: string;
      children: React.ReactNode;
    }) => {
      const currentTab = React.useContext(TabsContext);
      return currentTab === value ? <div>{children}</div> : null;
    },
  };
});

vi.mock("@radix-ui/themes", () => ({
  Theme: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("lucide-react", () => {
  const Icon = () => <span aria-hidden="true" />;
  return {
    Timer: Icon,
    List: Icon,
    FileText: Icon,
    Moon: Icon,
    Sun: Icon,
    PanelLeftClose: Icon,
    PanelLeftOpen: Icon,
    Settings: Icon,
    BarChart2: Icon,
    Menu: Icon,
  };
});

const mockUIPreferencesState = {
  sidebarOpen: true,
  toggleSidebar: vi.fn(),
};

vi.mock("../features/timer/stores/ui-preferences-store", () => ({
  useUIPreferencesStore: (
    selector: (state: typeof mockUIPreferencesState) => unknown,
  ) => selector(mockUIPreferencesState),
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

  it("モバイルではメニューボタンから会議機能へ切り替えられる", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root: Root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    const openMenuButton = container.querySelector(
      'button[aria-label="メニューを開く"]',
    );
    expect(openMenuButton).not.toBeNull();

    await act(async () => {
      openMenuButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();

    const agendaButton = Array.from(dialog?.querySelectorAll("button") ?? []).find(
      (button) => button.textContent?.trim() === "会議",
    );
    expect(agendaButton).not.toBeUndefined();

    await act(async () => {
      agendaButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    expect(container.textContent).toContain("AgendaTimer");
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
