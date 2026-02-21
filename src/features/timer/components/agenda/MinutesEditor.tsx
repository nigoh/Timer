import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useAgendaTimerStore } from "@/features/timer/stores/agenda-timer-store";
import QuillEditor, {
  type QuillEditorHandle,
} from "@/components/ui/quill-editor";
import {
  AGENDA_MINUTES_MOBILE_QUERY,
  AGENDA_MINUTES_QUILL_FORMATS,
  getAgendaMinutesQuillModules,
} from "@/features/timer/components/agenda/agenda-minutes-quill";
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
  const { updateAgendaMinutes } = useAgendaTimerStore();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(AGENDA_MINUTES_MOBILE_QUERY).matches;
  });
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

  return (
    <Card className="grid h-full min-h-0 rounded-none shadow-none border-0 grid-rows-[auto_minmax(0,1fr)]">
      <CardHeader className="px-3 py-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <FileText className="h-3.5 w-3.5" />
          議事録
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col p-3 pt-0">
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
      </CardContent>
    </Card>
  );
};
