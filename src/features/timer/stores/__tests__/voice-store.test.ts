import { describe, expect, beforeEach, it } from 'vitest';
import { useVoiceStore } from '../voice-store';
import type { VoiceTranscriptEntry } from '@/types/voice';

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

const makeEntry = (id: string, text: string): VoiceTranscriptEntry => ({
  id,
  text,
  timestamp: Date.now(),
  agendaId: null,
});

describe('useVoiceStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('初期状態が正しい', () => {
    const state = useVoiceStore.getState();
    expect(state.isSupported).toBe(false);
    expect(state.isListening).toBe(false);
    expect(state.language).toBe('ja-JP');
    expect(state.interimTranscript).toBe('');
    expect(state.confirmedEntries).toEqual([]);
    expect(state.error).toBeNull();
    expect(state.currentAgendaId).toBeNull();
  });

  describe('startListening', () => {
    it('isListening を true にし error を null にする', () => {
      useVoiceStore.setState({ error: 'network' });
      useVoiceStore.getState().startListening(null);
      const state = useVoiceStore.getState();
      expect(state.isListening).toBe(true);
      expect(state.error).toBeNull();
    });

    it('agendaId を currentAgendaId にセットする', () => {
      useVoiceStore.getState().startListening('agenda-123');
      expect(useVoiceStore.getState().currentAgendaId).toBe('agenda-123');
    });

    it('agendaId が null でも動作する', () => {
      useVoiceStore.getState().startListening(null);
      expect(useVoiceStore.getState().currentAgendaId).toBeNull();
    });
  });

  describe('stopListening', () => {
    it('isListening を false にする', () => {
      useVoiceStore.setState({ isListening: true });
      useVoiceStore.getState().stopListening();
      expect(useVoiceStore.getState().isListening).toBe(false);
    });

    it('interimTranscript をクリアする', () => {
      useVoiceStore.setState({ isListening: true, interimTranscript: '途中のテキスト' });
      useVoiceStore.getState().stopListening();
      expect(useVoiceStore.getState().interimTranscript).toBe('');
    });
  });

  describe('setLanguage', () => {
    it('言語を en-US に切り替えられる', () => {
      useVoiceStore.getState().setLanguage('en-US');
      expect(useVoiceStore.getState().language).toBe('en-US');
    });

    it('言語を ja-JP に戻せる', () => {
      useVoiceStore.setState({ language: 'en-US' });
      useVoiceStore.getState().setLanguage('ja-JP');
      expect(useVoiceStore.getState().language).toBe('ja-JP');
    });
  });

  describe('setInterimTranscript', () => {
    it('interimTranscript を更新する', () => {
      useVoiceStore.getState().setInterimTranscript('録音中のテキスト...');
      expect(useVoiceStore.getState().interimTranscript).toBe('録音中のテキスト...');
    });

    it('空文字列にクリアできる', () => {
      useVoiceStore.setState({ interimTranscript: 'some text' });
      useVoiceStore.getState().setInterimTranscript('');
      expect(useVoiceStore.getState().interimTranscript).toBe('');
    });
  });

  describe('addConfirmedEntry', () => {
    it('confirmedEntries にエントリを追加する', () => {
      const entry = makeEntry('e1', 'テスト発言');
      useVoiceStore.getState().addConfirmedEntry(entry);
      const { confirmedEntries } = useVoiceStore.getState();
      expect(confirmedEntries).toHaveLength(1);
      expect(confirmedEntries[0]).toEqual(entry);
    });

    it('複数のエントリを追加できる', () => {
      useVoiceStore.getState().addConfirmedEntry(makeEntry('e1', '発言1'));
      useVoiceStore.getState().addConfirmedEntry(makeEntry('e2', '発言2'));
      useVoiceStore.getState().addConfirmedEntry(makeEntry('e3', '発言3'));
      expect(useVoiceStore.getState().confirmedEntries).toHaveLength(3);
    });

    it('エントリ追加後に interimTranscript がクリアされる', () => {
      useVoiceStore.setState({ interimTranscript: '入力途中...' });
      useVoiceStore.getState().addConfirmedEntry(makeEntry('e1', '確定テキスト'));
      expect(useVoiceStore.getState().interimTranscript).toBe('');
    });
  });

  describe('clearTranscript', () => {
    it('confirmedEntries と interimTranscript を空にする', () => {
      useVoiceStore.setState({
        confirmedEntries: [makeEntry('e1', 'test')],
        interimTranscript: '途中...',
      });
      useVoiceStore.getState().clearTranscript();
      const state = useVoiceStore.getState();
      expect(state.confirmedEntries).toEqual([]);
      expect(state.interimTranscript).toBe('');
    });
  });

  describe('setError', () => {
    it('permission-denied エラーをセットできる', () => {
      useVoiceStore.getState().setError('permission-denied');
      expect(useVoiceStore.getState().error).toBe('permission-denied');
    });

    it('network エラーをセットできる', () => {
      useVoiceStore.getState().setError('network');
      expect(useVoiceStore.getState().error).toBe('network');
    });

    it('aborted エラーをセットできる', () => {
      useVoiceStore.getState().setError('aborted');
      expect(useVoiceStore.getState().error).toBe('aborted');
    });

    it('not-supported エラーをセットできる', () => {
      useVoiceStore.getState().setError('not-supported');
      expect(useVoiceStore.getState().error).toBe('not-supported');
    });

    it('null でエラーをクリアできる', () => {
      useVoiceStore.setState({ error: 'network' });
      useVoiceStore.getState().setError(null);
      expect(useVoiceStore.getState().error).toBeNull();
    });
  });

  describe('setIsSupported', () => {
    it('isSupported を true にできる', () => {
      useVoiceStore.getState().setIsSupported(true);
      expect(useVoiceStore.getState().isSupported).toBe(true);
    });

    it('isSupported を false に戻せる', () => {
      useVoiceStore.setState({ isSupported: true });
      useVoiceStore.getState().setIsSupported(false);
      expect(useVoiceStore.getState().isSupported).toBe(false);
    });
  });

  describe('setIsListening', () => {
    it('isListening を直接セットできる', () => {
      useVoiceStore.getState().setIsListening(true);
      expect(useVoiceStore.getState().isListening).toBe(true);
      useVoiceStore.getState().setIsListening(false);
      expect(useVoiceStore.getState().isListening).toBe(false);
    });
  });
});
