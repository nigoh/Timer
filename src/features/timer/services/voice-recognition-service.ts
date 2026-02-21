import { VoiceState } from '@/types/voice';

export interface VoiceRecognitionCallbacks {
  onInterim: (text: string) => void;
  onConfirmed: (text: string) => void;
  onError: (error: VoiceState['error']) => void;
  onStopped: () => void;
}

const MAX_AUTO_RESTART = 3;

class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private shouldRestart = false;
  private restartCount = 0;
  private callbacks: VoiceRecognitionCallbacks | null = null;
  private currentLang: 'ja-JP' | 'en-US' = 'ja-JP';

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!(window.SpeechRecognition ?? window.webkitSpeechRecognition)
    );
  }

  start(lang: 'ja-JP' | 'en-US', callbacks: VoiceRecognitionCallbacks): void {
    if (!this.isSupported()) {
      callbacks.onError('not-supported');
      return;
    }

    this.callbacks = callbacks;
    this.currentLang = lang;
    this.shouldRestart = true;
    this.restartCount = 0;
    this._startRecognition();
  }

  stop(): void {
    this.shouldRestart = false;
    this.recognition?.stop();
  }

  setLanguage(lang: 'ja-JP' | 'en-US'): void {
    this.currentLang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  private _startRecognition(): void {
    const SpeechRecognitionClass =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    this.recognition = new SpeechRecognitionClass();
    this.recognition.lang = this.currentLang;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) {
            this.callbacks?.onConfirmed(text);
          }
        } else {
          interim += result[0].transcript;
        }
      }
      this.callbacks?.onInterim(interim);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        this.shouldRestart = false;
        this.callbacks?.onError('permission-denied');
      } else if (event.error === 'network') {
        this.shouldRestart = false;
        this.callbacks?.onError('network');
      } else if (event.error === 'aborted') {
        // shouldRestart フラグに従い onend で制御するため何もしない
      } else if (event.error === 'no-speech') {
        // no-speech は無音継続のため onend で再起動
      }
    };

    this.recognition.onend = () => {
      this.callbacks?.onInterim('');
      if (this.shouldRestart && this.restartCount < MAX_AUTO_RESTART) {
        this.restartCount++;
        setTimeout(() => {
          if (this.shouldRestart) {
            this._startRecognition();
          }
        }, 200);
      } else if (this.shouldRestart && this.restartCount >= MAX_AUTO_RESTART) {
        this.shouldRestart = false;
        this.callbacks?.onError('aborted');
        this.callbacks?.onStopped();
      } else {
        this.callbacks?.onStopped();
      }
    };

    this.recognition.onstart = () => {
      this.restartCount = 0;
    };

    try {
      this.recognition.start();
    } catch {
      this.callbacks?.onError('aborted');
    }
  }
}

export const voiceRecognitionService = new VoiceRecognitionService();
