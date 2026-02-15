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
import { ClipboardCopy, Eye, FileText, Trash2 } from "lucide-react";
import { useMeetingReportStore } from "@/features/timer/stores/meeting-report-store";
import { MeetingReport } from "@/types/meetingReport";
import { cn } from "@/lib/utils";

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
  const { reports, deleteReport } = useMeetingReportStore();
  const [selectedReport, setSelectedReport] = useState<MeetingReport | null>(
    null,
  );

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
              <FileText className="h-4 w-4" />
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
            <div className="space-y-2 overflow-auto pr-1 lg:h-full lg:min-h-0">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-md border p-2 text-xs text-muted-foreground"
                >
                  <p className="truncate font-medium text-foreground">
                    {report.meetingTitle}
                  </p>
                  <p>{formatDateTime(report.createdAt)}</p>
                  <div className="mt-2 flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setSelectedReport(report)}
                      aria-label="レポートを表示"
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      表示
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => handleCopy(report.markdown)}
                      aria-label="レポートをコピー"
                    >
                      <ClipboardCopy className="mr-1 h-3.5 w-3.5" />
                      コピー
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => deleteReport(report.id)}
                      aria-label="レポートを削除"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
