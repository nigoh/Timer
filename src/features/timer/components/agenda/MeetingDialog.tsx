import React, { useState, useEffect } from "react";
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
import { Users, X } from "lucide-react";
import { useAgendaTimerStore } from "@/features/timer/stores/agenda-timer-store";
import { useIntegrationLinkStore } from "@/features/timer/stores/integration-link-store";
import { fetchGitHubIssue } from "@/features/timer/api/github-issues";
import {
  parseAndValidateOwnerRepo,
  validateIssueNumber,
  meetingTitleSchema,
} from "@/features/timer/utils/input-validators";
import { parseIssueAgendaItems } from "@/features/timer/utils/github-issue-agenda-parser";
import { Meeting } from "@/types/agenda";
import {
  createAgendaSelectionMap,
  parseAgendaDraftLines,
  DEFAULT_AGENDA_DURATION_MINUTES,
} from "./agenda-timer-utils";

export interface MeetingDialogProps {
  meeting?: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingDialog: React.FC<MeetingDialogProps> = ({
  meeting,
  isOpen,
  onClose,
}) => {
  const { createMeeting, updateMeetingTitle, addAgenda } =
    useAgendaTimerStore();
  const { githubPat } = useIntegrationLinkStore();
  const [title, setTitle] = useState(meeting?.title || "");
  const [ownerRepo, setOwnerRepo] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [agendaDraft, setAgendaDraft] = useState("");
  const [issueError, setIssueError] = useState("");
  const [isImportingIssue, setIsImportingIssue] = useState(false);
  const [importedAgendaItems, setImportedAgendaItems] = useState<
    ReturnType<typeof parseIssueAgendaItems>
  >([]);
  const [selectedAgendaItems, setSelectedAgendaItems] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    setTitle(meeting?.title || "");
    setOwnerRepo("");
    setIssueNumber("");
    setAgendaDraft("");
    setIssueError("");
    setImportedAgendaItems([]);
    setSelectedAgendaItems({});
  }, [meeting]);

  const handleImportFromIssue = async () => {
    setIssueError("");
    const ownerRepoResult = parseAndValidateOwnerRepo(ownerRepo);
    if ("error" in ownerRepoResult) {
      setIssueError(ownerRepoResult.error);
      return;
    }
    const issueNumResult = validateIssueNumber(issueNumber);
    if ("error" in issueNumResult) {
      setIssueError(issueNumResult.error);
      return;
    }
    const { owner, repo } = ownerRepoResult;
    const parsedIssueNumber = issueNumResult.value;

    setIsImportingIssue(true);
    try {
      const issue = await fetchGitHubIssue({
        owner,
        repo,
        issueNumber: parsedIssueNumber,
        pat: githubPat ?? undefined,
      });
      setTitle(issue.title);
      const parsedAgendas = parseIssueAgendaItems(issue.body);
      setImportedAgendaItems(parsedAgendas);
      setSelectedAgendaItems(createAgendaSelectionMap(parsedAgendas.length));
      setAgendaDraft(
        parsedAgendas
          .map((agenda) =>
            agenda.plannedDurationMinutes
              ? `${agenda.title} | ${agenda.plannedDurationMinutes}`
              : agenda.title,
          )
          .join("\n"),
      );
    } catch (error) {
      setIssueError(
        error instanceof Error
          ? error.message
          : "Issue からの下書き生成に失敗しました",
      );
    } finally {
      setIsImportingIssue(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const titleResult = meetingTitleSchema.safeParse(title.trim());
    if (!titleResult.success) return;

    if (meeting) {
      updateMeetingTitle(meeting.id, titleResult.data);
    } else {
      const createdMeetingId = createMeeting(titleResult.data);
      if (createdMeetingId) {
        const agendaCandidates =
          importedAgendaItems.length > 0
            ? importedAgendaItems.filter(
                (_, index) => selectedAgendaItems[index],
              )
            : parseAgendaDraftLines(agendaDraft);
        agendaCandidates.forEach((agendaItem) => {
          addAgenda(
            createdMeetingId,
            agendaItem.title,
            (agendaItem.plannedDurationMinutes ??
              DEFAULT_AGENDA_DURATION_MINUTES) * 60,
          );
        });
      }
    }

    setTitle("");
    setAgendaDraft("");
    setOwnerRepo("");
    setIssueNumber("");
    setIssueError("");
    setImportedAgendaItems([]);
    setSelectedAgendaItems({});
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {meeting ? "会議を編集" : "新しい会議を作成"}
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="ダイアログを閉じる"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="meeting-title">会議名</Label>
            <Input
              id="meeting-title"
              placeholder="例: プロジェクト進捗会議、部門ミーティング"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          {!meeting && (
            <div className="space-y-3 rounded-md p-3">
              <p className="text-sm font-medium">GitHub Issue から下書き入力</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="meeting-issue-owner-repo">Owner/Repo</Label>
                  <Input
                    id="meeting-issue-owner-repo"
                    placeholder="owner/repo"
                    value={ownerRepo}
                    onChange={(event) => setOwnerRepo(event.target.value)}
                    maxLength={141}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="meeting-issue-number">Issue #</Label>
                  <Input
                    id="meeting-issue-number"
                    type="number"
                    min="1"
                    max="999999"
                    placeholder="36"
                    value={issueNumber}
                    onChange={(event) => setIssueNumber(event.target.value)}
                  />
                </div>
              </div>
              {issueError && (
                <p className="text-xs text-destructive">{issueError}</p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleImportFromIssue}
                disabled={isImportingIssue}
              >
                {isImportingIssue ? "取得中..." : "Issue から反映"}
              </Button>
              {importedAgendaItems.length > 0 && (
                <div className="space-y-1 rounded-md bg-muted/50 p-2">
                  <p className="text-xs font-medium">取り込み対象の選択</p>
                  <ul className="space-y-1">
                    {importedAgendaItems.map((item, index) => (
                      <li key={`${item.title}-${index}`} className="text-xs">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedAgendaItems[index])}
                            onChange={(event) =>
                              setSelectedAgendaItems((prev) => ({
                                ...prev,
                                [index]: event.target.checked,
                              }))
                            }
                          />
                          <span>
                            {item.title}
                            {item.plannedDurationMinutes
                              ? `（${item.plannedDurationMinutes}分）`
                              : ""}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="meeting-issue-agenda-draft">
                  アジェンダ下書き（1行: タイトル | 分）
                </Label>
                <Textarea
                  id="meeting-issue-agenda-draft"
                  rows={6}
                  placeholder={"例: オープニング | 5\n課題整理 | 15"}
                  value={agendaDraft}
                  onChange={(event) => setAgendaDraft(event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">{meeting ? "更新" : "作成"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
