import React from "react";
import { ArrowRight, TrendingUp, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatMinutes } from "@/lib/utils";
import type { Suggestion } from "@/types/meetingOptimization";

export interface SuggestionDialogProps {
  suggestion: Suggestion;
  agendaTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
}

/**
 * MAPE-K Execute フェーズ: 提案詳細を表示し、ユーザー承認/却下を受け付けるダイアログ。
 * 適用は常にユーザー操作を必要とし、自動適用は行わない。
 */
export const SuggestionDialog: React.FC<SuggestionDialogProps> = ({
  suggestion,
  agendaTitle,
  open,
  onOpenChange,
  onApply,
}) => {
  const confidencePct = Math.round(suggestion.confidence * 100);

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const handleReject = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            予定時間の調整提案
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 対象アジェンダ */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">対象アジェンダ</p>
            <p className="text-sm font-medium truncate">{agendaTitle}</p>
          </div>

          {/* 変更内容 */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">現在</p>
              <p className="text-base font-semibold">
                {formatMinutes(suggestion.currentValue)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">推奨</p>
              <p className="text-base font-semibold text-orange-600">
                {formatMinutes(suggestion.suggestedValue)}
              </p>
            </div>
          </div>

          {/* 根拠 */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">根拠</p>
            <p className="text-xs leading-relaxed">{suggestion.reason}</p>
          </div>

          {/* 信頼度 + データ件数 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">信頼度</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="h-5 px-1.5 text-xs">
                  {suggestion.basedOnCount} 件のデータ
                </Badge>
                <span
                  className={
                    confidencePct >= 70
                      ? "font-medium text-orange-600"
                      : "text-muted-foreground"
                  }
                >
                  {confidencePct}%
                </span>
              </div>
            </div>
            <Progress value={confidencePct} className="h-1.5" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="flex-1"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            却下
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            適用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
