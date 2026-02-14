import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMultiTimerStore } from '../multi-timer-store';

const resetMultiTimerStore = () => {
  useMultiTimerStore.setState({
    timers: [],
    categories: ['仕事', '勉強', '運動', '休憩', 'その他'],
    isAnyRunning: false,
    globalSettings: {
      autoStartNext: false,
      showNotifications: true,
      soundEnabled: true,
    },
    sessions: [],
  });
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

    store.addTimer({
      name: '作業A',
      duration: 10,
      category: '仕事',
      color: '#ff0000',
    });

    const first = useMultiTimerStore.getState().timers[0];
    expect(first.name).toBe('作業A');
    expect(first.remainingTime).toBe(10);

    store.duplicateTimer(first.id);
    const duplicatedTimers = useMultiTimerStore.getState().timers;
    expect(duplicatedTimers).toHaveLength(2);
    expect(duplicatedTimers[1].name).toBe('作業A (コピー)');

    store.deleteTimer(first.id);
    expect(useMultiTimerStore.getState().timers).toHaveLength(1);
  });

  // REQ-5.5
  it('個別 start/pause/stop/reset が動作する', () => {
    const store = useMultiTimerStore.getState();
    store.addTimer({
      name: '作業B',
      duration: 5,
      category: '勉強',
      color: '#00ff00',
    });

    const timerId = useMultiTimerStore.getState().timers[0].id;

    store.startTimer(timerId);
    let timer = useMultiTimerStore.getState().timers[0];
    expect(timer.isRunning).toBe(true);

    store.pauseTimer(timerId);
    timer = useMultiTimerStore.getState().timers[0];
    expect(timer.isRunning).toBe(false);
    expect(timer.isPaused).toBe(true);

    store.stopTimer(timerId);
    timer = useMultiTimerStore.getState().timers[0];
    expect(timer.remainingTime).toBe(timer.duration);
    expect(timer.isCompleted).toBe(false);

    useMultiTimerStore.setState((state) => ({
      timers: state.timers.map((item) =>
        item.id === timerId ? { ...item, remainingTime: 1, isRunning: true } : item,
      ),
      isAnyRunning: true,
    }));
    store.resetTimer(timerId);
    timer = useMultiTimerStore.getState().timers[0];
    expect(timer.remainingTime).toBe(timer.duration);
    expect(timer.isRunning).toBe(false);
    expect(timer.isPaused).toBe(false);
  });

  // REQ-5.5
  it('全体操作 startAll/pauseAll/stopAll が動作する', () => {
    const store = useMultiTimerStore.getState();

    store.addTimer({ name: '全体1', duration: 3, category: '仕事', color: '#111111' });
    store.addTimer({ name: '全体2', duration: 4, category: '運動', color: '#222222' });

    store.startAllTimers();
    expect(useMultiTimerStore.getState().isAnyRunning).toBe(true);
    expect(useMultiTimerStore.getState().timers.every((t) => t.isRunning)).toBe(true);

    store.pauseAllTimers();
    expect(useMultiTimerStore.getState().isAnyRunning).toBe(false);
    expect(useMultiTimerStore.getState().timers.every((t) => t.isPaused)).toBe(true);

    store.stopAllTimers();
    const timers = useMultiTimerStore.getState().timers;
    expect(timers.every((t) => !t.isRunning && !t.isPaused && !t.isCompleted)).toBe(true);
    expect(timers.every((t) => t.remainingTime === t.duration)).toBe(true);
  });

  // REQ-5.5
  it('tick完了時にisCompletedへ状態遷移する', () => {
    const store = useMultiTimerStore.getState();

    store.addTimer({ name: '完了確認', duration: 1, category: 'その他', color: '#333333' });
    const timerId = useMultiTimerStore.getState().timers[0].id;

    store.startTimer(timerId);
    store.tick();

    const timer = useMultiTimerStore.getState().timers[0];
    expect(timer.remainingTime).toBe(0);
    expect(timer.isCompleted).toBe(true);
    expect(timer.isRunning).toBe(false);
    expect(useMultiTimerStore.getState().isAnyRunning).toBe(false);
  });

  // REQ-5.5
  it('完了済みタイマーに対するstartは拒否される', () => {
    const store = useMultiTimerStore.getState();

    store.addTimer({ name: '再開不可', duration: 2, category: 'その他', color: '#444444' });
    const timerId = useMultiTimerStore.getState().timers[0].id;

    useMultiTimerStore.setState((state) => ({
      timers: state.timers.map((item) =>
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
    }));

    store.startTimer(timerId);

    const timer = useMultiTimerStore.getState().timers[0];
    expect(timer.isCompleted).toBe(true);
    expect(timer.isRunning).toBe(false);
    expect(timer.remainingTime).toBe(0);
    expect(useMultiTimerStore.getState().isAnyRunning).toBe(false);
  });
});
