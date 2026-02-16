export interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string; message?: string }) => void) | null;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<
          ArrayLike<{ transcript: string }> & { isFinal: boolean }
        >;
      }) => void)
    | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const appendTranscriptToMinutesContent = (
  currentContent: string,
  transcript: string,
) => {
  const normalizedTranscript = transcript.trim();
  if (!normalizedTranscript) {
    return currentContent;
  }

  const escapedTranscript = escapeHtml(normalizedTranscript);
  return currentContent.trim()
    ? `${currentContent}<p>${escapedTranscript}</p>`
    : `<p>${escapedTranscript}</p>`;
};

export const createSpeechRecognitionInstance = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  const SpeechRecognitionClass =
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

  return SpeechRecognitionClass ? new SpeechRecognitionClass() : null;
};

export const stripHtmlTags = (value: string) =>
  (() => {
    if (typeof DOMParser !== "undefined") {
      const parsed = new DOMParser().parseFromString(value, "text/html");
      return parsed.body.textContent?.trim() ?? "";
    }

    return value.replace(/[<>]/g, "").trim();
  })();

export const buildAiMinutesPrompt = (params: {
  meetingTitle: string;
  agendaTitle: string;
  minutesContent: string;
}) => {
  const meetingTitle = params.meetingTitle.trim() || "未設定の会議";
  const agendaTitle = params.agendaTitle.trim() || "未設定の議題";
  const rawMinutes = stripHtmlTags(params.minutesContent);
  const sourceText = rawMinutes || "（音声認識テキストなし）";

  return [
    "以下の会議メモをもとに、議事録を日本語で作成してください。",
    "出力は次の見出し順にしてください: サマリー / 決定事項 / ToDo / 次回アクション",
    "",
    `会議名: ${meetingTitle}`,
    `議題: ${agendaTitle}`,
    "",
    "会議メモ:",
    sourceText,
  ].join("\n");
};
