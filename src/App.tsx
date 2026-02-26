import React, { useState, useCallback } from "react";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Theme, Tooltip } from "@radix-ui/themes";
import {
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Settings,
  Plus,
} from "lucide-react";
import { MeetingReportDialog } from "./features/timer/components/agenda/MeetingReportDialog";
import { TaskWidgetCanvas } from "./features/timer/components/task-list/TaskWidgetCanvas";
import { TaskListSidebar } from "./features/timer/components/task-list/TaskListSidebar";
import { TaskCreateDialog } from "./features/timer/components/task-list/TaskCreateDialog";
import { EmptyTaskView } from "./features/timer/components/task-list/EmptyTaskView";
import { LucideDynamicIcon } from "./features/timer/components/task-list/LucideDynamicIcon";
import SettingsAndLogsPage from "./components/SettingsAndLogsPage";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import { TaskIdProvider } from "./features/timer/contexts/TaskIdContext";
import { logger } from "./utils/logger";
import { cn } from "./lib/utils";
import {
  applyColorMode,
  ColorMode,
  getInitialColorMode,
  persistColorMode,
} from "./utils/color-mode";
import { useUIPreferencesStore } from "./features/timer/stores/ui-preferences-store";
import {
  useTaskStore,
  selectActiveTask,
  selectSortedTasks,
} from "./features/timer/stores/task-store";
import { useTickManagerStore } from "./features/timer/stores/tick-manager-store";
import { useIsMobile } from "./hooks/useIsMobile";
import "./globals.css";

function App() {
  const [colorMode, setColorMode] = useState<ColorMode>(getInitialColorMode);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const sidebarOpen = useUIPreferencesStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIPreferencesStore((s) => s.toggleSidebar);

  const activeTask = useTaskStore(selectActiveTask);
  const tasks = useTaskStore(selectSortedTasks);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const showSettings = useTaskStore((s) => s.showSettings);
  const setShowSettings = useTaskStore((s) => s.setShowSettings);
  const setActiveTask = useTaskStore((s) => s.setActiveTask);

  // グローバルTickの開始（全タイマーインスタンスを1秒間隔で処理）
  React.useEffect(() => {
    useTickManagerStore.getState().startGlobalTick();
    return () => {
      useTickManagerStore.getState().stopGlobalTick();
    };
  }, []);

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

  React.useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  const handleColorModeToggle = useCallback(() => {
    setColorMode((prevMode) => {
      const nextMode = prevMode === "dark" ? "light" : "dark";
      logger.userAction("Color mode switched", {
        from: prevMode,
        to: nextMode,
      });
      return nextMode;
    });
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, [setShowSettings]);

  const handleOpenCreate = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleSelectTaskMobile = useCallback(
    (taskId: string) => {
      setActiveTask(taskId);
      setIsMobileMenuOpen(false);
    },
    [setActiveTask],
  );

  const currentLabel = React.useMemo(() => {
    if (showSettings) return "設定・ログ";
    return activeTask?.name ?? "Focuso";
  }, [showSettings, activeTask]);

  return (
    <Theme appearance={colorMode}>
      <div className="flex h-[100svh] overflow-hidden bg-background text-foreground">
        {/* ── 左サイドバー（デスクトップ） ── */}
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-r border-border bg-card transition-all duration-200 md:flex",
            sidebarOpen ? "md:w-48" : "md:w-14",
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
              className="h-8 w-8 shrink-0 ml-auto"
              onClick={() => toggleSidebar()}
              aria-label={sidebarOpen ? "メニューを閉じる" : "メニューを開く"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* タスク一覧サイドバー */}
          <TaskListSidebar
            sidebarOpen={sidebarOpen}
            onCreateTask={handleOpenCreate}
            onOpenSettings={handleOpenSettings}
          />

          {/* ダークモード切替 */}
          <div
            className={cn(
              "flex shrink-0 flex-col gap-1 border-t border-border p-2",
              sidebarOpen ? "items-stretch" : "items-center",
            )}
          >
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
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* モバイルヘッダー */}
          {isMobile && (
            <div className="flex items-center gap-2 border-b border-border p-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="メニューを開く"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <p className="text-sm font-semibold">{currentLabel}</p>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto"
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
            </div>
          )}

          {/* メイン表示領域 */}
          <main className="flex-1 overflow-y-auto p-2 md:p-3">
            {showSettings ? (
              <SettingsAndLogsPage />
            ) : activeTask && activeTaskId ? (
              <ErrorBoundary componentName="TaskWidgetCanvas">
                <TaskIdProvider value={activeTaskId}>
                  <TaskWidgetCanvas taskId={activeTaskId} />
                </TaskIdProvider>
              </ErrorBoundary>
            ) : (
              <EmptyTaskView onCreateTask={handleOpenCreate} />
            )}
          </main>
          <Footer />
        </div>
      </div>

      {/* モバイルメニュー */}
      <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <DialogContent className="max-w-sm p-4">
          <DialogHeader>
            <DialogTitle>タスク一覧</DialogTitle>
            <DialogDescription>
              タスクを選択するか、新しいタスクを作成してください。
            </DialogDescription>
          </DialogHeader>
          <nav className="flex flex-col gap-2" aria-label="モバイルメニュー">
            {tasks.map((task) => (
              <Button
                key={task.id}
                variant={
                  activeTaskId === task.id && !showSettings
                    ? "default"
                    : "outline"
                }
                className="justify-start gap-2"
                onClick={() => handleSelectTaskMobile(task.id)}
              >
                <LucideDynamicIcon name={task.icon} className="h-4 w-4" />
                <span className="text-sm">{task.name}</span>
              </Button>
            ))}
            <Button
              variant="outline"
              className="justify-start gap-2 text-muted-foreground"
              onClick={() => {
                setIsCreateDialogOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">タスクを追加</span>
            </Button>
            <hr className="my-1" />
            <Button
              variant={showSettings ? "default" : "outline"}
              className="justify-start gap-2"
              onClick={() => {
                handleOpenSettings();
                setIsMobileMenuOpen(false);
              }}
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">設定・ログ</span>
            </Button>
          </nav>
        </DialogContent>
      </Dialog>

      {/* タスク作成ダイアログ */}
      <TaskCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <MeetingReportDialog />
    </Theme>
  );
}

export default App;
