import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Copy, Save, Trash2 } from "lucide-react";
import { useMeetingReportStore } from "@/features/timer/stores/meeting-report-store";
import { useIntegrationLinkStore } from "@/features/timer/stores/integration-link-store";
import {
  fetchGitHubIssue,
  postGitHubIssueComment,
} from "@/features/timer/api/github-issues";
import { parseIssueTodoItems } from "@/features/timer/utils/github-issue-agenda-parser";
import {
  buildPostPreviewMarkdown,
  PostTemplateType,
} from "@/features/timer/utils/meeting-report-post-template";
import { buildMeetingAiAssist } from "@/features/timer/utils/meeting-ai-assist";

export const MeetingReportDialog: React.FC = () => {
  const {
    draft,
    isDialogOpen,
    setDialogOpen,
    updateDraftField,
    setDraftParticipantsFromText,
    addDraftTodo,
    updateDraftTodo,
    removeDraftTodo,
    setDraftTodos,
    addPostedCommentHistory,
    saveDraft,
    reports,
  } = useMeetingReportStore();
  const { getLinks, githubPat } = useIntegrationLinkStore();
  const [isPosting, setIsPosting] = React.useState(false);
  const [isTodoImporting, setIsTodoImporting] = React.useState(false);
  const [postStatusMessage, setPostStatusMessage] = React.useState("");
  const [isDiffOnlyPost, setIsDiffOnlyPost] = React.useState(false);
  const [postTemplate, setPostTemplate] = React.useState<PostTemplateType>(
    "detailed",
  );

  React.useEffect(() => {
    if (!isDialogOpen) {
      setPostStatusMessage("");
      setIsDiffOnlyPost(false);
      setPostTemplate("detailed");
    }
  }, [isDialogOpen]);

  const aiAssist = React.useMemo(
    () => (draft ? buildMeetingAiAssist(draft) : null),
    [draft],
  );

  if (!draft || !aiAssist) return null;

  const participantsText = draft.participants.join(", ");
  const formIdPrefix = `meeting-report-${draft.id}`;

  const handleCopyAndSave = async () => {
    if (draft.markdown.trim()) {
      await navigator.clipboard.writeText(draft.markdown);
    }
    saveDraft();
  };

  const primaryLink = getLinks(`meeting:${draft.meetingId}`)[0];
  const previousReportMarkdown =
    reports.find((report) => report.meetingId === draft.meetingId)?.markdown ?? "";
  const postPreview = buildPostPreviewMarkdown(
    postTemplate,
    {
      meetingTitle: draft.meetingTitle,
      summary: draft.summary,
      decisions: draft.decisions,
      nextActions: draft.nextActions,
      todos: draft.todos,
      markdown: draft.markdown,
    },
    {
      diffOnly: isDiffOnlyPost,
      previousMarkdown: previousReportMarkdown,
    },
  );
  const applyAiAssist = () => {
    if (!draft || !aiAssist) return;

    const nextActionsAssist = [
      aiAssist.facilitationAssist,
      aiAssist.agendaAssist,
      aiAssist.preparationAssist,
    ]
      .filter(Boolean)
      .join("\n");
    updateDraftField(
      "summary",
      draft.summary.trim() ? draft.summary : aiAssist.summary,
    );
    updateDraftField(
      "decisions",
      draft.decisions.trim() ? draft.decisions : aiAssist.consensusAssist,
    );
    updateDraftField(
      "nextActions",
      draft.nextActions.trim() ? draft.nextActions : nextActionsAssist,
    );
    setPostStatusMessage("AIアシスト案を反映しました。必要に応じて編集してください。");
  };

  const handlePostToIssue = async () => {
    if (!primaryLink || !draft.markdown.trim()) {
      return;
    }

    const commentBody = postPreview;
    if (!commentBody.trim()) {
      setPostStatusMessage("差分がないため投稿をスキップしました");
      return;
    }

    setIsPosting(true);
    setPostStatusMessage("");
    try {
      const postedComment = await postGitHubIssueComment({
        owner: primaryLink.owner,
        repo: primaryLink.repo,
        issueNumber: primaryLink.issueNumber,
        body: commentBody,
        pat: githubPat ?? undefined,
      });
      addPostedCommentHistory({
        meetingId: draft.meetingId,
        meetingTitle: draft.meetingTitle,
        commentUrl: postedComment.commentUrl,
      });
      setPostStatusMessage("Issue コメントへの投稿に成功しました");
    } catch (error) {
      setPostStatusMessage(
        error instanceof Error ? error.message : "Issue コメント投稿に失敗しました",
      );
    } finally {
      setIsPosting(false);
    }
  };

  const handleImportTodosFromIssue = async () => {
    if (!primaryLink) return;
    setIsTodoImporting(true);
    setPostStatusMessage("");
    try {
      const issue = await fetchGitHubIssue({
        owner: primaryLink.owner,
        repo: primaryLink.repo,
        issueNumber: primaryLink.issueNumber,
        pat: githubPat ?? undefined,
      });
      const todos = parseIssueTodoItems(issue.body);
      setDraftTodos(todos);
      setPostStatusMessage(
        todos.length > 0
          ? `${todos.length}件のToDoをIssueから反映しました`
          : "Issueから反映可能なToDoが見つかりませんでした",
      );
    } catch (error) {
      setPostStatusMessage(
        error instanceof Error ? error.message : "ToDo反映に失敗しました",
      );
    } finally {
      setIsTodoImporting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="flex h-[90dvh] max-h-[90dvh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>会議レポート確認</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="basic"
          className="flex min-h-0 flex-1 flex-col space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="minutes">議事内容/ToDo</TabsTrigger>
            <TabsTrigger value="markdown">投稿プレビュー</TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto px-1">
            <TabsContent value="basic" className="mt-0 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${formIdPrefix}-meeting-title`}>
                    会議名
                  </Label>
                  <Input
                    id={`${formIdPrefix}-meeting-title`}
                    value={draft.meetingTitle}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${formIdPrefix}-held-at`}>開催日時</Label>
                  <Input
                    id={`${formIdPrefix}-held-at`}
                    value={new Date(draft.heldAt).toLocaleString()}
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formIdPrefix}-participants`}>
                  参加者（カンマ区切り）
                </Label>
                <Input
                  id={`${formIdPrefix}-participants`}
                  value={participantsText}
                  onChange={(event) =>
                    setDraftParticipantsFromText(event.target.value)
                  }
                  placeholder="例: 山田, 佐藤, 鈴木"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formIdPrefix}-summary`}>サマリー</Label>
                <Textarea
                  id={`${formIdPrefix}-summary`}
                  rows={3}
                  value={draft.summary}
                  onChange={(event) =>
                    updateDraftField("summary", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>AIアシスト（会議参加者が編集して利用）</Label>
                  <Button type="button" variant="outline" size="sm" onClick={applyAiAssist}>
                    下書きに反映
                  </Button>
                </div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>議事録要約: {aiAssist.summary}</li>
                  <li>合意形成アシスト: {aiAssist.consensusAssist}</li>
                  <li>ファシリテーションアシスト: {aiAssist.facilitationAssist}</li>
                  <li>アジェンダ作成アシスト: {aiAssist.agendaAssist}</li>
                  <li>会議事前準備アシスト: {aiAssist.preparationAssist}</li>
                </ul>
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <Label>アジェンダ実績</Label>
                <div className="overflow-x-auto text-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">議題</th>
                        <th className="py-2 text-right">予定(秒)</th>
                        <th className="py-2 text-right">実績(秒)</th>
                        <th className="py-2 text-right">差分(秒)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.agendaItems.map((item) => (
                        <tr
                          key={item.agendaId}
                          className="border-b last:border-0"
                        >
                          <td className="py-2 pr-2">{item.title}</td>
                          <td className="py-2 text-right">
                            {item.plannedDurationSec}
                          </td>
                          <td className="py-2 text-right">
                            {item.actualDurationSec}
                          </td>
                          <td className="py-2 text-right">
                            {item.varianceSec}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="minutes" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${formIdPrefix}-decisions`}>決定事項</Label>
                <Textarea
                  id={`${formIdPrefix}-decisions`}
                  rows={4}
                  value={draft.decisions}
                  onChange={(event) =>
                    updateDraftField("decisions", event.target.value)
                  }
                />
              </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>ToDo</Label>
                    <div className="flex gap-2">
                      {primaryLink && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleImportTodosFromIssue}
                          disabled={isTodoImporting}
                        >
                          {isTodoImporting ? "反映中..." : "Issueから反映"}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDraftTodo}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        追加
                      </Button>
                    </div>
                  </div>

                <div className="space-y-2">
                  {draft.todos.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      ToDoはまだありません
                    </p>
                  )}
                  {draft.todos.map((todo) => (
                    <div key={todo.id} className="flex items-center gap-2">
                      <Label
                        htmlFor={`${formIdPrefix}-todo-${todo.id}`}
                        className="sr-only"
                      >
                        ToDo内容
                      </Label>
                      <Input
                        id={`${formIdPrefix}-todo-${todo.id}`}
                        value={todo.text}
                        onChange={(event) =>
                          updateDraftTodo(todo.id, { text: event.target.value })
                        }
                        placeholder="ToDo内容"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDraftTodo(todo.id)}
                        aria-label="ToDoを削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formIdPrefix}-next-actions`}>
                  次回アクション
                </Label>
                <Textarea
                  id={`${formIdPrefix}-next-actions`}
                  rows={3}
                  value={draft.nextActions}
                  onChange={(event) =>
                    updateDraftField("nextActions", event.target.value)
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="markdown" className="mt-0 space-y-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={`${formIdPrefix}-post-template`}>
                    投稿テンプレート
                  </Label>
                  <select
                    id={`${formIdPrefix}-post-template`}
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={postTemplate}
                    onChange={(event) =>
                      setPostTemplate(event.target.value as PostTemplateType)
                    }
                  >
                    <option value="detailed">詳細</option>
                    <option value="summary">要約</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">投稿モード</Label>
                  <p className="text-sm">
                    {isDiffOnlyPost ? "差分のみ投稿" : "全文投稿"}
                  </p>
                </div>
              </div>
              <Label htmlFor={`${formIdPrefix}-markdown-preview`}>
                投稿前プレビュー
              </Label>
              <Textarea
                id={`${formIdPrefix}-markdown-preview`}
                value={postPreview}
                rows={14}
                readOnly
              />
            </TabsContent>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
            {postStatusMessage && (
              <p className="w-full text-xs text-muted-foreground">
                {postStatusMessage}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              キャンセル
            </Button>
            {primaryLink && (
              <>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={isDiffOnlyPost}
                    onChange={(event) => setIsDiffOnlyPost(event.target.checked)}
                  />
                  差分のみ投稿
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePostToIssue}
                  disabled={isPosting || !postPreview.trim()}
                >
                  {isPosting ? "投稿中..." : "Issue に投稿"}
                </Button>
              </>
            )}
            <Button type="button" variant="outline" onClick={handleCopyAndSave}>
              <Copy className="mr-1 h-4 w-4" />
              コピーして保存
            </Button>
            <Button type="button" onClick={saveDraft}>
              <Save className="mr-1 h-4 w-4" />
              保存
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
