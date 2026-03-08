import React, { useState, useCallback } from "react";
import { Button } from "./components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./components/ui/breadcrumb";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { Toaster } from "./components/ui/sonner";
import { Moon, Sun } from "lucide-react";
import { MeetingReportDialog } from "./features/timer/components/agenda/MeetingReportDialog";
import { TaskWidgetCanvas } from "./features/timer/components/task-list/TaskWidgetCanvas";
import { TaskListSidebar } from "./features/timer/components/task-list/TaskListSidebar";
import { TaskCreateDialog } from "./features/timer/components/task-list/TaskCreateDialog";
import { EmptyTaskView } from "./features/timer/components/task-list/EmptyTaskView";
import { CommandPalette } from "./features/timer/components/task-list/CommandPalette";
import SettingsAndLogsPage from "./components/SettingsAndLogsPage";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import { TaskIdProvider } from "./features/timer/contexts/TaskIdContext";
import { logger } from "./utils/logger";
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
} from "./features/timer/stores/task-store";
import { useTickManagerStore } from "./features/timer/stores/tick-manager-store";
import { useIsMobile } from "./hooks/useIsMobile";
import { AuthContainer } from "./features/auth/containers/AuthContainer";
import { useAuthStore } from "./features/auth/auth-store";
import {
  onAuthStateChange,
  getCurrentUser,
} from "./features/auth/auth-service";
import { syncAll } from "./features/sync/sync-service";
import { useSyncStore } from "./features/sync/sync-store";
import { migrateGuestData } from "./features/sync/migration-service";
import { subscribe, unsubscribe } from "./features/sync/realtime-service";
import { useLayoutOverlapDetection } from "./hooks/useLayoutOverlapDetection";
import "./globals.css";

function App() {
  const [colorMode, setColorMode] = useState<ColorMode>(getInitialColorMode);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const sidebarOpen = useUIPreferencesStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIPreferencesStore((s) => s.setSidebarOpen);

  const activeTask = useTaskStore(selectActiveTask);
  const activeTaskId = useTaskStore((s) => s.activeTaskId);
  const showSettings = useTaskStore((s) => s.showSettings);
  const setShowSettings = useTaskStore((s) => s.setShowSettings);

  const sidebarHeaderRef = useLayoutOverlapDetection("SidebarHeader");

  // グローバルTickの開始（全タイマーインスタンスを1秒間隔で処理）
  React.useEffect(() => {
    useTickManagerStore.getState().startGlobalTick();
    return () => {
      useTickManagerStore.getState().stopGlobalTick();
    };
  }, []);

  // 認証状態の初期化・購読
  React.useEffect(() => {
    const { setUser, setLoading } = useAuthStore.getState();
    setLoading(true);

    // 起動時に現在のセッションを確認
    getCurrentUser().then((user) => {
      setUser(user);
      if (user) {
        migrateGuestData()
          .then(() => syncAll())
          .then(() => subscribe(user.id))
          .catch(() => {});
      }
    });

    // 認証状態変化を購読（ログイン・ログアウト）
    const unsubscribeAuth = onAuthStateChange((user) => {
      const prevUser = useAuthStore.getState().user;
      setUser(user);
      if (user) {
        // 新規ログイン時のみ移行を実行
        const isNewLogin = !prevUser;
        const action = isNewLogin
          ? migrateGuestData().then(() => syncAll())
          : syncAll();
        action.then(() => subscribe(user.id)).catch(() => {});
      } else {
        unsubscribe();
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribe();
    };
  }, []);

  // オンライン/オフライン・可視性変化で同期
  React.useEffect(() => {
    const { setOnline } = useSyncStore.getState();

    function handleOnline() {
      setOnline(true);
      syncAll().catch(() => {});
    }
    function handleOffline() {
      setOnline(false);
      useSyncStore.getState().setStatus("offline");
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        syncAll().catch(() => {});
      }
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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

  const currentLabel = React.useMemo(() => {
    if (showSettings) return "設定・ログ";
    return activeTask?.name ?? "Focuso";
  }, [showSettings, activeTask]);

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      className="!min-h-0 h-[100svh] overflow-hidden"
      style={
        {
          "--sidebar-width": "12rem",
          "--sidebar-width-icon": "3.5rem",
        } as React.CSSProperties
      }
    >
      {/* ── 左サイドバー ── */}
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div ref={sidebarHeaderRef} className="flex items-center gap-2">
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
            <span className="flex-1 font-semibold group-data-[collapsible=icon]:hidden">
              Focuso
            </span>
            <SidebarTrigger className="ml-auto" />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <TaskListSidebar
            onCreateTask={handleOpenCreate}
            onOpenSettings={handleOpenSettings}
          />
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={colorMode === "dark" ? "ライトモード" : "ダークモード"}
                onClick={handleColorModeToggle}
              >
                {colorMode === "dark" ? (
                  <Sun className="h-4 w-4 shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 shrink-0" />
                )}
                <span>{colorMode === "dark" ? "ライト" : "ダーク"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="px-2 pb-1">
            <AuthContainer />
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* ── メインコンテンツ ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* モバイルヘッダー */}
        {isMobile && (
          <div className="flex items-center gap-2 border-b border-border p-2">
            <SidebarTrigger />
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
          {/* デスクトップ用パンくずナビ */}
          {!isMobile && (
            <Breadcrumb className="mb-2">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage
                    className={
                      showSettings || activeTask
                        ? "text-muted-foreground font-normal"
                        : ""
                    }
                  >
                    Focuso
                  </BreadcrumbPage>
                </BreadcrumbItem>
                {(showSettings || activeTask) && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {showSettings ? "設定・ログ" : activeTask?.name}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          )}
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

      {/* タスク作成ダイアログ */}
      <TaskCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <MeetingReportDialog />
      <CommandPalette
        colorMode={colorMode}
        onToggleColorMode={handleColorModeToggle}
        onCreateTask={handleOpenCreate}
        onOpenSettings={handleOpenSettings}
      />
      <Toaster />
    </SidebarProvider>
  );
}

export default App;
