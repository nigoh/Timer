import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import './globals.css';

function App() {
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25分
  const [isRunning, setIsRunning] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const start = () => {
    if (timeRemaining > 0 && !isRunning) {
      setIsRunning(true);
      const id = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            clearInterval(id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setIntervalId(id);
    }
  };

  const pause = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsRunning(false);
  };

  const reset = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsRunning(false);
    setTimeRemaining(25 * 60);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4">
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold mb-2">Timer App</h1>
          <p className="text-muted-foreground">
            業務効率化を目的とした多機能タイマーアプリケーション
          </p>
        </header>
        
        <main className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-center justify-center">
                <Timer className="h-6 w-6" />
                ポモドーロタイマー
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-6xl font-mono font-bold">
                {formatTime(timeRemaining)}
              </div>
              
              <div className="flex justify-center gap-2">
                {!isRunning ? (
                  <Button onClick={start} size="lg" disabled={timeRemaining === 0}>
                    <Play className="mr-2 h-4 w-4" />
                    開始
                  </Button>
                ) : (
                  <Button onClick={pause} variant="outline" size="lg">
                    <Pause className="mr-2 h-4 w-4" />
                    一時停止
                  </Button>
                )}
                
                <Button onClick={reset} variant="outline" size="lg">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  リセット
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

export default App;
