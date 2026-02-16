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
