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
import { Clock, X } from "lucide-react";
import { useAgendaTimerStore } from "@/features/timer/stores/agenda-timer-store";
import { meetingTitleSchema } from "@/features/timer/utils/input-validators";
import { AgendaItem } from "@/types/agenda";

export interface AgendaDialogProps {
  meetingId: string;
  agenda?: AgendaItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AgendaDialog: React.FC<AgendaDialogProps> = ({
  meetingId,
  agenda,
  isOpen,
  onClose,
}) => {
  const { addAgenda, updateAgenda } = useAgendaTimerStore();
  const [title, setTitle] = useState(agenda?.title || "");
  const [duration, setDuration] = useState(
    agenda ? Math.ceil(agenda.plannedDuration / 60) : 10,
  );
  const [memo, setMemo] = useState(agenda?.memo || "");

  useEffect(() => {
    setTitle(agenda?.title || "");
    setDuration(agenda ? Math.ceil(agenda.plannedDuration / 60) : 10);
    setMemo(agenda?.memo || "");
  }, [agenda]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const titleResult = meetingTitleSchema.safeParse(title.trim());
    if (!titleResult.success) return;

    const durationSeconds = duration * 60;

    if (agenda) {
      updateAgenda(meetingId, agenda.id, {
        title: titleResult.data,
        plannedDuration: durationSeconds,
        memo,
        remainingTime: durationSeconds - agenda.actualDuration,
      });
    } else {
      addAgenda(meetingId, titleResult.data, durationSeconds, memo);
    }

    setTitle("");
    setDuration(10);
    setMemo("");
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
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {agenda ? "アジェンダを編集" : "新しいアジェンダを追加"}
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
            <Label htmlFor="agenda-title">アジェンダタイトル</Label>
            <Input
              id="agenda-title"
              placeholder="例: 進捗報告、課題検討、次回予定"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="agenda-duration">予定時間（分）</Label>
            <Input
              id="agenda-duration"
              type="number"
              min="1"
              max="180"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
              required
            />
          </div>

          <div>
            <Label htmlFor="agenda-memo">メモ（任意）</Label>
            <Textarea
              id="agenda-memo"
              placeholder="議論のポイント、準備資料、参加者への連絡事項など"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">{agenda ? "更新" : "追加"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
