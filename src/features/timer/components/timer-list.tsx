import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Plus, Play, Pause, Trash2, Edit, Clock } from 'lucide-react';
import { Timer, TimerType } from '../../../types/timer';
import { formatTime, formatDuration, cn } from '../../../lib/utils';

interface TimerListProps {
  timers: Timer[];
  activeTimer?: Timer | null;
  activeTimerId?: string;
  onTimerSelect: (timer: Timer | null) => void;
  onTimerCreate: (timer: Omit<Timer, 'id' | 'createdAt'>) => void;
  onTimerUpdate: (id: string, updates: Partial<Timer>) => void;
  onTimerDelete: (id: string) => void;
  onTimerStart: (id: string) => void;
  onTimerPause: (id: string) => void;
}

export function TimerList({
  timers,
  activeTimer,
  activeTimerId,
  onTimerSelect,
  onTimerCreate,
  onTimerUpdate,
  onTimerDelete,
  onTimerStart,
  onTimerPause,
}: TimerListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTimer, setEditingTimer] = useState<Timer | null>(null);
  const [newTimerData, setNewTimerData] = useState({
    name: '',
    duration: 25, // 分
    type: 'basic' as TimerType,
    category: '',
    notificationEnabled: true,
    soundEnabled: true,
  });

  const currentActiveTimer =
    activeTimer ??
    (activeTimerId ? timers.find((timer) => timer.id === activeTimerId) ?? null : null);

  const basicTimers = timers.filter((timer) => timer.type === 'basic');
  const pomodoroTimers = timers.filter((timer) => timer.type === 'pomodoro');

  const handleCreateTimer = () => {
    const durationInSeconds = newTimerData.duration * 60;
    
    const timer: Omit<Timer, 'id' | 'createdAt'> = {
      name: newTimerData.name,
      duration: durationInSeconds,
      remainingTime: durationInSeconds,
      status: 'idle',
      category: newTimerData.category,
      type: newTimerData.type,
      theme: {
        color: 'default',
        variant: 'default',
        size: 'default',
      },
      notificationEnabled: newTimerData.notificationEnabled,
      soundEnabled: newTimerData.soundEnabled,
    };

    onTimerCreate(timer);
    setIsCreateDialogOpen(false);
    setNewTimerData({
      name: '',
      duration: 25,
      type: 'basic',
      category: '',
      notificationEnabled: true,
      soundEnabled: true,
    });
  };

  const handleUpdateTimer = (timer: Timer) => {
    if (!editingTimer) return;
    
    onTimerUpdate(editingTimer.id, {
      name: timer.name,
      category: timer.category,
      notificationEnabled: timer.notificationEnabled,
      soundEnabled: timer.soundEnabled,
    });
    setEditingTimer(null);
  };

  const getTimerStatusIcon = (timer: Timer) => {
    switch (timer.status) {
      case 'running':
        return <Play className="h-4 w-4 text-green-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const TimerCard = ({ timer }: { timer: Timer }) => (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        currentActiveTimer?.id === timer.id && "ring-2 ring-primary"
      )}
      onClick={() => onTimerSelect(timer)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{timer.name}</CardTitle>
          {getTimerStatusIcon(timer)}
        </div>
        {timer.category && (
          <p className="text-xs text-muted-foreground">{timer.category}</p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-lg font-mono font-bold">
            {formatTime(timer.remainingTime)}
          </div>
          
          <div className="text-xs text-muted-foreground">
            全体: {formatDuration(timer.duration)}
          </div>
          
          <div className="flex gap-1">
            {timer.status === 'running' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onTimerPause(timer.id);
                }}
              >
                <Pause className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onTimerStart(timer.id);
                }}
                disabled={timer.remainingTime <= 0}
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTimer(timer);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onTimerDelete(timer.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">タイマー一覧</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいタイマーを作成</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="timer-name">タイマー名</Label>
                <Input
                  id="timer-name"
                  value={newTimerData.name}
                  onChange={(e) => setNewTimerData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例: 読書タイマー"
                />
              </div>
              
              <div>
                <Label htmlFor="timer-duration">時間（分）</Label>
                <Input
                  id="timer-duration"
                  type="number"
                  min="1"
                  max="180"
                  value={newTimerData.duration}
                  onChange={(e) => setNewTimerData(prev => ({ ...prev, duration: parseInt(e.target.value) || 25 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="timer-category">カテゴリ（任意）</Label>
                <Input
                  id="timer-category"
                  value={newTimerData.category}
                  onChange={(e) => setNewTimerData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="例: 勉強、運動、仕事"
                />
              </div>
              
              <Button 
                onClick={handleCreateTimer} 
                disabled={!newTimerData.name.trim()}
                className="w-full"
              >
                作成
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* タイマー一覧 */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">基本タイマー ({basicTimers.length})</TabsTrigger>
          <TabsTrigger value="pomodoro">ポモドーロ ({pomodoroTimers.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-2">
          {basicTimers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-2" />
              <p>基本タイマーがありません</p>
              <p className="text-sm">新規作成ボタンから作成してください</p>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {basicTimers.map(timer => (
                <TimerCard key={timer.id} timer={timer} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="pomodoro" className="space-y-2">
          {pomodoroTimers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-2" />
              <p>ポモドーロタイマーがありません</p>
              <p className="text-sm">設定画面からポモドーロタイマーを有効にしてください</p>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {pomodoroTimers.map(timer => (
                <TimerCard key={timer.id} timer={timer} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 編集ダイアログ */}
      {editingTimer && (
        <Dialog open={!!editingTimer} onOpenChange={() => setEditingTimer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>タイマーを編集</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-timer-name">タイマー名</Label>
                <Input
                  id="edit-timer-name"
                  value={editingTimer.name}
                  onChange={(e) => setEditingTimer(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-timer-category">カテゴリ</Label>
                <Input
                  id="edit-timer-category"
                  value={editingTimer.category || ''}
                  onChange={(e) => setEditingTimer(prev => prev ? { ...prev, category: e.target.value } : null)}
                />
              </div>
              
              <Button 
                onClick={() => handleUpdateTimer(editingTimer)} 
                className="w-full"
              >
                更新
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
