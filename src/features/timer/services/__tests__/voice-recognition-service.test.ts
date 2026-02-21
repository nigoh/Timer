import { describe, expect, beforeEach, afterEach, it, vi } from 'vitest';

// グローバルに SpeechRecognition を注入
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MockSpeechRecognitionInstance: any;
let constructorCallCount = 0;

// class を使う（アロー関数は new できないのでクラス構文が必要）
class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    constructorCallCount++;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    MockSpeechRecognitionInstance = this;
  }
}

// VoiceRecognitionService はモジュールトップ（シングルトン）なので
// グローバルセットアップ前にモックを注入してからインポートする
describe('VoiceRecognitionService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: any;

  beforeEach(async () => {
    vi.resetModules();
    constructorCallCount = 0;
    // window.SpeechRecognition をクラスとして注入
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).SpeechRecognition = MockSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;
    const mod = await import('../voice-recognition-service');
    service = mod.voiceRecognitionService;
  });

  afterEach(() => {
    vi.clearAllMocks();
    service.stop();
  });

  describe('isSupported()', () => {
    it('window.SpeechRecognition が存在するとき true を返す', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('window.SpeechRecognition が存在しないとき false を返す', async () => {
      vi.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      delete win.SpeechRecognition;
      delete win.webkitSpeechRecognition;
      const mod = await import('../voice-recognition-service');
      expect(mod.voiceRecognitionService.isSupported()).toBe(false);
    });

    it('window.webkitSpeechRecognition で代替できるとき true を返す', async () => {
      vi.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      delete win.SpeechRecognition;
      win.webkitSpeechRecognition = MockSpeechRecognition;
      const mod = await import('../voice-recognition-service');
      expect(mod.voiceRecognitionService.isSupported()).toBe(true);
      delete win.webkitSpeechRecognition;
    });
  });

  describe('start()', () => {
    it('SpeechRecognition インスタンスを生成して start() を呼ぶ', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);
      expect(constructorCallCount).toBe(1);
      expect(MockSpeechRecognitionInstance.start).toHaveBeenCalledTimes(1);
    });

    it('lang / continuous / interimResults が正しく設定される', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('en-US', callbacks);
      expect(MockSpeechRecognitionInstance.lang).toBe('en-US');
      expect(MockSpeechRecognitionInstance.continuous).toBe(true);
      expect(MockSpeechRecognitionInstance.interimResults).toBe(true);
    });

    it('isSupported が false のとき onError("not-supported") を呼ぶ', async () => {
      vi.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      delete win.SpeechRecognition;
      delete win.webkitSpeechRecognition;
      const mod = await import('../voice-recognition-service');
      const s = mod.voiceRecognitionService;

      const onError = vi.fn();
      s.start('ja-JP', {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError,
        onStopped: vi.fn(),
      });
      expect(onError).toHaveBeenCalledWith('not-supported');
    });
  });

  describe('stop()', () => {
    it('SpeechRecognition.stop() を呼ぶ', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);
      service.stop();
      expect(MockSpeechRecognitionInstance.stop).toHaveBeenCalledTimes(1);
    });

    it('stop 後に onend が発火しても onStopped は呼ばれる', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);
      service.stop();
      // shouldRestart=false になっているので onStopped が呼ばれる
      MockSpeechRecognitionInstance.onend?.();
      expect(callbacks.onStopped).toHaveBeenCalledTimes(1);
    });
  });

  describe('onresult ハンドラ', () => {
    it('最終結果を onConfirmed に渡す', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);

      const mockEvent = {
        resultIndex: 0,
        results: [
          Object.assign(
            [{ transcript: '   確定テキスト   ', confidence: 1 }],
            { isFinal: true, length: 1 },
          ),
        ],
      } as unknown as SpeechRecognitionEvent;

      MockSpeechRecognitionInstance.onresult?.(mockEvent);
      expect(callbacks.onConfirmed).toHaveBeenCalledWith('確定テキスト');
    });

    it('中間結果を onInterim に渡す', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);

      const mockEvent = {
        resultIndex: 0,
        results: [
          Object.assign(
            [{ transcript: '入力途中...', confidence: 0.8 }],
            { isFinal: false, length: 1 },
          ),
        ],
      } as unknown as SpeechRecognitionEvent;

      MockSpeechRecognitionInstance.onresult?.(mockEvent);
      expect(callbacks.onInterim).toHaveBeenCalledWith('入力途中...');
      expect(callbacks.onConfirmed).not.toHaveBeenCalled();
    });

    it('空文字トリム後の確定テキストは onConfirmed を呼ばない', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);

      const mockEvent = {
        resultIndex: 0,
        results: [
          Object.assign(
            [{ transcript: '   ', confidence: 1 }],
            { isFinal: true, length: 1 },
          ),
        ],
      } as unknown as SpeechRecognitionEvent;

      MockSpeechRecognitionInstance.onresult?.(mockEvent);
      expect(callbacks.onConfirmed).not.toHaveBeenCalled();
    });
  });

  describe('onerror ハンドラ', () => {
    it('not-allowed エラーで onError("permission-denied") を呼ぶ', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);

      const mockErrorEvent = { error: 'not-allowed' } as SpeechRecognitionErrorEvent;
      MockSpeechRecognitionInstance.onerror?.(mockErrorEvent);
      expect(callbacks.onError).toHaveBeenCalledWith('permission-denied');
    });

    it('network エラーで onError("network") を呼ぶ', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);

      const mockErrorEvent = { error: 'network' } as SpeechRecognitionErrorEvent;
      MockSpeechRecognitionInstance.onerror?.(mockErrorEvent);
      expect(callbacks.onError).toHaveBeenCalledWith('network');
    });

    it('aborted エラーでは onError を呼ばない（onend で制御）', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);

      const mockErrorEvent = { error: 'aborted' } as SpeechRecognitionErrorEvent;
      MockSpeechRecognitionInstance.onerror?.(mockErrorEvent);
      expect(callbacks.onError).not.toHaveBeenCalled();
    });

    it('no-speech エラーでは onError を呼ばない', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);

      const mockErrorEvent = { error: 'no-speech' } as SpeechRecognitionErrorEvent;
      MockSpeechRecognitionInstance.onerror?.(mockErrorEvent);
      expect(callbacks.onError).not.toHaveBeenCalled();
    });
  });

  describe('onend ハンドラ（自動再起動）', () => {
    it('stop() 後の onend は onStopped を呼んで再起動しない', () => {
      vi.useFakeTimers();
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);
      service.stop();

      const callsBefore = constructorCallCount;
      MockSpeechRecognitionInstance.onend?.();
      vi.advanceTimersByTime(500);

      expect(constructorCallCount).toBe(callsBefore);
      expect(callbacks.onStopped).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('onend で interimTranscript がクリアされる（onInterim("") の呼び出し）', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);
      service.stop();
      MockSpeechRecognitionInstance.onend?.();
      expect(callbacks.onInterim).toHaveBeenCalledWith('');
    });
  });

  describe('setLanguage()', () => {
    it('認識中に言語を変更できる', () => {
      const callbacks = {
        onInterim: vi.fn(),
        onConfirmed: vi.fn(),
        onError: vi.fn(),
        onStopped: vi.fn(),
      };
      service.start('ja-JP', callbacks);
      service.setLanguage('en-US');
      expect(MockSpeechRecognitionInstance.lang).toBe('en-US');
    });
  });
});
