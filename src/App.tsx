import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { Timer, List, Target, Clock, Bug } from "lucide-react";
import { BasicTimer } from "./features/timer/containers/BasicTimer";
import { AgendaTimer } from "./features/timer/containers/AgendaTimer";
import { EnhancedPomodoroTimer } from "./features/timer/containers/EnhancedPomodoroTimer";
import { MultiTimer } from "./features/timer/containers/MultiTimer";
import LogViewer from "./components/LogViewer";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import { logger } from "./utils/logger";
import "./globals.css";

function App() {
  const [activeTab, setActiveTab] = useState("basic");

  // アプリケーション開始ログ
  React.useEffect(() => {
    logger.info(
      "Application started",
      {
        userAgent: navigator.userAgent,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      "app",
    );
  }, []);

  // タブ切り替えログ
  const handleTabChange = (value: string) => {
    logger.userAction("Tab switched", {
      from: activeTab,
      to: value,
    });
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="w-full flex-1 px-2 md:px-3">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex h-full w-full flex-col"
        >
          <header className="mb-2 flex items-center gap-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-card">
              <Timer className="h-5 w-5" />
            </div>

            <TabsList className="grid h-10 flex-1 grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                <span className="inline text-xs md:hidden">基本</span>
                <span className="hidden md:inline">基本タイマー</span>
              </TabsTrigger>
              <TabsTrigger value="pomodoro" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="inline text-xs md:hidden">ポモ</span>
                <span className="hidden md:inline">ポモドーロ</span>
              </TabsTrigger>
              <TabsTrigger value="agenda" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                <span className="inline text-xs md:hidden">会議</span>
                <span className="hidden md:inline">アジェンダ</span>
              </TabsTrigger>
              <TabsTrigger value="multi" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="inline text-xs md:hidden">複数</span>
                <span className="hidden md:inline">複数タイマー</span>
              </TabsTrigger>
            </TabsList>

            <LogViewer>
              <Button variant="outline" size="sm">
                <Bug className="w-4 h-4 md:mr-2" />
                <span className="inline">ログ</span>
              </Button>
            </LogViewer>
          </header>

          <main className="flex-1">
            <TabsContent value="basic">
              <ErrorBoundary componentName="BasicTimer">
                <BasicTimer />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="pomodoro">
              <ErrorBoundary componentName="EnhancedPomodoroTimer">
                <EnhancedPomodoroTimer />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="agenda">
              <ErrorBoundary componentName="AgendaTimer">
                <AgendaTimer />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="multi">
              <ErrorBoundary componentName="MultiTimer">
                <MultiTimer />
              </ErrorBoundary>
            </TabsContent>
          </main>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}

export default App;
