import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleTooltip } from "@/components/ui/simple-tooltip";
import { useAgendaTimerInstance } from "@/features/timer/hooks/useTimerInstances";
import { useTaskId } from "@/features/timer/contexts/TaskIdContext";
import QuillEditor, {
  type QuillEditorHandle,
} from "@/components/ui/quill-editor";
import {
  AGENDA_MINUTES_MOBILE_QUERY,
  AGENDA_MINUTES_QUILL_FORMATS,
  getAgendaMinutesQuillModules,
} from "@/features/timer/components/agenda/agenda-minutes-quill";
import { OcrImportDialog } from "@/features/timer/components/agenda/OcrImportDialog";
import { VoiceTranscriptPanel } from "@/features/timer/components/voice/VoiceTranscriptPanel";
import { VoiceTranscriptSummaryDialog } from "@/features/timer/components/voice/VoiceTranscriptSummaryDialog";
import { AgendaItem } from "@/types/agenda";

export interface MinutesEditorProps {
  meetingId: string;
  agenda: AgendaItem;
  quillRef: React.RefObject<QuillEditorHandle>;
}

export const MinutesEditor: React.FC<MinutesEditorProps> = ({
  meetingId,
  agenda,
  quillRef,
}) => {
  const taskId = useTaskId();
  const { updateAgendaMinutes } = useAgendaTimerInstance(taskId);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(AGENDA_MINUTES_MOBILE_QUERY).matches;
  });
  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false);
  const [isVoiceSummaryOpen, setIsVoiceSummaryOpen] = useState(false);
  const quillModules = useMemo(
    () => getAgendaMinutesQuillModules(isMobile),
    [isMobile],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(AGENDA_MINUTES_MOBILE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleOcrImport = (text: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection(true);
      const insertIndex = range ? range.index + range.length : quill.getLength() - 1;
      // 挿入位置の直前が改行でなければ改行を先行挿入して読みやすくする
      const needsLeadingNewline =
        insertIndex > 0 && quill.getText(insertIndex - 1, 1) !== '\n';
      const insertText = needsLeadingNewline ? `\n${text}` : text;
      quill.insertText(insertIndex, insertText, 'user');
      const updatedHtml = quill.root.innerHTML;
      updateAgendaMinutes(meetingId, agenda.id, {
        minutesContent: updatedHtml,
        minutesFormat: "richtext",
      });
    } else {
      // Quill 未初期化時は既存テキストに追記
      const existing = agenda.minutesContent ?? "";
      const sep = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
      updateAgendaMinutes(meetingId, agenda.id, {
        minutesContent: existing + sep + text,
        minutesFormat: "richtext",
      });
    }
  };

  return (
    <>
    <Card className="grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]">
      <CardHeader className="px-3 py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <FileText className="h-3.5 w-3.5" />
            議事録
          </CardTitle>
          <SimpleTooltip content="画像から文字を読み込む">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsOcrDialogOpen(true)}
              aria-label="画像から文字を読み込む"
            >
              <ScanText className="h-3.5 w-3.5" />
            </Button>
          </SimpleTooltip>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col p-3 pt-0 gap-2">
        {/* リッチテキストエディタ */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md bg-background [&_.ql-toolbar]:shrink-0 [&_.ql-toolbar]:flex-wrap [&_.ql-container]:flex-1 [&_.ql-container]:min-h-0 [&_.ql-container]:overflow-hidden [&_.ql-editor]:h-full [&_.ql-editor]:overflow-y-auto [&_.ql-editor]:break-words max-lg:[&_.ql-editor]:text-sm">
          <QuillEditor
            ref={quillRef}
            key={agenda.id}
            theme="snow"
            className="flex h-full min-h-0 flex-col"
            value={agenda.minutesContent}
            onChange={(value) => {
              if (value === agenda.minutesContent) {
                return;
              }

              updateAgendaMinutes(meetingId, agenda.id, {
                minutesContent: value,
                minutesFormat: "richtext",
              });
            }}
            modules={quillModules}
            formats={AGENDA_MINUTES_QUILL_FORMATS}
          />
        </div>
        {/* 音声文字起こしパネル */}
        <div className="shrink-0 h-44">
          <VoiceTranscriptPanel
            meetingId={meetingId}
            agendaId={agenda.id}
            minutesFormat="richtext"
            onRequestSummaryDialog={() => setIsVoiceSummaryOpen(true)}
          />
        </div>
      </CardContent>
    </Card>
    <OcrImportDialog
      isOpen={isOcrDialogOpen}
      mode="minutes"
      onClose={() => setIsOcrDialogOpen(false)}
      onImport={handleOcrImport}
    />
    <VoiceTranscriptSummaryDialog
      isOpen={isVoiceSummaryOpen}
      onClose={() => setIsVoiceSummaryOpen(false)}
      quillRef={quillRef}
      onInserted={() => setIsVoiceSummaryOpen(false)}
    />
    </>
  );
};
