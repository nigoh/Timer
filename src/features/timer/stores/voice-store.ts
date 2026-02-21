import { create } from 'zustand';
import { VoiceState, VoiceActions, VoiceTranscriptEntry } from '@/types/voice';

type VoiceStore = VoiceState & VoiceActions;

export const useVoiceStore = create<VoiceStore>((set) => ({
  // State
  isSupported: false,
  isListening: false,
  language: 'ja-JP',
  interimTranscript: '',
  confirmedEntries: [],
  error: null,
  currentAgendaId: null,

  // Actions
  startListening: (agendaId) =>
    set({ isListening: true, error: null, currentAgendaId: agendaId }),

  stopListening: () =>
    set({ isListening: false, interimTranscript: '' }),

  setLanguage: (lang) => set({ language: lang }),

  setInterimTranscript: (text) => set({ interimTranscript: text }),

  addConfirmedEntry: (entry: VoiceTranscriptEntry) =>
    set((state) => ({
      confirmedEntries: [...state.confirmedEntries, entry],
      interimTranscript: '',
    })),

  clearTranscript: () =>
    set({ confirmedEntries: [], interimTranscript: '' }),

  setError: (error) => set({ error }),

  setIsSupported: (val) => set({ isSupported: val }),

  setIsListening: (val) => set({ isListening: val }),
}));
