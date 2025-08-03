import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  Play, 
  Pause, 
  Square, 
  Clock,
  CheckCircle2,
  Circle,
  SkipForward,
  Plus,
  Edit,
  Trash2,
  Timer
} from 'lucide-react';
import { useAgendaTimerStore } from '../stores/agenda-timer-store';
import { AgendaItem } from '../types/agenda';
import { cn } from '../lib/utils';

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatMinutes = (seconds: number): string => {
  return `${Math.ceil(seconds / 60)}分`;
};

// アジェンダアイテム表示コンポーネント
interface AgendaItemCardProps {
  item: AgendaItem;
  isActive: boolean;
  onStart: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AgendaItemCard: React.FC<AgendaItemCardProps> = ({
  item,
  isActive,
  onStart,
  onComplete,
  onEdit,
  onDelete,
}) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'running':
        return <Timer className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">完了</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">実行中</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">一時停止</Badge>;
      default:
        return <Badge variant="outline">待機</Badge>;
    }
  };

  const progress = item.plannedDuration > 0 
    ? Math.min(100, (item.actualDuration / item.plannedDuration) * 100)
    : 0;

  return (
    <Card className={cn(
      "transition-all duration-200",
      isActive && "ring-2 ring-blue-500 ring-offset-2",
      item.status === 'completed' && "opacity-75"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {getStatusIcon()}
            <div className="flex-1">
              <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>予定: {formatMinutes(item.plannedDuration)}</span>
                <span>実際: {formatMinutes(item.actualDuration)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              進捗: {Math.round(progress)}%
            </span>
            
            <div className="flex gap-2">
              {item.status === 'pending' && (
                <Button size="sm" onClick={onStart}>
                  <Play className="w-4 h-4 mr-1" />
                  開始
                </Button>
              )}
              
              {item.status === 'running' && (
                <Button size="sm" variant="outline" onClick={onComplete}>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  完了
                </Button>
              )}
              
              {item.status === 'paused' && (
                <Button size="sm" onClick={onStart}>
                  <Play className="w-4 h-4 mr-1" />
                  再開
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// メインのアジェンダタイマーコンポーネント
export const AgendaTimer: React.FC = () => {
  const {
    currentSession,
    isRunning,
    currentTime,
    startSession,
    pauseSession,
    stopSession,
    startItem,
    completeCurrentItem,
    updateCurrentTime,
    createSession,
    resetSession,
    updateItem,
    removeItem,
  } = useAgendaTimerStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);

  // タイマー更新
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(updateCurrentTime, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, updateCurrentTime]);

  // デフォルトセッションの作成
  const createDefaultSession = () => {
    const defaultItems = [
      { title: '８月の定例会の段取り・役割を確認する', plannedDuration: 10 * 60 },
      { title: '9月の合宿定例会の準備状況を運営メンバーに共有する', plannedDuration: 15 * 60 },
      { title: '運営委員で合宿定例会（お酒・ちえりあの物品・人）を運ぶ人を募集し、役割分担打合せをします。', plannedDuration: 10 * 60 },
      { title: '10月定例会進捗を共有します。', plannedDuration: 5 * 60 },
      { title: '各チームの活動状況を報告する', plannedDuration: 5 * 60 },
      { title: '真夏チームを広報・ITチームに変更したので報告します。', plannedDuration: 5 * 60 },
      { title: '定例会アンケートの結果リンクをStockに貼り付ける', plannedDuration: 10 * 60 },
      { title: '非公開希望の方を無くすしたいので提案します。', plannedDuration: 15 * 60 },
      { title: '支部イベントキックオフミーティング調整さん入力のお願いします。', plannedDuration: 5 * 60 },
      { title: '9月運営委員会はWEB開催を提案します。', plannedDuration: 5 * 60 },
    ];

    createSession('８月定例会 - 運営委員会', defaultItems);
  };

  if (!currentSession) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">アジェンダタイマー</h1>
            <p className="text-muted-foreground">
              会議やイベントのアジェンダ管理と時間計測
            </p>
          </div>
          
          <div className="space-y-4">
            <Button onClick={createDefaultSession} size="lg">
              <Clock className="w-5 h-5 mr-2" />
              サンプル会議を開始
            </Button>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  新しいアジェンダを作成
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新しいアジェンダを作成</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    カスタムアジェンダ作成機能は実装予定です
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  const totalActualDuration = currentSession.items.reduce(
    (sum, item) => sum + item.actualDuration, 0
  ) + currentTime;

  const progress = currentSession.totalPlannedDuration > 0
    ? Math.min(100, (totalActualDuration / currentSession.totalPlannedDuration) * 100)
    : 0;

  const completedItems = currentSession.items.filter(item => item.status === 'completed').length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* ヘッダー - セッション情報 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{currentSession.title}</CardTitle>
              <p className="text-muted-foreground mt-1">
                {completedItems} / {currentSession.items.length} 項目完了
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {formatTime(totalActualDuration)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="h-3" />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>予定時間: {formatTime(currentSession.totalPlannedDuration)}</span>
              <span>実際の時間: {formatTime(totalActualDuration)}</span>
              <span>進捗: {Math.round(progress)}%</span>
            </div>
            
            {/* 制御ボタン */}
            <div className="flex justify-center gap-3 pt-2">
              {!isRunning ? (
                <Button onClick={startSession} size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  セッション開始
                </Button>
              ) : (
                <Button onClick={pauseSession} variant="outline" size="lg">
                  <Pause className="w-5 h-5 mr-2" />
                  一時停止
                </Button>
              )}
              
              <Button onClick={stopSession} variant="destructive" size="lg">
                <Square className="w-5 h-5 mr-2" />
                セッション終了
              </Button>
              
              <Button onClick={resetSession} variant="outline" size="lg">
                リセット
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アジェンダアイテム一覧 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">アジェンダ項目</h2>
        
        <div className="space-y-3">
          {currentSession.items.map((item, index) => (
            <AgendaItemCard
              key={item.id}
              item={item}
              isActive={currentSession.currentItemId === item.id}
              onStart={() => startItem(item.id)}
              onComplete={completeCurrentItem}
              onEdit={() => setEditingItem(item)}
              onDelete={() => removeItem(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
