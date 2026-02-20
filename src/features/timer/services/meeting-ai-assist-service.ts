import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { MeetingReport } from "@/types/meetingReport";
import { AiProviderConfig } from "@/types/aiAssist";
import { MeetingAiAssist, buildMeetingAiAssist } from "@/features/timer/utils/meeting-ai-assist";
import { validateAiProviderConfig } from "@/features/timer/utils/ai-provider-config";
import { logger } from "@/utils/logger";

const extractTextContent = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) =>
        typeof item === "string"
          ? item
          : typeof item === "object" &&
              item !== null &&
              "text" in item &&
              typeof item.text === "string"
            ? item.text
            : "",
      )
      .join("\n");
  }
  return "";
};

const parseAssistJson = (rawText: string): MeetingAiAssist => {
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  const jsonText = start >= 0 && end > start ? rawText.slice(start, end + 1) : rawText;
  const parsed = JSON.parse(jsonText) as Partial<MeetingAiAssist>;

  const toText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  return {
    summary: toText(parsed.summary),
    consensusAssist: toText(parsed.consensusAssist),
    facilitationAssist: toText(parsed.facilitationAssist),
    agendaAssist: toText(parsed.agendaAssist),
    preparationAssist: toText(parsed.preparationAssist),
  };
};

const hasAllFields = (assist: MeetingAiAssist) =>
  Boolean(
    assist.summary &&
      assist.consensusAssist &&
      assist.facilitationAssist &&
      assist.agendaAssist &&
      assist.preparationAssist,
  );

export const generateMeetingAiAssist = async (
  report: MeetingReport,
  config: AiProviderConfig | null,
): Promise<{ assist: MeetingAiAssist; usedFallback: boolean }> => {
  const fallback = buildMeetingAiAssist(report);
  const validation = validateAiProviderConfig(config ?? {});

  if (!validation.valid || !config) {
    return { assist: fallback, usedFallback: true };
  }

  const prompt = PromptTemplate.fromTemplate(
    [
      "あなたは会議ファシリテーションのアシスタントです。",
      "次の会議情報をもとに、JSON形式のみで回答してください。",
      "キーは summary, consensusAssist, facilitationAssist, agendaAssist, preparationAssist の5つ固定。",
      "各値は日本語の短文で、参加者主体の提案にしてください。",
      "",
      "会議名: {meetingTitle}",
      "参加者: {participants}",
      "議題実績: {agendaStats}",
      "既存サマリー: {summary}",
      "既存決定事項: {decisions}",
      "既存次回アクション: {nextActions}",
    ].join("\n"),
  );

  try {
    const model =
      config.provider === "openai"
        ? new ChatOpenAI({
            apiKey: config.apiKey,
            model: config.model,
            temperature: config.temperature ?? 0.2,
          })
        : new ChatAnthropic({
            apiKey: config.apiKey,
            model: config.model,
            temperature: config.temperature ?? 0.2,
          });

    const chain = prompt.pipe(model);
    const message = await chain.invoke({
      meetingTitle: report.meetingTitle,
      participants: report.participants.join(", ") || "未設定",
      agendaStats:
        report.agendaItems
          .map(
            (item) =>
              `${item.title}: planned=${item.plannedDurationSec}s, actual=${item.actualDurationSec}s, variance=${item.varianceSec}s`,
          )
          .join(" | ") || "議題なし",
      summary: report.summary || "未入力",
      decisions: report.decisions || "未入力",
      nextActions: report.nextActions || "未入力",
    });

    const parsed = parseAssistJson(extractTextContent(message.content));
    if (!hasAllFields(parsed)) {
      throw new Error("AI response schema mismatch");
    }

    logger.info(
      "Meeting AI assist generated via LangChain",
      { provider: config.provider, model: config.model },
      "agenda",
    );

    return { assist: parsed, usedFallback: false };
  } catch (error) {
    logger.warn(
      "Meeting AI assist fallback activated",
      {
        provider: config.provider,
        model: config.model,
        error: error instanceof Error ? error.message : String(error),
      },
      "agenda",
    );
    return { assist: fallback, usedFallback: true };
  }
};
