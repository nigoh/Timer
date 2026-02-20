import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip } from "@radix-ui/themes";
import { ClipboardCopy, Eye, FileText, Trash2 } from "lucide-react";
import { useMeetingReportStore } from "@/features/timer/stores/meeting-report-store";
import { MeetingReport } from "@/types/meetingReport";
import { cn } from "@/lib/utils";

const MAX_POSTED_COMMENT_HISTORY = 5;

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

interface MeetingReportHistoryProps {
  className?: string;
}

export const MeetingReportHistory: React.FC<MeetingReportHistoryProps> = ({
  className,
}) => {
  const { reports, postedCommentHistory, deleteReport } = useMeetingReportStore();
  const [selectedReport, setSelectedReport] = useState<MeetingReport | null>(
    null,
  );
  const selectedReportPostedHistory = React.useMemo(() => {
    if (!selectedReport) {
      return [];
    }
    return postedCommentHistory
      .filter((entry) => entry.meetingId === selectedReport.meetingId)
      .slice(0, MAX_POSTED_COMMENT_HISTORY);
  }, [postedCommentHistory, selectedReport]);

  const handleCopy = async (markdown: string) => {
    if (!markdown.trim()) return;
    await navigator.clipboard.writeText(markdown);
  };

  return (
    <>
      <Card
        className={cn(
          "grid min-h-0 grid-rows-[auto_minmax(0,1fr)] lg:h-full",
          className,
        )}
      >
        <CardHeader className="px-3 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <FileText className="h-3.5 w-3.5" />
              レポート履歴
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                {reports.length}件
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="px-3 pb-3 pt-0 lg:min-h-0">
          {reports.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              レポートはまだありません
            </p>
          ) : (
            <ul className="space-y-1 overflow-auto pr-1 lg:h-full lg:min-h-0">
              {reports.map((report) => (
                <li
                  key={report.id}
                  className="cursor-pointer rounded-sm px-1.5 py-1.5 text-xs hover:bg-muted/50"
                  onClick={() => setSelectedReport(report)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedReport(report);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`レポートを表示: ${report.meetingTitle}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {report.meetingTitle}
                      </p>
                      <p className="text-muted-foreground">
                        {formatDateTime(report.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tooltip content="レポートを表示" side="top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedReport(report);
                          }}
                          aria-label="レポートを表示"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="レポートをコピー" side="top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCopy(report.markdown);
                          }}
                          aria-label="レポートをコピー"
                        >
                          <ClipboardCopy className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="レポートを削除" side="top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteReport(report.id);
                          }}
                          aria-label="レポートを削除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedReport)}
        onOpenChange={(open) => {
          if (!open) setSelectedReport(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>レポート詳細</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {selectedReport?.meetingTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedReport ? formatDateTime(selectedReport.createdAt) : ""}
            </p>
            <Textarea
              value={selectedReport?.markdown ?? ""}
              rows={16}
              readOnly
            />
            {selectedReport && (
              <div className="space-y-1">
                <p className="text-xs font-medium">Issue投稿履歴</p>
                <ul className="space-y-1 text-xs">
                  {selectedReportPostedHistory.map((entry) => (
                      <li key={entry.id}>
                        <a
                          href={entry.commentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {entry.commentUrl}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  selectedReport
                    ? handleCopy(selectedReport.markdown)
                    : undefined
                }
              >
                <ClipboardCopy className="mr-1 h-4 w-4" />
                コピー
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
