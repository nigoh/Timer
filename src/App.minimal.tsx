import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Timer, Target, Bug, Minimize2, X, Settings } from 'lucide-react';
import { BasicTimer } from './components/BasicTimer';
import { EnhancedPomodoroTimer } from './components/EnhancedPomodoroTimer';
import LogViewer from './components/LogViewer';
import ErrorBoundary from './components/ErrorBoundary';
import { logger } from './utils/logger';
import { useElectron, useElectronEvents } from './hooks/useElectron';
import './globals.css';

function App() {
  const [activeTab, setActiveTab] = useState('basic');
  const { isElectronApp, sendNotification, minimizeWindow, closeWindow } = useElectron();
  const { onShowSettings, onCreateNewTimer } = useElectronEvents();

  // アプリケーション開始ログ
  React.useEffect(() => {
    logger.info('Application started', {
      userAgent: navigator.userAgent,
      isElectronApp,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }, 'app');

    // Electronアプリの場合は起動通知を送信
    if (isElectronApp) {
      sendNotification('Timer App', 'アプリケーションが起動しました');
    }
  }, [isElectronApp, sendNotification]);

  // タブ切り替えログ
  const handleTabChange = (value: string) => {
    logger.userAction('Tab switched', {
      from: activeTab,
      to: value
    });
    setActiveTab(value);
  };

  // Electronイベントの設定
  React.useEffect(() => {
    if (!isElectronApp) return;

    // 設定表示イベント
    const cleanupSettings = onShowSettings(() => {
      logger.userAction('Settings opened from menu');
      // TODO: 設定画面を表示
      console.log('設定画面を表示');
    });

    // 新しいタイマー作成イベント
    const cleanupNewTimer = onCreateNewTimer(() => {
      logger.userAction('New timer created from menu');
      setActiveTab('basic'); // 基本タイマータブに切り替え
    });

    return () => {
      cleanupSettings();
      cleanupNewTimer();
    };
  }, [isElectronApp, onShowSettings, onCreateNewTimer]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4">
        <header className="text-center py-8 relative">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Timer className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Timer App</h1>
            {isElectronApp && <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">Desktop</span>}
          </div>
          <p className="text-muted-foreground">
            業務効率化を目的とした多機能タイマーアプリケーション
          </p>
          
          {/* ツールバー */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isElectronApp && (
              <>
                <Button variant="outline" size="sm" onClick={minimizeWindow}>
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={closeWindow}>
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
            <LogViewer>
              <Button variant="outline" size="sm">
                <Bug className="w-4 h-4 mr-2" />
                ログ
              </Button>
            </LogViewer>
          </div>
        </header>
        
        <main>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                基本タイマー
              </TabsTrigger>
              <TabsTrigger value="pomodoro" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                ポモドーロ
              </TabsTrigger>
            </TabsList>

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
          </Tabs>
        </main>
      </div>
    </div>
  );
}

export default App;