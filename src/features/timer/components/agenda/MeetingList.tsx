import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@radix-ui/themes";
import { Plus, Edit, Trash2, Settings, Users, FileText } from "lucide-react";
import { Meeting } from "@/types/agenda";
import { cn } from "@/lib/utils";

export interface MeetingListProps {
  meetings: Meeting[];
  currentMeetingId?: string;
  className?: string;
  onSelectMeeting: (meetingId: string) => void;
  onCreateMeeting: () => void;
  onEditMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (meeting: Meeting) => void;
  onSaveReport: (meeting: Meeting) => void;
  onOpenSettings: () => void;
}

export const MeetingList: React.FC<MeetingListProps> = ({
  meetings,
  currentMeetingId,
  className,
  onSelectMeeting,
  onCreateMeeting,
  onEditMeeting,
  onDeleteMeeting,
  onSaveReport,
  onOpenSettings,
}) => {
  return (
    <Card
      className={cn(
        "grid min-h-0 grid-rows-[auto_minmax(0,1fr)] lg:h-full",
        className,
      )}
    >
      <CardHeader className="px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Users className="h-3.5 w-3.5" />
            会議一覧
            <Badge variant="outline" className="h-5 px-1.5 text-xs">
              {meetings.length}件
            </Badge>
          </CardTitle>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:justify-start">
            <Tooltip content="新しい会議を作成" side="top">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0 sm:h-7 sm:w-auto sm:px-2 sm:text-xs"
                onClick={onCreateMeeting}
                aria-label="新しい会議を作成"
              >
                <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">新しい会議</span>
              </Button>
            </Tooltip>
            <Tooltip content="会議設定を開く" side="top">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onOpenSettings}
                disabled={!currentMeetingId}
              >
                <Settings className="mr-1.5 h-3.5 w-3.5" />
              </Button>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 lg:min-h-0 lg:overflow-y-auto">
        {meetings.length === 0 ? (
          <p className="text-xs text-muted-foreground">会議がありません</p>
        ) : (
          <div className="space-y-1">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="px-1 py-1">
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant={
                      meeting.id === currentMeetingId ? "default" : "ghost"
                    }
                    size="sm"
                    className="h-8 flex-1 justify-between px-2 text-xs"
                    onClick={() => onSelectMeeting(meeting.id)}
                  >
                    <span className="truncate text-left">{meeting.title}</span>
                    <span className="shrink-0 text-xs opacity-80">
                      {meeting.agenda.length}件
                    </span>
                  </Button>
                  <Tooltip content="会議名を編集" side="top">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditMeeting(meeting)}
                      aria-label="会議名を編集"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="会議レポートを作成" side="top">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-600 hover:text-blue-700"
                      onClick={() => onSaveReport(meeting)}
                      aria-label="レポートを保存"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="会議を削除" side="top">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700"
                      onClick={() => onDeleteMeeting(meeting)}
                      aria-label="会議を削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
