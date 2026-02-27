import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Meeting } from '@/types/agenda';
import type {
  MeetingRecord,
  AgendaRecord,
  KnowledgeSettings,
  MeetingKnowledgeState,
  MeetingKnowledgeActions,
} from '@/types/meetingOptimization';
import { generateId } from '@/utils/id';
import { logger } from '@/utils/logger';

const MAX_RECORDS = 100;

const DEFAULT_SETTINGS: KnowledgeSettings = {
  enabled: true,
  learningWindow: 20,
  movingAverageWindow: 5,
  suggestionThreshold: 0.2,
};

type MeetingKnowledgeStore = MeetingKnowledgeState & MeetingKnowledgeActions;

/**
 * MAPE-K Knowledge Store
 * 会議完了データの蓄積・学習パターン・設定を永続管理する。
 */
export const useMeetingKnowledgeStore = create<MeetingKnowledgeStore>()(
  persist(
    (set, get) => ({
      // ── State ──
      records: [],
      learnedPatterns: [],
      settings: DEFAULT_SETTINGS,

      // ── Actions ──

      addMeetingRecord: (meeting: Meeting) => {
        const agendaRecords: AgendaRecord[] = meeting.agenda.map((item) => {
          const overtime = item.actualDuration - item.plannedDuration;
          return {
            agendaId: item.id,
            title: item.title,
            plannedDuration: item.plannedDuration,
            actualDuration: item.actualDuration,
            wasOvertime: overtime > 0,
            overtimeAmount: Math.max(0, overtime),
          };
        });

        const record: MeetingRecord = {
          id: generateId(),
          meetingId: meeting.id,
          title: meeting.title,
          agendaRecords,
          totalPlannedDuration: meeting.totalPlannedDuration,
          totalActualDuration: meeting.totalActualDuration,
          completedAt: new Date().toISOString(),
          suggestionApplied: false,
        };

        set((state) => {
          const updated = [record, ...state.records];
          // 最大件数を超過した場合、最も古い記録を削除
          const trimmed = updated.length > MAX_RECORDS
            ? updated.slice(0, MAX_RECORDS)
            : updated;
          return { records: trimmed };
        });

        logger.info(
          '会議記録を Knowledge Store に追加',
          { meetingId: meeting.id, title: meeting.title, agendaCount: agendaRecords.length },
          'mape-k',
        );
      },

      getRecords: () => get().records,

      getPatterns: () => get().learnedPatterns,

      updateSettings: (partial) => {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }));
        logger.info('MAPE-K 設定を更新', partial, 'mape-k');
      },

      resetKnowledge: () => {
        set({ records: [], learnedPatterns: [] });
        logger.info('MAPE-K 学習データをリセット', undefined, 'mape-k');
      },
    }),
    {
      name: 'meeting-knowledge-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        records: state.records,
        learnedPatterns: state.learnedPatterns,
        settings: state.settings,
      }),
    },
  ),
);
