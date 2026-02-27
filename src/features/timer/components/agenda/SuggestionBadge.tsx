import React from "react";
import { Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimpleTooltip } from "@/components/ui/simple-tooltip";
import type { Suggestion } from "@/types/meetingOptimization";

export interface SuggestionBadgeProps {
  suggestion: Suggestion | null;
  /** Knowledge Store の記録件数（3件未満の場合は「データ収集中」ツールチップを表示） */
  recordCount: number;
  onRequestDialog: () => void;
}

/**
 * MAPE-K プランフェーズの提案をアジェンダ項目横に表示するバッジ。
 * - 提案あり: オレンジバッジ + クリックでダイアログを開く
 * - 提案なし かつ 3件未満: 「データ収集中」を示すアイコン + ツールチップ
 * - それ以外: 何も表示しない
 */
export const SuggestionBadge: React.FC<SuggestionBadgeProps> = ({
  suggestion,
  recordCount,
  onRequestDialog,
}) => {
  if (suggestion) {
    return (
      <SimpleTooltip
        content={`時間提案あり: ${Math.round(suggestion.suggestedValue / 60)}分（信頼度 ${Math.round(suggestion.confidence * 100)}%）`}
        side="top"
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-auto px-1.5 gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          onClick={(e) => {
            e.stopPropagation();
            onRequestDialog();
          }}
          aria-label="予定時間の提案を表示"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          <Badge
            variant="outline"
            className="h-4 px-1 text-[10px] border-orange-400 text-orange-600 bg-orange-50 pointer-events-none"
          >
            提案
          </Badge>
        </Button>
      </SimpleTooltip>
    );
  }

  if (recordCount < 3) {
    return (
      <SimpleTooltip
        content={`データ収集中（あと ${3 - recordCount} 件の会議で提案が有効になります）`}
        side="top"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground/40">
          <Lightbulb className="h-3.5 w-3.5" />
        </span>
      </SimpleTooltip>
    );
  }

  return null;
};
