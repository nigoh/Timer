// Web Speech API の型宣言（TypeScript 標準 lib.dom.d.ts に未定義のため自前定義）

interface SpeechRecognitionAlternativeItem {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultItem {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternativeItem;
  [index: number]: SpeechRecognitionAlternativeItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error:
    | 'aborted'
    | 'audio-capture'
    | 'bad-grammar'
    | 'language-not-supported'
    | 'network'
    | 'no-speech'
    | 'not-allowed'
    | 'permission-denied'
    | 'service-not-allowed';
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}
