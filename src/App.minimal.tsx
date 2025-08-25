import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Timer, Target, Bug } from 'lucide-react';
import { BasicTimer } from './components/BasicTimer';
import { EnhancedPomodoroTimer } from './components/EnhancedPomodoroTimer';
import LogViewer from './components/LogViewer';
import ErrorBoundary from './components/ErrorBoundary';
import { logger } from './utils/logger';
import './globals.css';

function App() {
  const [activeTab, setActiveTab] = useState('basic');

  // アプリケーション開始ログ
  React.useEffect(() => {
    logger.info('Application started', {
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }, 'app');
  }, []);

  // タブ切り替えログ
  const handleTabChange = (value: string) => {
    logger.userAction('Tab switched', {
      from: activeTab,
      to: value
    });
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4">
        <header className="text-center py-8 relative">
          <h1 className="text-4xl font-bold mb-2">Timer App</h1>
          <p className="text-muted-foreground">
            業務効率化を目的とした多機能タイマーアプリケーション
          </p>
          
          {/* ログビューアーボタン */}
          <div className="absolute top-4 right-4">
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