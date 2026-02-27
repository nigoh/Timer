import type { AgendaItem } from '@/types/agenda';
import type {
  MeetingRecord,
  MeetingInsight,
  LearnedPattern,
  Suggestion,
  KnowledgeSettings,
} from '@/types/meetingOptimization';
import { generateId } from '@/utils/id';
import { logger } from '@/utils/logger';
import { useMeetingKnowledgeStore } from '@/features/timer/stores/meeting-knowledge-store';

// ─── 内部ユーティリティ ───────────────────────────────

const MIN_SAMPLE_COUNT = 3;

/** 議題タイトルを正規化してパターンキーを生成 */
const normalizeTitlePattern = (title: string): string =>
  title
    .trim()
    .toLowerCase()
    .replace(/^[\d#.\-\s]+/, '')  // 先頭の番号を除去
    .replace(/\s+/g, ' ');

/** 超過率を計算（planned が 0 の場合は 0 を返す） */
const calcOvertimeRate = (planned: number, actual: number): number =>
  planned > 0 ? Math.max(0, (actual - planned) / planned) : 0;

// ─── Analyze (MAPE-K) ────────────────────────────────

/**
 * 会議記録から分析インサイトを生成する。
 */
export function analyze(
  records: MeetingRecord[],
  settings: KnowledgeSettings,
): MeetingInsight[] {
  if (records.length < MIN_SAMPLE_COUNT) return [];

  const insights: MeetingInsight[] = [];

  // 1. 全体超過傾向（移動平均）
  const recentRecords = records.slice(0, settings.movingAverageWindow);
  const avgOvertimeRate =
    recentRecords.reduce(
      (sum, r) => sum + calcOvertimeRate(r.totalPlannedDuration, r.totalActualDuration),
      0,
    ) / recentRecords.length;

  if (avgOvertimeRate >= settings.suggestionThreshold) {
    insights.push({
      type: 'overtime-trend',
      description: `直近 ${recentRecords.length} 件の会議で平均 ${Math.round(avgOvertimeRate * 100)}% の超過傾向があります`,
      confidence: Math.min(1, recentRecords.length / settings.learningWindow),
      data: { avgOvertimeRate, sampleCount: recentRecords.length },
    });
  }

  // 2. 議題レベルのパターン分析
  const patternMap = new Map<string, { planned: number[]; actual: number[] }>();
  const window = records.slice(0, settings.learningWindow);

  for (const record of window) {
    for (const agenda of record.agendaRecords) {
      const key = normalizeTitlePattern(agenda.title);
      if (!key) continue;
      const entry = patternMap.get(key) ?? { planned: [], actual: [] };
      entry.planned.push(agenda.plannedDuration);
      entry.actual.push(agenda.actualDuration);
      patternMap.set(key, entry);
    }
  }

  for (const [pattern, data] of patternMap) {
    if (data.planned.length < MIN_SAMPLE_COUNT) continue;

    const avgPlanned = data.planned.reduce((a, b) => a + b, 0) / data.planned.length;
    const avgActual = data.actual.reduce((a, b) => a + b, 0) / data.actual.length;
    const rate = calcOvertimeRate(avgPlanned, avgActual);

    if (rate >= settings.suggestionThreshold) {
      insights.push({
        type: 'item-pattern',
        description: `「${pattern}」の議題は平均 ${Math.round(rate * 100)}% 超過しています（${data.planned.length} 件）`,
        confidence: Math.min(1, data.planned.length / settings.learningWindow),
        data: { avgPlanned, avgActual, avgOvertimeRate: rate, sampleCount: data.planned.length },
      });
    }
  }

  return insights;
}

// ─── 学習パターン更新 ────────────────────────────────

/**
 * 会議記録からパターンを学習・更新する。
 */
export function updateLearnedPatterns(
  records: MeetingRecord[],
  settings: KnowledgeSettings,
): LearnedPattern[] {
  const window = records.slice(0, settings.learningWindow);
  const patternMap = new Map<string, { planned: number[]; actual: number[] }>();

  for (const record of window) {
    for (const agenda of record.agendaRecords) {
      const key = normalizeTitlePattern(agenda.title);
      if (!key) continue;
      const entry = patternMap.get(key) ?? { planned: [], actual: [] };
      entry.planned.push(agenda.plannedDuration);
      entry.actual.push(agenda.actualDuration);
      patternMap.set(key, entry);
    }
  }

  const now = new Date().toISOString();
  const patterns: LearnedPattern[] = [];

  for (const [pattern, data] of patternMap) {
    if (data.planned.length < MIN_SAMPLE_COUNT) continue;

    const avgPlanned = data.planned.reduce((a, b) => a + b, 0) / data.planned.length;
    const avgActual = data.actual.reduce((a, b) => a + b, 0) / data.actual.length;

    patterns.push({
      id: generateId(),
      titlePattern: pattern,
      avgPlannedDuration: Math.round(avgPlanned),
      avgActualDuration: Math.round(avgActual),
      avgOvertimeRate: calcOvertimeRate(avgPlanned, avgActual),
      sampleCount: data.planned.length,
      updatedAt: now,
    });
  }

  return patterns;
}

// ─── Plan (MAPE-K) ──────────────────────────────────

/**
 * インサイトとパターンから具体的な提案を生成する。
 */
export function generateSuggestions(
  insights: MeetingInsight[],
  agendaItems: AgendaItem[],
  patterns: LearnedPattern[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const item of agendaItems) {
    const normalizedTitle = normalizeTitlePattern(item.title);
    const matchedPattern = patterns.find((p) => p.titlePattern === normalizedTitle);

    if (!matchedPattern) continue;
    if (matchedPattern.sampleCount < MIN_SAMPLE_COUNT) continue;
    if (matchedPattern.avgOvertimeRate < 0.2) continue;

    // 提案値 = 平均実績の 110%（バッファ込み）
    const suggestedValue = Math.round(matchedPattern.avgActualDuration * 1.1);

    // 現在値と提案値が同じか提案値が小さい場合はスキップ
    if (suggestedValue <= item.plannedDuration) continue;

    suggestions.push({
      id: generateId(),
      agendaId: item.id,
      type: 'duration-adjustment',
      currentValue: item.plannedDuration,
      suggestedValue,
      reason: `過去 ${matchedPattern.sampleCount} 件の「${matchedPattern.titlePattern}」では平均 ${Math.round(matchedPattern.avgOvertimeRate * 100)}% 超過しています。実績に基づき ${formatDuration(suggestedValue)} を推奨します。`,
      confidence: Math.min(1, matchedPattern.sampleCount / 20),
      basedOnCount: matchedPattern.sampleCount,
    });
  }

  // 全体の超過傾向に基づく合計時間提案
  const overtimeTrend = insights.find((i) => i.type === 'overtime-trend');
  if (overtimeTrend && agendaItems.length > 0) {
    const totalPlanned = agendaItems.reduce((sum, a) => sum + a.plannedDuration, 0);
    const rate = overtimeTrend.data.avgOvertimeRate ?? 0;
    const suggestedTotal = Math.round(totalPlanned * (1 + rate));

    if (suggestedTotal > totalPlanned) {
      suggestions.push({
        id: generateId(),
        agendaId: '',
        type: 'total-duration',
        currentValue: totalPlanned,
        suggestedValue: suggestedTotal,
        reason: `直近の会議は平均 ${Math.round(rate * 100)}% 超過傾向にあります。全体で ${formatDuration(suggestedTotal)} の確保を推奨します。`,
        confidence: overtimeTrend.confidence,
        basedOnCount: overtimeTrend.data.sampleCount ?? 0,
      });
    }
  }

  return suggestions;
}

// ─── 公開 API ────────────────────────────────────

/**
 * 指定のアジェンダ項目に対する提案を一括取得する。
 * Knowledge Store から記録・設定を取得し、analyze → generateSuggestions を実行する。
 */
export function getSuggestionsForAgenda(agendaItems: AgendaItem[]): Suggestion[] {
  const store = useMeetingKnowledgeStore.getState();

  if (!store.settings.enabled) return [];
  if (store.records.length < MIN_SAMPLE_COUNT) return [];

  const patterns = updateLearnedPatterns(store.records, store.settings);
  const insights = analyze(store.records, store.settings);
  const suggestions = generateSuggestions(insights, agendaItems, patterns);

  // 学習パターンをストアに反映
  if (patterns.length > 0) {
    useMeetingKnowledgeStore.setState({ learnedPatterns: patterns });
  }

  logger.info(
    'MAPE-K 提案生成完了',
    { agendaCount: agendaItems.length, suggestionCount: suggestions.length },
    'mape-k',
  );

  return suggestions;
}

// ─── ヘルパー ────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}分${s}秒` : `${m}分`;
}
