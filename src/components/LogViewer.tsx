import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Trash2, 
  Bug,
  AlertTriangle,
  Info,
  Zap,
  Eye
} from 'lucide-react';
import { logger, LogLevel, LogEntry } from '@/utils/logger';

interface LogViewerProps {
  children: React.ReactNode;
}

const LogViewer: React.FC<LogViewerProps> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // ログを取得
  useEffect(() => {
    if (isOpen) {
      const allLogs = logger.getStoredLogs();
      setLogs(allLogs);
    }
  }, [isOpen]);

  // フィルタリング
  useEffect(() => {
    let filtered = logs;

    // レベルフィルタ
    if (selectedLevel !== 'all') {
      const levelValue = LogLevel[selectedLevel as keyof typeof LogLevel];
      filtered = filtered.filter(log => log.level === levelValue);
    }

    // カテゴリフィルタ
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => log.category === selectedCategory);
    }

    // 検索フィルタ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query) ||
        log.category.toLowerCase().includes(query) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(query))
      );
    }

    setFilteredLogs(filtered);
  }, [logs, selectedLevel, selectedCategory, searchQuery]);

  // 統計情報
  const statistics = useMemo(() => {
    return logger.getLogStatistics();
  }, [logs]);

  // 一意のカテゴリを取得
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(logs.map(log => log.category)));
    return uniqueCategories.sort();
  }, [logs]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return <Bug className="h-4 w-4 text-red-500" />;
      case LogLevel.WARN:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case LogLevel.INFO:
        return <Info className="h-4 w-4 text-blue-500" />;
      case LogLevel.DEBUG:
        return <Zap className="h-4 w-4 text-green-500" />;
      case LogLevel.TRACE:
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getLevelBadgeVariant = (level: LogLevel): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case LogLevel.ERROR:
        return "destructive";
      case LogLevel.WARN:
        return "outline";
      case LogLevel.INFO:
        return "default";
      case LogLevel.DEBUG:
        return "secondary";
      case LogLevel.TRACE:
        return "outline";
      default:
        return "default";
    }
  };

  const handleExport = () => {
    const exportData = logger.exportLogs();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timer-app-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    if (window.confirm('すべてのログを削除しますか？この操作は取り消せません。')) {
      logger.clearLogs();
      setLogs([]);
      setFilteredLogs([]);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const LogEntryCard: React.FC<{ entry: LogEntry }> = ({ entry }) => (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getLevelIcon(entry.level)}
            <Badge variant={getLevelBadgeVariant(entry.level)}>
              {LogLevel[entry.level]}
            </Badge>
            <Badge variant="outline">{entry.category}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(entry.timestamp)}
          </span>
        </div>
        <p className="text-sm font-medium mb-2">{entry.message}</p>
        {entry.data && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground mb-1">
              データを表示
            </summary>
            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(entry.data, null, 2)}
            </pre>
          </details>
        )}
        {entry.stackTrace && (
          <details className="text-xs mt-2">
            <summary className="cursor-pointer text-muted-foreground mb-1">
              スタックトレース
            </summary>
            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
              {entry.stackTrace}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>アプリケーションログ</DialogTitle>
          <DialogDescription>
            システムログの表示・分析・エクスポートができます
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="logs" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="logs">ログ一覧</TabsTrigger>
            <TabsTrigger value="statistics">統計情報</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="h-full">
            <div className="space-y-4 h-full">
              {/* フィルター・検索バー */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="ログを検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="レベル" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのレベル</SelectItem>
                    <SelectItem value="ERROR">エラー</SelectItem>
                    <SelectItem value="WARN">警告</SelectItem>
                    <SelectItem value="INFO">情報</SelectItem>
                    <SelectItem value="DEBUG">デバッグ</SelectItem>
                    <SelectItem value="TRACE">トレース</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="カテゴリ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのカテゴリ</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleExport} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  エクスポート
                </Button>
                <Button variant="outline" onClick={handleClearLogs} size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  クリア
                </Button>
              </div>

              {/* ログ一覧 */}
              <ScrollArea className="h-[calc(100%-80px)]">
                <div className="space-y-2">
                  {filteredLogs.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">
                          {logs.length === 0 ? 'ログがありません' : 'フィルター条件に一致するログがありません'}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredLogs.map(entry => (
                      <LogEntryCard key={entry.id} entry={entry} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="h-full">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 基本統計 */}
                <Card>
                  <CardHeader>
                    <CardTitle>基本統計</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>総ログ数:</span>
                        <span className="font-medium">{statistics.totalLogs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>セッション数:</span>
                        <span className="font-medium">{statistics.sessionCount}</span>
                      </div>
                      {statistics.oldestLog && (
                        <div className="flex justify-between">
                          <span>最古ログ:</span>
                          <span className="font-medium text-xs">
                            {formatTimestamp(statistics.oldestLog)}
                          </span>
                        </div>
                      )}
                      {statistics.newestLog && (
                        <div className="flex justify-between">
                          <span>最新ログ:</span>
                          <span className="font-medium text-xs">
                            {formatTimestamp(statistics.newestLog)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* レベル別統計 */}
                <Card>
                  <CardHeader>
                    <CardTitle>レベル別統計</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(statistics.logsByLevel).map(([level, count]) => (
                        <div key={level} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getLevelIcon(LogLevel[level as keyof typeof LogLevel])}
                            <span>{level}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* カテゴリ別統計 */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>カテゴリ別統計</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(statistics.logsByCategory).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm">{category}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LogViewer;
