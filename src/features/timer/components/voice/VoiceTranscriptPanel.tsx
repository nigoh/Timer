import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Sparkles, Trash2 } from "lucide-react";
import { Tooltip } from "@radix-ui/themes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceRecognitionButton } from "@/features/timer/components/voice/VoiceRecognitionButton";
import { useVoiceRecognition } from "@/features/timer/hooks/useVoiceRecognition";
import { useAgendaTimerStore } from "@/features/timer/stores/agenda-timer-store";
import { cn, formatUnixTimestamp } from "@/lib/utils";

interface VoiceTranscriptPanelProps {
  meetingId: string;
  agendaId: string;
  minutesFormat: "richtext" | "markdown";
  onRequestSummaryDialog?: () => void;
}

export const VoiceTranscriptPanel: React.FC<VoiceTranscriptPanelProps> = ({
  meetingId,
  agendaId,
  minutesFormat,
  onRequestSummaryDialog,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { isListening, confirmedEntries, interimTranscript, clearTranscript } =
    useVoiceRecognition();
  const { updateAgendaMinutes, currentMeeting } = useAgendaTimerStore();

  // 録音開始時に自動展開
  useEffect(() => {
    if (isListening) {
      setIsOpen(true);
    }
  }, [isListening]);

  // 新しいエントリが追加されたら最下部にスクロール
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [confirmedEntries, isOpen]);

  const handleInsertToMinutes = () => {
    if (minutesFormat === "richtext") {
      onRequestSummaryDialog?.();
      return;
    }

    if (confirmedEntries.length === 0) return;

    // 現在の議題の minutesContent を取得
    const currentAgenda = currentMeeting?.agenda.find((a) => a.id === agendaId);
    if (!currentAgenda) return;

    const now = new Date();
    const hhmm = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const lines = confirmedEntries.map((e) => `- ${e.text}`).join("\n");
    const insertion = `\n\n**文字起こし** (${hhmm})\n${lines}`;

    updateAgendaMinutes(meetingId, agendaId, {
      minutesContent: currentAgenda.minutesContent + insertion,
      minutesFormat: "markdown",
    });

    clearTranscript();
  };

  const hasContent =
    confirmedEntries.length > 0 || interimTranscript.length > 0;

  return (
    <div className="rounded-md border bg-muted/30">
      {/* ヘッダー（折りたたみトグル） */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="文字起こしパネルの開閉"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">文字起こし</span>
          {isListening && (
            <span className="flex items-center gap-1 text-xs text-destructive animate-pulse font-normal">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" />
              録音中
            </span>
          )}
          {confirmedEntries.length > 0 && !isListening && (
            <span className="text-xs text-muted-foreground font-normal">
              {confirmedEntries.length}件
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isOpen && hasContent && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                clearTranscript();
              }}
              aria-label="文字起こしをクリア"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* パネル本体 */}
      {isOpen && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <VoiceRecognitionButton agendaId={agendaId} />

            <Tooltip
              content={
                minutesFormat === "richtext"
                  ? "AI要約して議事録に追加"
                  : "議事録に追加"
              }
            >
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0"
                disabled={confirmedEntries.length === 0}
                onClick={handleInsertToMinutes}
                aria-label={
                  minutesFormat === "richtext"
                    ? "AI要約して議事録に追加"
                    : "議事録に追加"
                }
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>

          <ScrollArea className="h-40 rounded-md bg-background border px-2 py-2 text-sm">
            {confirmedEntries.length === 0 && !interimTranscript && (
              <p className="text-muted-foreground text-xs py-2 text-center">
                {isListening
                  ? "お話しください..."
                  : "録音を開始すると文字起こしが表示されます"}
              </p>
            )}
            {confirmedEntries.map((entry) => (
              <div key={entry.id} className="flex gap-2 py-1 leading-snug">
                <span className="text-muted-foreground font-mono text-xs shrink-0 pt-1">
                  {formatUnixTimestamp(entry.timestamp)}
                </span>
                <span>{entry.text}</span>
              </div>
            ))}
            {interimTranscript && (
              <div className="flex gap-2 py-1 leading-snug">
                <span className="text-muted-foreground font-mono text-xs shrink-0 pt-1">
                  …
                </span>
                <span className={cn("text-muted-foreground italic")}>
                  {interimTranscript}
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
