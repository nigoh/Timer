import React, { useState } from "react";
import { Tabs, TabsContent } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { Theme, Tooltip } from "@radix-ui/themes";
import {
  Timer,
  List,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  BarChart2,
} from "lucide-react";
import { UnifiedTimer } from "./features/timer/containers/UnifiedTimer";
import { AgendaTimer } from "./features/timer/containers/AgendaTimer";
import { Dashboard } from "./features/timer/containers/Dashboard";
import SettingsAndLogsPage from "./components/SettingsAndLogsPage";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import { logger } from "./utils/logger";
import { cn } from "./lib/utils";
import {
  applyColorMode,
  ColorMode,
  getInitialColorMode,
  persistColorMode,
} from "./utils/color-mode";
import "./globals.css";

const NAV_ITEMS = [
  { value: "timer", Icon: Timer, label: "タイマー" },
  { value: "agenda", Icon: List, label: "会議" },
  { value: "analytics", Icon: BarChart2, label: "分析" },
] as const;

function App() {
  const [activeTab, setActiveTab] = useState("timer");
  const [colorMode, setColorMode] = useState<ColorMode>(getInitialColorMode);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem("sidebar-open") === "true";
    } catch {
      return false;
    }
  });
  const handleSidebarToggle = () => {
    setSidebarOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem("sidebar-open", String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  React.useEffect(() => {
    logger.info(
      "Application started",
      {
        userAgent: navigator.userAgent,
        screen: { width: window.screen.width, height: window.screen.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      },
      "app",
    );
  }, []);

  React.useEffect(() => {
    applyColorMode(colorMode);
    persistColorMode(colorMode);
  }, [colorMode]);

  const handleTabChange = (value: string) => {
    logger.userAction("Tab switched", { from: activeTab, to: value });
    setActiveTab(value);
  };

  const handleColorModeToggle = () => {
    setColorMode((prevMode) => {
      const nextMode = prevMode === "dark" ? "light" : "dark";
      logger.userAction("Color mode switched", {
        from: prevMode,
        to: nextMode,
      });
      return nextMode;
    });
  };

  return (
    <Theme appearance={colorMode}>
      <div className="flex min-h-[100svh] bg-background text-foreground">
        {/* ── 左サイドバー ── */}
        <aside
          className={cn(
            "flex shrink-0 flex-col border-r border-border bg-card transition-all duration-200",
            sidebarOpen ? "w-48" : "w-14",
          )}
        >
          {/* ロゴ + 開閉ボタン */}
          <div className="flex h-14 shrink-0 items-center px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md overflow-hidden">
              <img
                src={
                  colorMode === "dark"
                    ? "/focuso-logo-dark.svg"
                    : "/focuso-logo-light.svg"
                }
                alt="Focuso"
                className="h-8 w-8"
              />
            </div>
            {sidebarOpen && (
              <span className="ml-2 flex-1 font-semibold">Focuso</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 shrink-0",
                sidebarOpen ? "ml-auto" : "ml-auto",
              )}
              onClick={() => handleSidebarToggle()}
              aria-label={sidebarOpen ? "メニューを閉じる" : "メニューを開く"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 py-1" aria-label="メインナビゲーション">
            {NAV_ITEMS.map(({ value, Icon, label }) => {
              const isActive = activeTab === value;
              const btnOpen = (
                <button
                  key={value}
                  onClick={() => handleTabChange(value)}
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex w-full items-center gap-3 px-2 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-primary" />
                  )}
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </button>
              );
              const btnClosed = (
                <button
                  onClick={() => handleTabChange(value)}
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex w-full items-center justify-center py-3 text-sm transition-colors",
                    isActive
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-y-1 left-0 w-0.5 rounded-r bg-primary" />
                  )}
                  <Icon className="h-5 w-5 shrink-0" />
                </button>
              );
              return sidebarOpen ? (
                <React.Fragment key={value}>{btnOpen}</React.Fragment>
              ) : (
                <Tooltip key={value} content={label} side="right">
                  {btnClosed}
                </Tooltip>
              );
            })}
          </nav>

          {/* ダークモード・設定 */}
          <div
            className={cn(
              "flex shrink-0 flex-col gap-1 border-t border-border p-2",
              sidebarOpen ? "items-stretch" : "items-center",
            )}
          >
            {sidebarOpen ? (
              <Button
                variant="ghost"
                className={cn(
                  "h-9 w-full justify-start gap-3 px-2 shrink-0",
                  activeTab === "settings" &&
                    "bg-accent text-accent-foreground",
                )}
                onClick={() => handleTabChange("settings")}
                aria-label="設定・ログを開く"
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span className="text-sm">設定・ログ</span>
              </Button>
            ) : (
              <Tooltip content="設定・ログ" side="right">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-9 w-9 shrink-0",
                    activeTab === "settings" &&
                      "bg-accent text-accent-foreground",
                  )}
                  onClick={() => handleTabChange("settings")}
                  aria-label="設定・ログを開く"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                </Button>
              </Tooltip>
            )}
            {sidebarOpen ? (
              <Button
                variant="ghost"
                className="h-9 w-full justify-start gap-3 px-2 shrink-0"
                onClick={handleColorModeToggle}
                aria-label={
                  colorMode === "dark"
                    ? "ライトモードに切り替え"
                    : "ダークモードに切り替え"
                }
              >
                {colorMode === "dark" ? (
                  <Sun className="h-4 w-4 shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 shrink-0" />
                )}
                <span className="text-sm">
                  {colorMode === "dark" ? "ライト" : "ダーク"}
                </span>
              </Button>
            ) : (
              <Tooltip
                content={colorMode === "dark" ? "ライトモード" : "ダークモード"}
                side="right"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleColorModeToggle}
                  aria-label={
                    colorMode === "dark"
                      ? "ライトモードに切り替え"
                      : "ダークモードに切り替え"
                  }
                >
                  {colorMode === "dark" ? (
                    <Sun className="h-4 w-4 shrink-0" />
                  ) : (
                    <Moon className="h-4 w-4 shrink-0" />
                  )}
                </Button>
              </Tooltip>
            )}
          </div>
        </aside>

        {/* ── メインコンテンツ ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="flex flex-1 flex-col"
          >
            <main className="flex-1 p-2 md:p-3">
              <TabsContent value="timer">
                <ErrorBoundary componentName="UnifiedTimer">
                  <UnifiedTimer />
                </ErrorBoundary>
              </TabsContent>
              <TabsContent value="agenda">
                <ErrorBoundary componentName="AgendaTimer">
                  <AgendaTimer />
                </ErrorBoundary>
              </TabsContent>
              <TabsContent value="analytics">
                <ErrorBoundary componentName="Dashboard">
                  <Dashboard />
                </ErrorBoundary>
              </TabsContent>
              <TabsContent value="settings">
                <SettingsAndLogsPage />
              </TabsContent>
            </main>
          </Tabs>
          <Footer />
        </div>
      </div>
    </Theme>
  );
}

export default App;
