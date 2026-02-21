import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, beforeEach, afterEach, it, vi } from 'vitest';
import { useVoiceStore } from '@/features/timer/stores/voice-store';
import { useVoiceRecognition } from '@/features/timer/hooks/useVoiceRecognition';

// vi.mock は hoisted されるため mockService は vi.hoisted() で定義する
const { mockService } = vi.hoisted(() => ({
  mockService: {
    isSupported: vi.fn(() => true),
    start: vi.fn(),
    stop: vi.fn(),
    setLanguage: vi.fn(),
  },
}));

vi.mock('@/features/timer/services/voice-recognition-service', () => ({
  voiceRecognitionService: mockService,
}));

// logger をモック
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const resetStore = () => {
  useVoiceStore.setState({
    isSupported: false,
    isListening: false,
    language: 'ja-JP',
    interimTranscript: '',
    confirmedEntries: [],
    error: null,
    currentAgendaId: null,
  });
};

// フックの返り値をキャプチャするテストコンポーネント
type HookReturn = ReturnType<typeof useVoiceRecognition>;
let capturedHook: HookReturn;

function HookHarness() {
  capturedHook = useVoiceRecognition();
  return null;
}

describe('useVoiceRecognition', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(async () => {
    resetStore();
    vi.clearAllMocks();
    mockService.isSupported.mockReturnValue(true);
    container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      root = createRoot(container);
      root.render(React.createElement(HookHarness));
    });
  });

  afterEach(() => {
    act(() => { root.unmount(); });
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('マウント時に isSupported を voice-recognition-service から取得する', () => {
    expect(useVoiceStore.getState().isSupported).toBe(true);
  });

  it('isSupported=false のとき isSupported が false のまま', async () => {
    mockService.isSupported.mockReturnValue(false);
    // 再マウント
    act(() => { root.unmount(); });
    resetStore();
    await act(async () => {
      root = createRoot(container);
      root.render(React.createElement(HookHarness));
    });
    expect(useVoiceStore.getState().isSupported).toBe(false);
  });

  describe('start()', () => {
    it('voiceRecognitionService.start() を呼ぶ', async () => {
      await act(async () => {
        capturedHook.start('agenda-1');
      });
      expect(mockService.start).toHaveBeenCalledTimes(1);
      expect(mockService.start).toHaveBeenCalledWith(
        'ja-JP',
        expect.objectContaining({
          onInterim: expect.any(Function),
          onConfirmed: expect.any(Function),
          onError: expect.any(Function),
          onStopped: expect.any(Function),
        }),
      );
    });

    it('start 後に store.isListening が true になる', async () => {
      await act(async () => {
        capturedHook.start('agenda-1');
      });
      expect(useVoiceStore.getState().isListening).toBe(true);
    });

    it('isSupported=false のとき voiceRecognitionService.start() を呼ばない', async () => {
      mockService.isSupported.mockReturnValue(false);
      act(() => { root.unmount(); });
      resetStore();
      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(HookHarness));
      });
      await act(async () => {
        capturedHook.start(null);
      });
      expect(mockService.start).not.toHaveBeenCalled();
      expect(useVoiceStore.getState().error).toBe('not-supported');
    });

    it('onConfirmed コールバックが confirmedEntries にエントリを追加する', async () => {
      await act(async () => {
        capturedHook.start('agenda-1');
      });
      const callbacks = mockService.start.mock.calls[0]![1] as {
        onConfirmed: (text: string) => void;
      };
      act(() => {
        callbacks.onConfirmed('テスト発言');
      });
      expect(useVoiceStore.getState().confirmedEntries).toHaveLength(1);
      expect(useVoiceStore.getState().confirmedEntries[0].text).toBe('テスト発言');
    });

    it('onInterim コールバックが interimTranscript を更新する', async () => {
      await act(async () => {
        capturedHook.start(null);
      });
      const callbacks = mockService.start.mock.calls[0]![1] as {
        onInterim: (text: string) => void;
      };
      act(() => {
        callbacks.onInterim('途中テキスト');
      });
      expect(useVoiceStore.getState().interimTranscript).toBe('途中テキスト');
    });

    it('onError コールバックでストアに error がセットされ isListening が false になる', async () => {
      await act(async () => {
        capturedHook.start('agenda-1');
      });
      const callbacks = mockService.start.mock.calls[0]![1] as {
        onError: (err: 'permission-denied') => void;
      };
      act(() => {
        callbacks.onError('permission-denied');
      });
      expect(useVoiceStore.getState().error).toBe('permission-denied');
      expect(useVoiceStore.getState().isListening).toBe(false);
    });
  });

  describe('stop()', () => {
    it('voiceRecognitionService.stop() を呼ぶ', async () => {
      await act(async () => {
        capturedHook.start('agenda-1');
        capturedHook.stop();
      });
      expect(mockService.stop).toHaveBeenCalledTimes(1);
    });

    it('stop 後に isListening が false になる', async () => {
      await act(async () => { capturedHook.start('agenda-1'); });
      await act(async () => { capturedHook.stop(); });
      expect(useVoiceStore.getState().isListening).toBe(false);
    });
  });

  describe('setLanguage()', () => {
    it('ストアの language を更新し voiceRecognitionService.setLanguage() を呼ぶ', async () => {
      await act(async () => {
        capturedHook.setLanguage('en-US');
      });
      expect(useVoiceStore.getState().language).toBe('en-US');
      expect(mockService.setLanguage).toHaveBeenCalledWith('en-US');
    });
  });

  describe('clearTranscript()', () => {
    it('confirmedEntries と interimTranscript を空にする', async () => {
      useVoiceStore.setState({
        confirmedEntries: [{ id: 'e1', text: 'test', timestamp: Date.now(), agendaId: null }],
        interimTranscript: '途中',
      });
      await act(async () => {
        capturedHook.clearTranscript();
      });
      expect(useVoiceStore.getState().confirmedEntries).toEqual([]);
      expect(useVoiceStore.getState().interimTranscript).toBe('');
    });
  });

  describe('アンマウント時の自動停止', () => {
    it('isListening=true の状態でアンマウントすると voiceRecognitionService.stop() が呼ばれる', async () => {
      await act(async () => {
        capturedHook.start('agenda-1');
      });
      // afterEach の unmount より前に明示的に unmount
      act(() => { root.unmount(); });
      expect(mockService.stop).toHaveBeenCalled();
      // afterEach で再 unmount しないよう再マウント
      await act(async () => {
        resetStore();
        root = createRoot(container);
        root.render(React.createElement(HookHarness));
      });
    });

    it('isListening=false の状態でアンマウントしても stop() は呼ばれない', async () => {
      // start していないのでリッスン状態ではない
      act(() => { root.unmount(); });
      expect(mockService.stop).not.toHaveBeenCalled();
      // afterEach で再 unmount しないよう再マウント
      await act(async () => {
        root = createRoot(container);
        root.render(React.createElement(HookHarness));
      });
    });
  });
});
