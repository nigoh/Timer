import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVoiceRecognition } from "@/features/timer/hooks/useVoiceRecognition";
import { useIntegrationLinkStore } from "@/features/timer/stores/integration-link-store";
import { summarizeVoiceTranscript } from "@/features/timer/services/meeting-ai-assist-service";
import { logger } from "@/utils/logger";
import type { QuillEditorHandle } from "@/components/ui/quill-editor";

interface VoiceTranscriptSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quillRef: React.RefObject<QuillEditorHandle>;
  onInserted: () => void;
}

const formatTimestamp = (ts: number): string => {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export const VoiceTranscriptSummaryDialog: React.FC<
  VoiceTranscriptSummaryDialogProps
> = ({ isOpen, onClose, quillRef, onInserted }) => {
  const { confirmedEntries, clearTranscript } = useVoiceRecognition();
  const { aiProviderConfig } = useIntegrationLinkStore();

  const [summaryText, setSummaryText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const rawTranscript = confirmedEntries.map((e) => e.text).join("\n");

  const generateSummary = useCallback(async () => {
    if (confirmedEntries.length === 0) return;
    setIsGenerating(true);
    try {
      const { summary, usedFallback: fb } = await summarizeVoiceTranscript(
        confirmedEntries,
        aiProviderConfig,
      );
      setSummaryText(summary);
      setUsedFallback(fb);
    } finally {
      setIsGenerating(false);
    }
  }, [confirmedEntries, aiProviderConfig]);

  // ダイアログを開いたときに自動で要約を生成
  useEffect(() => {
    if (isOpen && confirmedEntries.length > 0) {
      void generateSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleInsert = () => {
    const editor = quillRef.current?.getEditor();
    if (!editor) {
      logger.warn(
        "Quill editor not available for voice transcript insert",
        {},
        "voice",
      );
      return;
    }

    const length = editor.getLength();
    const textToInsert = `\n文字起こし要約\n${summaryText}\n`;
    editor.insertText(length, textToInsert, "user");

    logger.info(
      "Voice transcript inserted to Quill editor",
      { chars: textToInsert.length },
      "voice",
    );

    clearTranscript();
    onInserted();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>AI要約して議事録に追加</DialogTitle>
        </DialogHeader>

        {/* 原文エリア */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium">文字起こし原文</p>
          <ScrollArea className="h-32 rounded-md border bg-muted/30 px-3 py-2 text-sm">
            {confirmedEntries.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                文字起こしデータがありません
              </p>
            ) : (
              confirmedEntries.map((entry) => (
                <div key={entry.id} className="flex gap-2 py-1 leading-snug">
                  <span className="text-muted-foreground font-mono text-xs shrink-0 pt-1">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  <span>{entry.text}</span>
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        {/* AI 要約エリア */}
        <div className="space-y-1.5 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              AI 要約結果
              {usedFallback && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  （AI設定未構成のため原文をそのまま表示しています）
                </span>
              )}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isGenerating || confirmedEntries.length === 0}
              onClick={() => void generateSummary()}
              className="h-7 gap-1.5 text-xs"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`}
              />
              再生成
            </Button>
          </div>
          {isGenerating ? (
            <div className="h-32 rounded-md border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
              生成中...
            </div>
          ) : (
            <Textarea
              className="h-40 resize-none text-sm"
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              placeholder="要約テキストを入力または生成してください"
            />
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            type="button"
            disabled={!summaryText.trim() || isGenerating}
            onClick={handleInsert}
          >
            Quill に挿入して確定
          </Button>
        </div>

        {/* rawTranscript は型チェック用（未使用警告回避） */}
        <span className="sr-only hidden">{rawTranscript}</span>
      </DialogContent>
    </Dialog>
  );
};
