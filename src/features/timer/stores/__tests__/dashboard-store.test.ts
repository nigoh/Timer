import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../dashboard-store';

function resetDashboardStore() {
  const since = new Date('2025-01-01T00:00:00Z');
  const until = new Date('2025-01-30T23:59:59Z');
  useDashboardStore.setState({
    filter: { since, until, granularity: 'day' },
  });
}

describe('useDashboardStore', () => {
  beforeEach(() => {
    resetDashboardStore();
  });

  it('initialises with day granularity', () => {
    const { filter } = useDashboardStore.getState();
    expect(filter.granularity).toBe('day');
  });

  it('setGranularity updates granularity', () => {
    useDashboardStore.getState().setGranularity('week');
    expect(useDashboardStore.getState().filter.granularity).toBe('week');
  });

  it('setGranularity to month', () => {
    useDashboardStore.getState().setGranularity('month');
    expect(useDashboardStore.getState().filter.granularity).toBe('month');
  });

  it('setDateRange updates since and until', () => {
    const since = new Date('2025-03-01T00:00:00Z');
    const until = new Date('2025-03-31T23:59:59Z');
    useDashboardStore.getState().setDateRange(since, until);
    const { filter } = useDashboardStore.getState();
    expect(filter.since.getTime()).toBe(since.getTime());
    expect(filter.until.getTime()).toBe(until.getTime());
  });

  it('setTimerKind updates timerKind', () => {
    useDashboardStore.getState().setTimerKind('pomodoro');
    expect(useDashboardStore.getState().filter.timerKind).toBe('pomodoro');
  });

  it('setTimerKind with undefined clears the filter', () => {
    useDashboardStore.getState().setTimerKind('basic');
    useDashboardStore.getState().setTimerKind(undefined);
    expect(useDashboardStore.getState().filter.timerKind).toBeUndefined();
  });

  it('setGranularity preserves existing date range', () => {
    const since = new Date('2025-06-01T00:00:00Z');
    const until = new Date('2025-06-30T23:59:59Z');
    useDashboardStore.getState().setDateRange(since, until);
    useDashboardStore.getState().setGranularity('month');
    const { filter } = useDashboardStore.getState();
    expect(filter.since.getTime()).toBe(since.getTime());
    expect(filter.until.getTime()).toBe(until.getTime());
    expect(filter.granularity).toBe('month');
  });
});
