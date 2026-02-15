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
import { Plus, Copy, Save, Trash2 } from "lucide-react";
import { useMeetingReportStore } from "@/features/timer/stores/meeting-report-store";

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
    saveDraft,
  } = useMeetingReportStore();

  if (!draft) return null;

  const participantsText = draft.participants.join(", ");

  const handleCopyAndSave = async () => {
    if (draft.markdown.trim()) {
      await navigator.clipboard.writeText(draft.markdown);
    }
    saveDraft();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>会議レポート確認</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>会議名</Label>
              <Input value={draft.meetingTitle} readOnly />
            </div>
            <div className="space-y-2">
              <Label>開催日時</Label>
              <Input value={new Date(draft.heldAt).toLocaleString()} readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <Label>参加者（カンマ区切り）</Label>
            <Input
              value={participantsText}
              onChange={(event) =>
                setDraftParticipantsFromText(event.target.value)
              }
              placeholder="例: 山田, 佐藤, 鈴木"
            />
          </div>

          <div className="space-y-2">
            <Label>サマリー</Label>
            <Textarea
              rows={3}
              value={draft.summary}
              onChange={(event) =>
                updateDraftField("summary", event.target.value)
              }
            />
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
                    <tr key={item.agendaId} className="border-b last:border-0">
                      <td className="py-2 pr-2">{item.title}</td>
                      <td className="py-2 text-right">
                        {item.plannedDurationSec}
                      </td>
                      <td className="py-2 text-right">
                        {item.actualDurationSec}
                      </td>
                      <td className="py-2 text-right">{item.varianceSec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2">
            <Label>決定事項</Label>
            <Textarea
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

            <div className="space-y-2">
              {draft.todos.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  ToDoはまだありません
                </p>
              )}
              {draft.todos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-2">
                  <Input
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
            <Label>次回アクション</Label>
            <Textarea
              rows={3}
              value={draft.nextActions}
              onChange={(event) =>
                updateDraftField("nextActions", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Markdownプレビュー</Label>
            <Textarea value={draft.markdown} rows={10} readOnly />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="button" variant="outline" onClick={handleCopyAndSave}>
              <Copy className="mr-1 h-4 w-4" />
              コピーして保存
            </Button>
            <Button type="button" onClick={saveDraft}>
              <Save className="mr-1 h-4 w-4" />
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
