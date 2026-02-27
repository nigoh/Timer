import { describe, it, expect, beforeEach } from 'vitest';
import { useMeetingKnowledgeStore } from '../meeting-knowledge-store';
import type { MeetingKnowledgeState } from '@/types/meetingOptimization';
import type { Meeting } from '@/types/agenda';

// ─── 定数 ──────────────────────────────────────────

const DEFAULT_SETTINGS = {
  enabled: true,
  learningWindow: 20,
  movingAverageWindow: 5,
  suggestionThreshold: 0.2,
};

const INITIAL_STATE: Partial<MeetingKnowledgeState> = {
  records: [],
  learnedPatterns: [],
  settings: DEFAULT_SETTINGS,
};

// ─── ヘルパー ──────────────────────────────────────

let counter = 0;
const DEFAULT_MEETING_SETTINGS: Meeting['settings'] = {
  autoTransition: false,
  silentMode: false,
  bellSettings: {
    start: true,
    fiveMinWarning: true,
    end: true,
    overtime: true,
    soundType: 'single',
  },
};

function makeMeeting(
  plannedTotal: number,
  actualTotal: number,
  title = 'テスト会議',
): Meeting {
  counter++;
  return {
    id: `meeting-${counter}`,
    title,
    agenda: [
      {
        id: `agenda-${counter}`,
        title: '議題1',
        plannedDuration: plannedTotal,
        actualDuration: actualTotal,
        status: 'completed',
        order: 0,
        remainingTime: 0,
        minutesContent: '',
        minutesFormat: 'markdown',
      },
    ],
    status: 'completed',
    startTime: new Date(2025, 0, counter),
    endTime: new Date(2025, 0, counter, 1),
    totalPlannedDuration: plannedTotal,
    totalActualDuration: actualTotal,
    settings: DEFAULT_MEETING_SETTINGS,
  };
}

// ─── ストアテスト ──────────────────────────────────

describe('meeting-knowledge-store', () => {
  beforeEach(() => {
    counter = 0;
    useMeetingKnowledgeStore.setState(INITIAL_STATE as MeetingKnowledgeState);
  });

  // ─── 初期状態 ───────────────────────────────────
  describe('初期状態', () => {
    it('records, learnedPatterns が空配列である', () => {
      const { records, learnedPatterns } = useMeetingKnowledgeStore.getState();
      expect(records).toHaveLength(0);
      expect(learnedPatterns).toHaveLength(0);
    });

    it('デフォルト設定が正しい', () => {
      const { settings } = useMeetingKnowledgeStore.getState();
      expect(settings.enabled).toBe(true);
      expect(settings.learningWindow).toBe(20);
      expect(settings.movingAverageWindow).toBe(5);
      expect(settings.suggestionThreshold).toBe(0.2);
    });
  });

  // ─── addMeetingRecord ───────────────────────────
  describe('addMeetingRecord()', () => {
    it('Meeting を MeetingRecord に変換して追加する', () => {
      const meeting = makeMeeting(600, 720);
      useMeetingKnowledgeStore.getState().addMeetingRecord(meeting);

      const { records } = useMeetingKnowledgeStore.getState();
      expect(records).toHaveLength(1);

      const rec = records[0];
      expect(rec.meetingId).toBe(meeting.id);
      expect(rec.title).toBe(meeting.title);
      expect(rec.totalPlannedDuration).toBe(600);
      expect(rec.totalActualDuration).toBe(720);
    });

    it('議題の実績情報が agendaRecords に変換される', () => {
      const meeting = makeMeeting(600, 720);
      useMeetingKnowledgeStore.getState().addMeetingRecord(meeting);

      const rec = useMeetingKnowledgeStore.getState().records[0];
      expect(rec.agendaRecords).toHaveLength(1);
      expect(rec.agendaRecords[0].plannedDuration).toBe(600);
      expect(rec.agendaRecords[0].actualDuration).toBe(720);
      expect(rec.agendaRecords[0].wasOvertime).toBe(true);
      expect(rec.agendaRecords[0].overtimeAmount).toBe(120);
    });

    it('会議が時間通りに終わった場合 wasOvertime = false になる', () => {
      const meeting = makeMeeting(600, 590);
      useMeetingKnowledgeStore.getState().addMeetingRecord(meeting);

      const rec = useMeetingKnowledgeStore.getState().records[0];
      expect(rec.agendaRecords[0].wasOvertime).toBe(false);
      expect(rec.agendaRecords[0].overtimeAmount).toBe(0);
    });

    it('複数回追加すると records が増える', () => {
      useMeetingKnowledgeStore.getState().addMeetingRecord(makeMeeting(600, 700));
      useMeetingKnowledgeStore.getState().addMeetingRecord(makeMeeting(600, 700));
      useMeetingKnowledgeStore.getState().addMeetingRecord(makeMeeting(600, 700));

      expect(useMeetingKnowledgeStore.getState().records).toHaveLength(3);
    });

    it('MAX_RECORDS(100)を超えた場合は古い記録を削除する', () => {
      // 100件追加（ストアは新着を先頭に積むため、最初に追加した記録が末尾になる）
      for (let i = 0; i < 100; i++) {
        useMeetingKnowledgeStore.getState().addMeetingRecord(makeMeeting(600, 700));
      }
      const { records: before } = useMeetingKnowledgeStore.getState();
      // 末尾が最も古い記録
      const oldestId = before[before.length - 1].id;

      // 101件目追加
      useMeetingKnowledgeStore.getState().addMeetingRecord(makeMeeting(600, 700));

      const { records } = useMeetingKnowledgeStore.getState();
      expect(records).toHaveLength(100);
      // 最も古い記録は削除されている
      const ids = records.map((r) => r.id);
      expect(ids).not.toContain(oldestId);
    });

    it('getRecords() が records と同じ配列を返す', () => {
      useMeetingKnowledgeStore.getState().addMeetingRecord(makeMeeting(600, 700));
      const { records, getRecords } = useMeetingKnowledgeStore.getState();
      expect(getRecords()).toEqual(records);
    });
  });

  // ─── resetKnowledge ────────────────────────────
  describe('resetKnowledge()', () => {
    it('records と learnedPatterns をクリアする', () => {
      useMeetingKnowledgeStore.getState().addMeetingRecord(makeMeeting(600, 700));
      useMeetingKnowledgeStore.getState().addMeetingRecord(makeMeeting(600, 700));

      useMeetingKnowledgeStore.getState().resetKnowledge();

      const { records, learnedPatterns } = useMeetingKnowledgeStore.getState();
      expect(records).toHaveLength(0);
      expect(learnedPatterns).toHaveLength(0);
    });

    it('settings はリセット後も保持される', () => {
      useMeetingKnowledgeStore.getState().updateSettings({ learningWindow: 10 });
      useMeetingKnowledgeStore.getState().resetKnowledge();

      expect(useMeetingKnowledgeStore.getState().settings.learningWindow).toBe(10);
    });
  });

  // ─── updateSettings ────────────────────────────
  describe('updateSettings()', () => {
    it('部分更新で指定したフィールドだけ変わる', () => {
      useMeetingKnowledgeStore.getState().updateSettings({ learningWindow: 30 });

      const { settings } = useMeetingKnowledgeStore.getState();
      expect(settings.learningWindow).toBe(30);
      // 他フィールドは変わっていない
      expect(settings.enabled).toBe(true);
      expect(settings.movingAverageWindow).toBe(5);
      expect(settings.suggestionThreshold).toBe(0.2);
    });

    it('enabled を false に変更できる', () => {
      useMeetingKnowledgeStore.getState().updateSettings({ enabled: false });
      expect(useMeetingKnowledgeStore.getState().settings.enabled).toBe(false);
    });

    it('複数フィールドを同時に更新できる', () => {
      useMeetingKnowledgeStore.getState().updateSettings({
        learningWindow: 50,
        movingAverageWindow: 10,
      });
      const { settings } = useMeetingKnowledgeStore.getState();
      expect(settings.learningWindow).toBe(50);
      expect(settings.movingAverageWindow).toBe(10);
    });
  });

  // ─── getPatterns ───────────────────────────────
  describe('getPatterns()', () => {
    it('初期状態では空配列を返す', () => {
      expect(useMeetingKnowledgeStore.getState().getPatterns()).toEqual([]);
    });

    it('setState でパターンを設定すると getPatterns() で取得できる', () => {
      const patterns = [
        {
          id: 'p1',
          titlePattern: 'テスト',
          avgPlannedDuration: 600,
          avgActualDuration: 780,
          avgOvertimeRate: 0.3,
          sampleCount: 5,
          updatedAt: '',
        },
      ];
      useMeetingKnowledgeStore.setState({ learnedPatterns: patterns });
      expect(useMeetingKnowledgeStore.getState().getPatterns()).toEqual(patterns);
    });
  });
});
