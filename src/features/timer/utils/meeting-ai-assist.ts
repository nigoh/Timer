import { MeetingReport } from "@/types/meetingReport";

export interface MeetingAiAssist {
  summary: string;
  consensusAssist: string;
  facilitationAssist: string;
  agendaAssist: string;
  preparationAssist: string;
}

const formatMinutes = (seconds: number) => `${Math.max(1, Math.round(seconds / 60))}分`;

export const buildMeetingAiAssist = (report: MeetingReport): MeetingAiAssist => {
  const agendaCount = report.agendaItems.length;
  const totalPlanned = report.agendaItems.reduce(
    (sum, item) => sum + item.plannedDurationSec,
    0,
  );
  const totalActual = report.agendaItems.reduce(
    (sum, item) => sum + item.actualDurationSec,
    0,
  );
  const overtimeItems = report.agendaItems
    .filter((item) => item.varianceSec > 0)
    .sort((a, b) => b.varianceSec - a.varianceSec);
  const topOvertimeTitle = overtimeItems[0]?.title;

  const summary = `${report.meetingTitle}では${agendaCount}件の議題を扱い、予定${formatMinutes(totalPlanned)}に対して実績${formatMinutes(totalActual)}でした。${topOvertimeTitle ? `特に「${topOvertimeTitle}」で議論が深まりました。` : "全体を通じて予定に沿って進行しました。"}`;

  const consensusAssist = topOvertimeTitle
    ? `「${topOvertimeTitle}」は論点が広がりやすいため、決定事項と持ち帰り事項を分けて確認し、最終判断者と期限を明確にしてください。`
    : "未決事項が残っていないかを最終確認し、決定事項ごとに責任者と期限を明確にしてください。";

  const facilitationAssist = overtimeItems.length
    ? "次回は冒頭でゴールと時間配分を共有し、論点が拡散したら一度要約して優先度順に再整理してください。"
    : "進行は良好でした。次回も議題開始時に期待アウトプットを確認し、終了1分前に意思決定の確認を入れてください。";

  const agendaAssist = overtimeItems.length
    ? `次回アジェンダ案: ①前回決定事項の確認 ②${overtimeItems
        .slice(0, 2)
        .map((item) => `${item.title}（${formatMinutes(item.actualDurationSec)}）`)
        .join(" ③")}。`
    : "次回アジェンダ案: ①前回アクション確認 ②主要課題の意思決定 ③リスクと次回までの対応確認。";

  const preparationAssist = `事前準備案: 参加者${report.participants.length || "未設定"}名の前提を揃えるため、目的・判断基準・必要資料を会議前に共有し、ToDo候補を2〜3件に絞って持ち寄ってください。`;

  return {
    summary,
    consensusAssist,
    facilitationAssist,
    agendaAssist,
    preparationAssist,
  };
};
