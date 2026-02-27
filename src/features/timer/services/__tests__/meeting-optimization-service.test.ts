import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  analyze,
  updateLearnedPatterns,
  generateSuggestions,
  getSuggestionsForAgenda,
} from '../meeting-optimization-service';
import type { MeetingRecord, KnowledgeSettings } from '@/types/meetingOptimization';
import type { AgendaItem } from '@/types/agenda';

// ─── テスト用定数 ──────────────────────────────────

const DEFAULT_SETTINGS: KnowledgeSettings = {
  enabled: true,
  learningWindow: 20,
  movingAverageWindow: 5,
  suggestionThreshold: 0.2,
};

// ─── ヘルパー ──────────────────────────────────────

let idCounter = 0;
function makeRecord(
  plannedTotal: number,
  actualTotal: number,
  agendaOverrides: { planned: number; actual: number; title?: string }[] = [],
): MeetingRecord {
  const agendaRecords =
    agendaOverrides.length > 0
      ? agendaOverrides.map((a, i) => ({
          agendaId: `agenda-${i}`,
          title: a.title ?? `議題${i + 1}`,
          plannedDuration: a.planned,
          actualDuration: a.actual,
          wasOvertime: a.actual > a.planned,
          overtimeAmount: Math.max(0, a.actual - a.planned),
        }))
      : [
          {
            agendaId: 'agenda-0',
            title: '議題1',
            plannedDuration: plannedTotal,
            actualDuration: actualTotal,
            wasOvertime: actualTotal > plannedTotal,
            overtimeAmount: Math.max(0, actualTotal - plannedTotal),
          },
        ];

  return {
    id: `rec-${idCounter++}`,
    meetingId: `meeting-${idCounter}`,
    title: `テスト会議 ${idCounter}`,
    agendaRecords,
    totalPlannedDuration: plannedTotal,
    totalActualDuration: actualTotal,
    completedAt: new Date(2025, 0, idCounter).toISOString(),
    suggestionApplied: false,
  };
}

function makeAgendaItem(id: string, title: string, plannedDuration: number): AgendaItem {
  return {
    id,
    title,
    plannedDuration,
    actualDuration: 0,
    status: 'pending',
    order: 0,
    remainingTime: plannedDuration,
    minutesContent: '',
    minutesFormat: 'markdown',
  };
}

// ─── analyze() ────────────────────────────────────

describe('analyze()', () => {
  beforeEach(() => { idCounter = 0; });

  it('3件未満のデータでは空配列を返す', () => {
    const records = [makeRecord(600, 700), makeRecord(600, 700)];
    expect(analyze(records, DEFAULT_SETTINGS)).toEqual([]);
  });

  it('超過率が閾値未満のとき overtime-trend を生成しない', () => {
    // 全会議が 5% 超過（閾値 20% 未満）
    const records = Array.from({ length: 5 }, () => makeRecord(600, 630));
    const insights = analyze(records, DEFAULT_SETTINGS);
    const hasTrend = insights.some((i) => i.type === 'overtime-trend');
    expect(hasTrend).toBe(false);
  });

  it('超過率が閾値以上のとき overtime-trend を生成する', () => {
    // 全会議が 30% 超過
    const records = Array.from({ length: 5 }, () => makeRecord(600, 780));
    const insights = analyze(records, DEFAULT_SETTINGS);
    const trend = insights.find((i) => i.type === 'overtime-trend');
    expect(trend).toBeDefined();
    expect(trend!.confidence).toBeGreaterThan(0);
  });

  it('movingAverageWindow の件数だけでなく全件から overtime-trend を計算する', () => {
    // 直近 5 件（window）だけ超過 30%、残りは超過なし
    const windowRecords = Array.from({ length: 5 }, () => makeRecord(600, 780));
    const oldRecords = Array.from({ length: 10 }, () => makeRecord(600, 600));
    const records = [...windowRecords, ...oldRecords];
    const insights = analyze(records, DEFAULT_SETTINGS);
    const trend = insights.find((i) => i.type === 'overtime-trend');
    expect(trend).toBeDefined();
  });

  it('議題タイトルのパターンが 3 件以上超過しているとき item-pattern を生成する', () => {
    const agendas = [{ planned: 600, actual: 900, title: '定例報告' }];
    const records = Array.from({ length: 5 }, () => makeRecord(600, 900, agendas));
    const insights = analyze(records, DEFAULT_SETTINGS);
    const pattern = insights.find((i) => i.type === 'item-pattern');
    expect(pattern).toBeDefined();
  });
});

// ─── updateLearnedPatterns() ──────────────────────────

describe('updateLearnedPatterns()', () => {
  beforeEach(() => { idCounter = 0; });

  it('3件未満のパターンは学習しない', () => {
    const agendas = [{ planned: 600, actual: 900, title: '定例報告' }];
    const records = [
      makeRecord(600, 900, agendas),
      makeRecord(600, 900, agendas),
    ];
    const patterns = updateLearnedPatterns(records, DEFAULT_SETTINGS);
    expect(patterns).toHaveLength(0);
  });

  it('3件以上のパターンを学習してパターンを生成する', () => {
    const agendas = [{ planned: 600, actual: 840, title: '定例報告' }];
    const records = Array.from({ length: 5 }, () => makeRecord(600, 840, agendas));
    const patterns = updateLearnedPatterns(records, DEFAULT_SETTINGS);
    expect(patterns.length).toBeGreaterThan(0);
    const p = patterns[0];
    expect(p.titlePattern).toBe('定例報告');
    expect(p.sampleCount).toBe(5);
    expect(p.avgOvertimeRate).toBeGreaterThan(0);
  });

  it('番号プレフィックス（"1. 定例報告"）は正規化されて同一パターンに集約される', () => {
    const records = [
      makeRecord(600, 840, [{ planned: 600, actual: 840, title: '1. 定例報告' }]),
      makeRecord(600, 840, [{ planned: 600, actual: 840, title: '2. 定例報告' }]),
      makeRecord(600, 840, [{ planned: 600, actual: 840, title: '定例報告' }]),
      makeRecord(600, 840, [{ planned: 600, actual: 840, title: '定例報告' }]),
      makeRecord(600, 840, [{ planned: 600, actual: 840, title: '定例報告' }]),
    ];
    const patterns = updateLearnedPatterns(records, DEFAULT_SETTINGS);
    expect(patterns.length).toBe(1);
    expect(patterns[0].sampleCount).toBe(5);
  });
});

// ─── generateSuggestions() ────────────────────────────

describe('generateSuggestions()', () => {
  beforeEach(() => { idCounter = 0; });

  it('超過率が閾値未満のパターンは提案を生成しない', () => {
    const pattern = {
      id: 'p1',
      titlePattern: '定例報告',
      avgPlannedDuration: 600,
      avgActualDuration: 620,   // 3.3% 超過（閾値 20% 未満）
      avgOvertimeRate: 0.033,
      sampleCount: 5,
      updatedAt: '',
    };
    const agendaItems = [makeAgendaItem('a1', '定例報告', 600)];
    const suggestions = generateSuggestions([], agendaItems, [pattern]);
    expect(suggestions.filter((s) => s.agendaId === 'a1')).toHaveLength(0);
  });

  it('超過率が閾値以上かつ 3 件以上で duration-adjustment 提案を生成する', () => {
    const pattern = {
      id: 'p1',
      titlePattern: '定例報告',
      avgPlannedDuration: 600,
      avgActualDuration: 780,   // 30% 超過
      avgOvertimeRate: 0.3,
      sampleCount: 5,
      updatedAt: '',
    };
    const agendaItems = [makeAgendaItem('a1', '定例報告', 600)];
    const suggestions = generateSuggestions([], agendaItems, [pattern]);
    const s = suggestions.find((s) => s.agendaId === 'a1');
    expect(s).toBeDefined();
    expect(s!.type).toBe('duration-adjustment');
    // suggestedValue = avgActualDuration * 1.1 = 780 * 1.1 = 858
    expect(s!.suggestedValue).toBe(858);
    expect(s!.currentValue).toBe(600);
  });

  it('提案値が現在値以下の場合は提案を生成しない', () => {
    const pattern = {
      id: 'p1',
      titlePattern: '定例報告',
      avgPlannedDuration: 600,
      avgActualDuration: 500,   // 実績が予定より短い
      avgOvertimeRate: 0.3,     // レートは閾値以上でも実績が短い
      sampleCount: 5,
      updatedAt: '',
    };
    const agendaItems = [makeAgendaItem('a1', '定例報告', 600)];
    const suggestions = generateSuggestions([], agendaItems, [pattern]);
    expect(suggestions.filter((s) => s.agendaId === 'a1')).toHaveLength(0);
  });

  it('overtime-trend インサイトがあるとき total-duration 提案を生成する', () => {
    const insight = {
      type: 'overtime-trend' as const,
      description: '',
      confidence: 0.8,
      data: { avgOvertimeRate: 0.3, sampleCount: 5 },
    };
    const agendaItems = [
      makeAgendaItem('a1', '議題1', 600),
      makeAgendaItem('a2', '議題2', 600),
    ];
    const suggestions = generateSuggestions([insight], agendaItems, []);
    const totalSuggestion = suggestions.find((s) => s.type === 'total-duration');
    expect(totalSuggestion).toBeDefined();
    // totalPlanned = 1200, rate = 0.3, suggestedTotal = round(1200 * 1.3) = 1560
    expect(totalSuggestion!.suggestedValue).toBe(1560);
  });
});

// ─── getSuggestionsForAgenda() ─────────────────────────

describe('getSuggestionsForAgenda()', () => {
  beforeEach(() => {
    idCounter = 0;
    // meeting-knowledge-store の getState をモック
    vi.mock('@/features/timer/stores/meeting-knowledge-store', () => ({
      useMeetingKnowledgeStore: {
        getState: vi.fn(),
        setState: vi.fn(),
      },
    }));
  });

  it('settings.enabled = false のとき空配列を返す', async () => {
    const { useMeetingKnowledgeStore } = await import('@/features/timer/stores/meeting-knowledge-store');
    vi.mocked(useMeetingKnowledgeStore.getState).mockReturnValue({
      records: [],
      learnedPatterns: [],
      settings: { enabled: false, learningWindow: 20, movingAverageWindow: 5, suggestionThreshold: 0.2 },
    } as unknown as ReturnType<typeof useMeetingKnowledgeStore.getState>);

    const agendaItems = [makeAgendaItem('a1', 'テスト', 600)];
    const suggestions = getSuggestionsForAgenda(agendaItems);
    expect(suggestions).toEqual([]);
  });

  it('記録が 3 件未満のとき空配列を返す', async () => {
    const { useMeetingKnowledgeStore } = await import('@/features/timer/stores/meeting-knowledge-store');
    vi.mocked(useMeetingKnowledgeStore.getState).mockReturnValue({
      records: [makeRecord(600, 700), makeRecord(600, 700)],
      learnedPatterns: [],
      settings: { enabled: true, learningWindow: 20, movingAverageWindow: 5, suggestionThreshold: 0.2 },
    } as unknown as ReturnType<typeof useMeetingKnowledgeStore.getState>);

    const agendaItems = [makeAgendaItem('a1', 'テスト', 600)];
    const suggestions = getSuggestionsForAgenda(agendaItems);
    expect(suggestions).toEqual([]);
  });
});
