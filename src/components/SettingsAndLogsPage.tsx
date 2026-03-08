import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Github,
  AlertCircle,
  Download,
  Trash2,
  Copy,
  Bug,
  AlertTriangle,
  Info,
  Zap,
  Eye,
  RefreshCw,
  BrainCircuit,
} from "lucide-react";
import { toast } from "sonner";
import { useIntegrationLinkStore } from "@/features/timer/stores/integration-link-store";
import { useMeetingKnowledgeStore } from "@/features/timer/stores/meeting-knowledge-store";
import { AiProviderConfig, AiProviderType } from "@/types/aiAssist";
import { validateAiProviderConfig } from "@/features/timer/utils/ai-provider-config";
import {
  logger,
  LogLevel,
  LogEntry,
  createAiAnalysisPrompt,
} from "@/utils/logger";
import { formatTimestamp } from "@/lib/utils";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

const SettingsAndLogsPage: React.FC = () => {
  // ─── Settings state ───────────────────────────────────────────────────────
  const { githubPat, setGithubPat, aiProviderConfig, setAiProviderConfig } =
    useIntegrationLinkStore();

  const [aiDraft, setAiDraft] = useState<AiProviderConfig>({
    provider: aiProviderConfig?.provider ?? "openai",
    model: aiProviderConfig?.model ?? "gpt-4o-mini",
    apiKey: aiProviderConfig?.apiKey ?? "",
    temperature: aiProviderConfig?.temperature ?? 0.2,
  });
  const [patDraft, setPatDraft] = useState(githubPat ?? "");
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // ─── MAPE-K Knowledge Store ───────────────────────────────────────────────
  const {
    settings: knowledgeSettings,
    records: knowledgeRecords,
    updateSettings,
    resetKnowledge,
  } = useMeetingKnowledgeStore();

  const handleResetKnowledge = () => {
    confirm(
      {
        title: "学習データをリセット",
        description:
          "蓄積した会議記録と学習パターンをすべて削除しますか？この操作は取り消せません。",
      },
      () => {
        resetKnowledge();
        toast.success("MAPE-K 学習データをリセットしました");
      },
    );
  };

  const aiValidation = validateAiProviderConfig(aiDraft);

  const handleAiChange = <K extends keyof AiProviderConfig>(
    key: K,
    value: AiProviderConfig[K],
  ) => {
    setAiDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAi = () => {
    setAiProviderConfig(aiDraft);
    toast.success("AI設定を保存しました（メモリのみ）");
  };

  const handleSavePat = () => {
    setGithubPat(patDraft.trim() || null);
    toast.success(
      patDraft.trim()
        ? "PATを保存しました（メモリのみ）"
        : "PATをクリアしました",
    );
  };

  // ─── Log viewer state ─────────────────────────────────────────────────────
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLogs(logger.getStoredLogs());
  }, []);

  const filteredLogs = useMemo(() => {
    let filtered = logs;
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
    return filtered;
  }, [logs, selectedLevel, selectedCategory, searchQuery]);

  const statistics = logger.getLogStatistics();

  const categories = useMemo(
    () => Array.from(new Set(logs.map((log) => log.category))).sort(),
    [logs],
  );

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
      default:
        return "outline";
    }
  };

  const handleRefreshLogs = () => {
    setLogs(logger.getStoredLogs());
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
      <div className="p-4 max-w-4xl mx-auto">
        <Tabs defaultValue="settings" className="flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              設定
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              ログ
            </TabsTrigger>
          </TabsList>

          {/* ── 設定タブ ── */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* AI設定 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI 設定
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    API
                    キーはメモリにのみ保持され、ページリロードでリセットされます。
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="settings-ai-provider">Provider</Label>
                    <Select
                      value={aiDraft.provider}
                      onValueChange={(value) =>
                        handleAiChange("provider", value as AiProviderType)
                      }
                    >
                      <SelectTrigger
                        id="settings-ai-provider"
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-ai-model">Model</Label>
                    <Input
                      id="settings-ai-model"
                      placeholder={
                        aiDraft.provider === "openai"
                          ? "gpt-4o-mini"
                          : "claude-3-5-haiku-latest"
                      }
                      value={aiDraft.model}
                      onChange={(e) => handleAiChange("model", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-ai-key">
                      API Key
                      <span className="ml-1 text-xs text-muted-foreground">
                        （メモリのみ保持）
                      </span>
                    </Label>
                    <Input
                      id="settings-ai-key"
                      type="password"
                      placeholder={
                        aiDraft.provider === "openai" ? "sk-..." : "sk-ant-..."
                      }
                      value={aiDraft.apiKey}
                      onChange={(e) => handleAiChange("apiKey", e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      キーはブラウザメモリにのみ保持され、ページリロードでリセットされます。外部サーバーへの送信はありません。
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-ai-temp">
                      Temperature
                      <span className="ml-1 text-xs text-muted-foreground">
                        （0〜2）
                      </span>
                    </Label>
                    <Input
                      id="settings-ai-temp"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={aiDraft.temperature ?? 0.2}
                      onChange={(e) =>
                        handleAiChange("temperature", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    {!aiValidation.valid ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {aiValidation.reason}
                      </span>
                    ) : (
                      <span />
                    )}
                    <Button
                      onClick={handleSaveAi}
                      disabled={!aiValidation.valid}
                      size="sm"
                    >
                      保存
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* GitHub設定 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    GitHub 設定
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    PAT（個人アクセストークン）はメモリにのみ保持され、ページリロードでリセットされます。
                    プライベートリポジトリへのアクセスや Issue
                    コメント投稿に使用されます。
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="settings-github-pat">
                      GitHub Personal Access Token
                      <span className="ml-1 text-xs text-muted-foreground">
                        （メモリのみ保持）
                      </span>
                    </Label>
                    <Input
                      id="settings-github-pat"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={patDraft}
                      onChange={(e) => {
                        setPatDraft(e.target.value);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      必要なスコープ:{" "}
                      <code className="rounded bg-muted px-1">repo</code>（Issue
                      読み書き）
                    </p>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button onClick={handleSavePat} size="sm">
                      保存
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* MAPE-K 会議効率化 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5" />
                    MAPE-K 会議効率化
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-xs text-muted-foreground">
                    過去の会議データを自動学習し、アジェンダの予定時間調整を提案します。
                    現在 <strong>{knowledgeRecords.length}</strong>{" "}
                    件の会議記録を蓄積中です。
                  </p>

                  {/* 提案機能 ON/OFF */}
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="mape-k-enabled"
                      className="flex flex-col gap-0.5"
                    >
                      提案機能
                      <span className="text-xs font-normal text-muted-foreground">
                        アジェンダに時間提案バッジを表示する
                      </span>
                    </Label>
                    <Switch
                      id="mape-k-enabled"
                      checked={knowledgeSettings.enabled}
                      onCheckedChange={(checked) =>
                        updateSettings({ enabled: checked })
                      }
                    />
                  </div>

                  {/* 学習期間 */}
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      学習期間
                      <span className="text-xs font-normal text-muted-foreground">
                        直近 {knowledgeSettings.learningWindow} 件
                      </span>
                    </Label>
                    <Slider
                      min={5}
                      max={50}
                      step={5}
                      value={[knowledgeSettings.learningWindow]}
                      onValueChange={([v]) =>
                        updateSettings({ learningWindow: v })
                      }
                      disabled={!knowledgeSettings.enabled}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5件</span>
                      <span>50件</span>
                    </div>
                  </div>

                  {/* リセット */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      学習データをすべて削除します
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetKnowledge}
                      disabled={knowledgeRecords.length === 0}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      データをリセット
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── ログタブ ── */}
          <TabsContent value="logs">
            <Tabs defaultValue="list" className="flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="list">ログ一覧</TabsTrigger>
                <TabsTrigger value="statistics">統計情報</TabsTrigger>
              </TabsList>

              <TabsContent value="list">
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <Input
                        placeholder="ログを検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select
                      value={selectedLevel}
                      onValueChange={setSelectedLevel}
                    >
                      <SelectTrigger className="w-[140px]">
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
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="カテゴリ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべてのカテゴリ</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshLogs}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      更新
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      エクスポート
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearLogs}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      クリア
                    </Button>
                  </div>

                  <ScrollArea className="h-[520px]">
                    <div className="space-y-2 pr-1">
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

              <TabsContent value="statistics">
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
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
      {ConfirmDialog}
    </>
  );
};

export default SettingsAndLogsPage;
