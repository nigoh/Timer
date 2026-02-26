import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMultiTimerStore } from '../multi-timer-store';

const TASK_ID = 'test-task-1';

const resetMultiTimerStore = () => {
  useMultiTimerStore.setState({ instances: {} });
  useMultiTimerStore.getState().getOrCreateInstance(TASK_ID);
};

const inst = () => useMultiTimerStore.getState().instances[TASK_ID];

const setInst = (partial: Record<string, unknown>) => {
  useMultiTimerStore.setState((s) => ({
    instances: {
      ...s.instances,
      [TASK_ID]: { ...s.instances[TASK_ID], ...partial },
    },
  }));
};

beforeAll(() => {
  class MockAudio {
    play = vi.fn(() => Promise.resolve());
  }

  vi.stubGlobal('Audio', MockAudio);
});

describe('useMultiTimerStore', () => {
  beforeEach(() => {
    resetMultiTimerStore();
  });

  // REQ-5.5
  it('タイマー追加/複製/削除ができる', () => {
    const store = useMultiTimerStore.getState();

    store.addTimer(TASK_ID, {
      name: '作業A',
      duration: 10,
      category: '仕事',
      color: '#ff0000',
    });

    const first = inst().timers[0];
    expect(first.name).toBe('作業A');
    expect(first.remainingTime).toBe(10);

    store.duplicateTimer(TASK_ID, first.id);
    const duplicatedTimers = inst().timers;
    expect(duplicatedTimers).toHaveLength(2);
    expect(duplicatedTimers[1].name).toBe('作業A (コピー)');

    store.deleteTimer(TASK_ID, first.id);
    expect(inst().timers).toHaveLength(1);
  });

  // REQ-5.5
  it('個別 start/pause/stop/reset が動作する', () => {
    const store = useMultiTimerStore.getState();
    store.addTimer(TASK_ID, {
      name: '作業B',
      duration: 5,
      category: '勉強',
      color: '#00ff00',
    });

    const timerId = inst().timers[0].id;

    store.startTimer(TASK_ID, timerId);
    let timer = inst().timers[0];
    expect(timer.isRunning).toBe(true);

    store.pauseTimer(TASK_ID, timerId);
    timer = inst().timers[0];
    expect(timer.isRunning).toBe(false);
    expect(timer.isPaused).toBe(true);

    store.stopTimer(TASK_ID, timerId);
    timer = inst().timers[0];
    expect(timer.remainingTime).toBe(timer.duration);
    expect(timer.isCompleted).toBe(false);

    setInst({
      timers: inst().timers.map((item) =>
        item.id === timerId ? { ...item, remainingTime: 1, isRunning: true } : item,
      ),
      isAnyRunning: true,
    });
    store.resetTimer(TASK_ID, timerId);
    timer = inst().timers[0];
    expect(timer.remainingTime).toBe(timer.duration);
    expect(timer.isRunning).toBe(false);
    expect(timer.isPaused).toBe(false);
  });

  // REQ-5.5
  it('全体操作 startAll/pauseAll/stopAll が動作する', () => {
    const store = useMultiTimerStore.getState();

    store.addTimer(TASK_ID, { name: '全体1', duration: 3, category: '仕事', color: '#111111' });
    store.addTimer(TASK_ID, { name: '全体2', duration: 4, category: '運動', color: '#222222' });

    store.startAllTimers(TASK_ID);
    expect(inst().isAnyRunning).toBe(true);
    expect(inst().timers.every((t) => t.isRunning)).toBe(true);

    store.pauseAllTimers(TASK_ID);
    expect(inst().isAnyRunning).toBe(false);
    expect(inst().timers.every((t) => t.isPaused)).toBe(true);

    store.stopAllTimers(TASK_ID);
    const timers = inst().timers;
    expect(timers.every((t) => !t.isRunning && !t.isPaused && !t.isCompleted)).toBe(true);
    expect(timers.every((t) => t.remainingTime === t.duration)).toBe(true);
  });

  // REQ-5.5
  it('tick完了時にisCompletedへ状態遷移する', () => {
    const store = useMultiTimerStore.getState();

    store.addTimer(TASK_ID, { name: '完了確認', duration: 1, category: 'その他', color: '#333333' });
    const timerId = inst().timers[0].id;

    store.startTimer(TASK_ID, timerId);
    store.tick(TASK_ID);

    const timer = inst().timers[0];
    expect(timer.remainingTime).toBe(0);
    expect(timer.isCompleted).toBe(true);
    expect(timer.isRunning).toBe(false);
    expect(inst().isAnyRunning).toBe(false);
  });

  // REQ-5.5
  it('完了済みタイマーに対するstartは拒否される', () => {
    const store = useMultiTimerStore.getState();

    store.addTimer(TASK_ID, { name: '再開不可', duration: 2, category: 'その他', color: '#444444' });
    const timerId = inst().timers[0].id;

    setInst({
      timers: inst().timers.map((item) =>
        item.id === timerId
          ? {
              ...item,
              isCompleted: true,
              isRunning: false,
              isPaused: false,
              remainingTime: 0,
            }
          : item,
      ),
      isAnyRunning: false,
    });

    store.startTimer(TASK_ID, timerId);

    const timer = inst().timers[0];
    expect(timer.isCompleted).toBe(true);
    expect(timer.isRunning).toBe(false);
    expect(timer.remainingTime).toBe(0);
    expect(inst().isAnyRunning).toBe(false);
  });
});
