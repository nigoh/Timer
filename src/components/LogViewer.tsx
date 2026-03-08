import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Download,
  Trash2,
  Copy,
  Bug,
  AlertTriangle,
  Info,
  Zap,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  logger,
  LogLevel,
  LogEntry,
  createAiAnalysisPrompt,
} from "@/utils/logger";
import { formatTimestamp } from "@/lib/utils";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

interface LogViewerProps {
  children: React.ReactNode;
}

const LogViewer: React.FC<LogViewerProps> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "today" | "all">(
    "all",
  );
  const [isOpen, setIsOpen] = useState(false);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    if (isOpen) {
      const allLogs = logger.getStoredLogs();
      setLogs(allLogs);
    }
  }, [isOpen]);

  useEffect(() => {
    let filtered = logs;

    if (timeRange !== "all") {
      const now = new Date();
      let startDate: Date;
      if (timeRange === "1h") {
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
      } else if (timeRange === "24h") {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
      filtered = filtered.filter((log) => new Date(log.timestamp) >= startDate);
    }

    if (selectedLevel !== "all") {
      const levelValue = LogLevel[selectedLevel as keyof typeof LogLevel];
      filtered = filtered.filter((log) => log.level === levelValue);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((log) => log.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(query) ||
          log.category.toLowerCase().includes(query) ||
          (log.data && JSON.stringify(log.data).toLowerCase().includes(query)),
      );
    }

    setFilteredLogs(filtered);
  }, [logs, selectedLevel, selectedCategory, searchQuery, timeRange]);

  const statistics = logger.getLogStatistics();

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(logs.map((log) => log.category)),
    );
    return uniqueCategories.sort();
  }, [logs]);

  const analyticsData = useMemo(() => {
    const analyticsLogs = logs.filter((log) => log.category === "analytics");
    const counts: Record<
      string,
      { count: number; feature: string; action: string }
    > = {};
    for (const log of analyticsLogs) {
      const d = log.data as
        | { feature?: string; action?: string }
        | null
        | undefined;
      const feature = d?.feature ?? "不明";
      const action = d?.action ?? "不明";
      const key = `${feature}/${action}`;
      if (!counts[key]) {
        counts[key] = { count: 0, feature, action };
      }
      counts[key].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [logs]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return <Bug className="h-4 w-4 text-destructive" />;
      case LogLevel.WARN:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case LogLevel.INFO:
        return <Info className="h-4 w-4 text-info" />;
      case LogLevel.DEBUG:
        return <Zap className="h-4 w-4 text-success" />;
      case LogLevel.TRACE:
        return <Eye className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getLevelBadgeVariant = (
    level: LogLevel,
  ): "default" | "secondary" | "destructive" | "outline" => {
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
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `focuso-logs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    confirm(
      {
        title: "ログを削除",
        description: "すべてのログを削除しますか？この操作は取り消せません。",
      },
      () => {
        logger.clearLogs();
        setLogs([]);
        setFilteredLogs([]);
      },
    );
  };

  const handleCopyForAi = async (entry: LogEntry) => {
    const prompt = createAiAnalysisPrompt([entry]);

    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("このログのAI分析文をコピーしました");
    } catch (error) {
      logger.warn("Failed to copy AI prompt", { error, logId: entry.id }, "ui");
      toast.error(
        "コピーに失敗しました。ブラウザの権限設定を確認してください。",
      );
    }
  };

  const LogEntryCard: React.FC<{ entry: LogEntry }> = ({ entry }) => (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
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
        {(entry.level === LogLevel.ERROR || entry.level === LogLevel.WARN) && (
          <div className="mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyForAi(entry)}
            >
              <Copy className="h-4 w-4 mr-2" />
              このログをAI解析文としてコピー
            </Button>
          </div>
        )}
        {entry.data !== undefined && (
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
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-6xl h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>アプリケーションログ</DialogTitle>
            <DialogDescription>
              システムログの表示・分析・エクスポートができます
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="logs" className="flex h-full min-h-0 flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="logs">ログ一覧</TabsTrigger>
              <TabsTrigger value="statistics">統計情報</TabsTrigger>
              <TabsTrigger value="analytics">機能利用分析</TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="flex-1 min-h-0">
              <div className="space-y-4 h-full min-h-0 flex flex-col">
                <div className="flex gap-4 flex-wrap shrink-0">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      placeholder="ログを検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={selectedLevel}
                    onValueChange={setSelectedLevel}
                  >
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
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="カテゴリ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべてのカテゴリ</SelectItem>
                      {categories.map((category) => (
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
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {(["all", "1h", "24h", "today"] as const).map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                    >
                      {
                        {
                          all: "すべて",
                          "1h": "1時間以内",
                          "24h": "24時間以内",
                          today: "今日",
                        }[range]
                      }
                    </Button>
                  ))}
                </div>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-2">
                    {filteredLogs.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <p className="text-muted-foreground">
                            {logs.length === 0
                              ? "ログがありません"
                              : "フィルター条件に一致するログがありません"}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredLogs.map((entry) => (
                        <LogEntryCard key={entry.id} entry={entry} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="statistics" className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>基本統計</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>総ログ数:</span>
                          <span className="font-medium">
                            {statistics.totalLogs}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>セッション数:</span>
                          <span className="font-medium">
                            {statistics.sessionCount}
                          </span>
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

                  <Card>
                    <CardHeader>
                      <CardTitle>レベル別統計</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(statistics.logsByLevel).map(
                          ([level, count]) => (
                            <div
                              key={level}
                              className="flex justify-between items-center"
                            >
                              <div className="flex items-center gap-2">
                                {getLevelIcon(
                                  LogLevel[level as keyof typeof LogLevel],
                                )}
                                <span>{level}</span>
                              </div>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>カテゴリ別統計</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(statistics.logsByCategory).map(
                          ([category, count]) => (
                            <div
                              key={category}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">{category}</span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {analyticsData.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">
                          機能利用ログがまだありません
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>機能利用ランキング</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analyticsData.map(
                            ({ feature, action, count }, index) => (
                              <div
                                key={`${feature}/${action}`}
                                className="flex items-center gap-3"
                              >
                                <span className="text-muted-foreground text-sm w-6 text-right">
                                  {index + 1}.
                                </span>
                                <div className="flex-1">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>
                                      <Badge variant="outline" className="mr-2">
                                        {feature}
                                      </Badge>
                                      {action}
                                    </span>
                                    <span className="font-medium">
                                      {count}回
                                    </span>
                                  </div>
                                  <Progress
                                    value={
                                      (count / analyticsData[0].count) * 100
                                    }
                                    className="h-2"
                                  />
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      {ConfirmDialog}
    </>
  );
};

export default LogViewer;
