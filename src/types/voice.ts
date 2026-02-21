/** 確定済み文字起こしエントリ */
export interface VoiceTranscriptEntry {
  id: string;
  text: string;
  timestamp: number; // エポックミリ秒
  agendaId: string | null; // 録音開始時の議題 ID
}

/** voice-store の State */
export interface VoiceState {
  isSupported: boolean;
  isListening: boolean;
  language: 'ja-JP' | 'en-US';
  interimTranscript: string; // 認識中テキスト（暫定）
  confirmedEntries: VoiceTranscriptEntry[]; // 確定済みエントリ
  error: 'permission-denied' | 'not-supported' | 'network' | 'aborted' | null;
  currentAgendaId: string | null; // 現在録音に紐付けている議題 ID
}

/** voice-store の Actions */
export interface VoiceActions {
  startListening: (agendaId: string | null) => void;
  stopListening: () => void;
  setLanguage: (lang: 'ja-JP' | 'en-US') => void;
  setInterimTranscript: (text: string) => void;
  addConfirmedEntry: (entry: VoiceTranscriptEntry) => void;
  clearTranscript: () => void;
  setError: (error: VoiceState['error']) => void;
  setIsSupported: (val: boolean) => void;
  setIsListening: (val: boolean) => void;
}
