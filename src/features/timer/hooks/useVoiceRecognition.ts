import { useEffect, useRef, useCallback } from 'react';
import { useVoiceStore } from '@/features/timer/stores/voice-store';
import { voiceRecognitionService } from '@/features/timer/services/voice-recognition-service';
import { VoiceTranscriptEntry } from '@/types/voice';
import { logger } from '@/utils/logger';
import { generateId } from '@/utils/id';



export function useVoiceRecognition() {
  const {
    isListening,
    isSupported,
    interimTranscript,
    confirmedEntries,
    language,
    error,
    currentAgendaId,
    setIsSupported,
    startListening: storeStartListening,
    stopListening: storeStopListening,
    setInterimTranscript,
    addConfirmedEntry,
    setError,
    setLanguage,
    clearTranscript,
    setIsListening,
  } = useVoiceStore();

  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  // 対応チェック（初回のみ）
  useEffect(() => {
    setIsSupported(voiceRecognitionService.isSupported());
  }, [setIsSupported]);

  const start = useCallback(
    (agendaId: string | null) => {
      if (!voiceRecognitionService.isSupported()) {
        setError('not-supported');
        return;
      }
      storeStartListening(agendaId);
      logger.info('Voice recognition started', { agendaId, language }, 'voice');

      voiceRecognitionService.start(language, {
        onInterim: (text) => setInterimTranscript(text),
        onConfirmed: (text) => {
          const entry: VoiceTranscriptEntry = {
            id: generateId(),
            text,
            timestamp: Date.now(),
            agendaId,
          };
          addConfirmedEntry(entry);
        },
        onError: (err) => {
          setError(err);
          storeStopListening();
          logger.warn('Voice recognition error', { error: err }, 'voice');
        },
        onStopped: () => {
          if (isListeningRef.current) {
            storeStopListening();
          }
          logger.info('Voice recognition stopped', {}, 'voice');
        },
      });
    },
    [language, storeStartListening, storeStopListening, setInterimTranscript, addConfirmedEntry, setError],
  );

  const stop = useCallback(() => {
    voiceRecognitionService.stop();
    storeStopListening();
    logger.info('Voice recognition stopped by user', {}, 'voice');
  }, [storeStopListening]);

  const handleSetLanguage = useCallback(
    (lang: 'ja-JP' | 'en-US') => {
      setLanguage(lang);
      voiceRecognitionService.setLanguage(lang);
    },
    [setLanguage],
  );

  // アンマウント時に自動停止
  useEffect(() => {
    return () => {
      if (isListeningRef.current) {
        voiceRecognitionService.stop();
        setIsListening(false);
      }
    };
  }, [setIsListening]);

  return {
    isListening,
    isSupported,
    interimTranscript,
    confirmedEntries,
    language,
    error,
    currentAgendaId,
    start,
    stop,
    setLanguage: handleSetLanguage,
    clearTranscript,
  };
}
