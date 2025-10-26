// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { TimerDisplay } from './features/timer/components/timer-display';
import { PomodoroDisplay } from './features/timer/components/pomodoro-display';
import { TimerList } from './features/timer/components/timer-list';
import { useTimerStore } from './features/timer/stores/timer-store';
import { Button } from './components/ui/button';
import { Plus, Timer, Target, List } from 'lucide-react';
import { Timer as TimerType, PomodoroTimer } from './types/timer';
import './globals.css';

function App() {
  const { 
    timers, 
    activeTimer, 
    loading, 
    error, 
    loadAllData, 
    createTimer, 
    createPomodoroTimer,
    setActiveTimer 
  } = useTimerStore();
  
  const [activeTab, setActiveTab] = useState('timer');

  // アプリ初期化
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // クイック作成ボタン
  const handleQuickTimer = async () => {
    await createTimer({
      name: '作業タイマー',
      duration: 25 * 60, // 25分
      type: 'basic',
      theme: {
        color: 'default',
        variant: 'default',
        size: 'default',
      },
      notificationEnabled: true,
      soundEnabled: true,
    });
  };

  const handleQuickPomodoro = async () => {
    await createPomodoroTimer('作業集中', '仕事');
  };

  // アクティブタイマーまたは最初のタイマーを表示
  const displayTimer = activeTimer || timers[0];
  const displayPomodoroTimer = timers.find(t => t.type === 'pomodoro') as PomodoroTimer;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">エラーが発生しました</p>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>
            再読み込み
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Timer App</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleQuickTimer}>
                <Plus className="w-4 h-4 mr-2" />
                タイマー作成
              </Button>
              <Button variant="outline" size="sm" onClick={handleQuickPomodoro}>
                <Target className="w-4 h-4 mr-2" />
                ポモドーロ作成
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timer" className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              基本タイマー
            </TabsTrigger>
            <TabsTrigger value="pomodoro" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              ポモドーロ
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              タイマー一覧
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-6">
            {displayTimer && displayTimer.type !== 'pomodoro' ? (
              <TimerDisplay timer={displayTimer} />
            ) : (
              <div className="text-center py-12 space-y-4">
                <Timer className="w-16 h-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">タイマーがありません</h3>
                <p className="text-muted-foreground">
                  新しいタイマーを作成して開始しましょう
                </p>
                <Button onClick={handleQuickTimer}>
                  <Plus className="w-4 h-4 mr-2" />
                  タイマーを作成
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pomodoro" className="space-y-6">
            {displayPomodoroTimer ? (
              <PomodoroDisplay timer={displayPomodoroTimer} />
            ) : (
              <div className="text-center py-12 space-y-4">
                <Target className="w-16 h-16 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">ポモドーロタイマーがありません</h3>
                <p className="text-muted-foreground">
                  ポモドーロテクニックで生産性を向上させましょう
                </p>
                <Button onClick={handleQuickPomodoro}>
                  <Plus className="w-4 h-4 mr-2" />
                  ポモドーロタイマーを作成
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <TimerList 
              timers={timers}
              onTimerSelect={setActiveTimer}
              activeTimerId={activeTimer?.id}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
