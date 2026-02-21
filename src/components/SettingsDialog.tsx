import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Github, AlertCircle, CheckCircle2 } from "lucide-react";
import { useIntegrationLinkStore } from "@/features/timer/stores/integration-link-store";
import { AiProviderConfig, AiProviderType } from "@/types/aiAssist";
import { validateAiProviderConfig } from "@/features/timer/utils/ai-provider-config";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { githubPat, setGithubPat, aiProviderConfig, setAiProviderConfig } =
    useIntegrationLinkStore();

  // ── AI 設定ドラフト ──
  const [aiDraft, setAiDraft] = React.useState<AiProviderConfig>({
    provider: aiProviderConfig?.provider ?? "openai",
    model: aiProviderConfig?.model ?? "gpt-4o-mini",
    apiKey: aiProviderConfig?.apiKey ?? "",
    temperature: aiProviderConfig?.temperature ?? 0.2,
  });
  const [aiSaved, setAiSaved] = React.useState(false);

  // ダイアログを開くたびに最新値に同期
  React.useEffect(() => {
    if (open) {
      setAiDraft({
        provider: aiProviderConfig?.provider ?? "openai",
        model: aiProviderConfig?.model ?? "gpt-4o-mini",
        apiKey: aiProviderConfig?.apiKey ?? "",
        temperature: aiProviderConfig?.temperature ?? 0.2,
      });
      setAiSaved(false);
      setPatSaved(false);
    }
  }, [open, aiProviderConfig]);

  const aiValidation = validateAiProviderConfig(aiDraft);

  const handleAiChange = <K extends keyof AiProviderConfig>(
    key: K,
    value: AiProviderConfig[K],
  ) => {
    setAiDraft((prev) => ({ ...prev, [key]: value }));
    setAiSaved(false);
  };

  const handleSaveAi = () => {
    setAiProviderConfig(aiDraft);
    setAiSaved(true);
  };

  // ── GitHub PAT ドラフト ──
  const [patDraft, setPatDraft] = React.useState(githubPat ?? "");
  const [patSaved, setPatSaved] = React.useState(false);

  React.useEffect(() => {
    if (open) setPatDraft(githubPat ?? "");
  }, [open, githubPat]);

  const handleSavePat = () => {
    setGithubPat(patDraft.trim() || null);
    setPatSaved(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[480px] flex-col sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="ai" className="mt-2 flex min-h-0 flex-1 flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI 設定
            </TabsTrigger>
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub 設定
            </TabsTrigger>
          </TabsList>

          {/* ── AI 設定タブ ── */}
          <TabsContent
            value="ai"
            className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1"
          >
            <p className="text-xs text-muted-foreground">
              API キーはメモリにのみ保持され、ページリロードでリセットされます。
            </p>

            <div className="space-y-2">
              <Label htmlFor="settings-ai-provider">Provider</Label>
              <select
                id="settings-ai-provider"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={aiDraft.provider}
                onChange={(e) =>
                  handleAiChange("provider", e.target.value as AiProviderType)
                }
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
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
              {aiSaved ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  保存しました（メモリのみ）
                </span>
              ) : !aiValidation.valid ? (
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
          </TabsContent>

          {/* ── GitHub 設定タブ ── */}
          <TabsContent
            value="github"
            className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1"
          >
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
                  setPatSaved(false);
                }}
              />
              <p className="text-xs text-muted-foreground">
                必要なスコープ:{" "}
                <code className="rounded bg-muted px-1">repo</code>（Issue
                読み書き）
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              {patSaved ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {patDraft.trim()
                    ? "保存しました（メモリのみ）"
                    : "クリアしました"}
                </span>
              ) : (
                <span />
              )}
              <Button onClick={handleSavePat} size="sm">
                保存
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
