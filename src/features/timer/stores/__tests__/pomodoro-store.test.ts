import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePomodoroStore } from '../pomodoro-store';

const resetPomodoroStore = () => {
  usePomodoroStore.setState({
    currentPhase: 'work',
    timeRemaining: 25 * 60,
    isRunning: false,
    isPaused: false,
    cycle: 1,
    totalCycles: 0,
    taskName: '',
    settings: {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartWork: false,
    },
    todayStats: {
      completedPomodoros: 0,
      totalFocusTime: 0,
      totalBreakTime: 0,
      efficiency: 0,
    },
    sessions: [],
  });
};

beforeAll(() => {
  vi.stubGlobal(
    'Notification',
    {
      permission: 'denied',
      requestPermission: vi.fn().mockResolvedValue('denied'),
    } as unknown as Notification,
  );

  class MockAudio {
    play = vi.fn(() => Promise.resolve());
  }

  vi.stubGlobal('Audio', MockAudio);
});

describe('usePomodoroStore', () => {
  beforeEach(() => {
    resetPomodoroStore();
  });

  it('starts and pauses the timer', () => {
    const store = usePomodoroStore.getState();
    store.start();
    expect(usePomodoroStore.getState().isRunning).toBe(true);

    store.pause();
    const state = usePomodoroStore.getState();
    expect(state.isRunning).toBe(false);
    expect(state.isPaused).toBe(true);
  });

  it('transitions to break phase when work session completes', () => {
    const store = usePomodoroStore.getState();
    store.updateSettings({
      workDuration: 1,
      shortBreakDuration: 1,
      longBreakDuration: 1,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartWork: false,
    });

    usePomodoroStore.setState({ timeRemaining: 1 });
    store.start();
    store.tick(); // completes work phase in one tick

    const state = usePomodoroStore.getState();
    expect(state.currentPhase).toBe('short-break');
    expect(state.timeRemaining).toBe(state.settings.shortBreakDuration * 60);
    expect(state.isRunning).toBe(false);
  });

  it('does not complete session twice before auto-start timeout fires', () => {
    vi.useFakeTimers();

    try {
      const store = usePomodoroStore.getState();
      store.updateSettings({
        workDuration: 1,
        shortBreakDuration: 1,
        longBreakDuration: 1,
        longBreakInterval: 4,
        autoStartBreaks: true,
        autoStartWork: false,
      });

      usePomodoroStore.setState({ timeRemaining: 1 });
      store.start();
      store.tick();
      store.tick();

      const beforeTimeout = usePomodoroStore.getState();
      expect(beforeTimeout.sessions).toHaveLength(1);
      expect(beforeTimeout.currentPhase).toBe('work');
      expect(beforeTimeout.isRunning).toBe(false);

      vi.advanceTimersByTime(1000);

      const afterTimeout = usePomodoroStore.getState();
      expect(afterTimeout.currentPhase).toBe('short-break');
      expect(afterTimeout.isRunning).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resets the cycle and task name', () => {
    const store = usePomodoroStore.getState();
    store.setTaskName('Deep Work');
    store.start();
    store.reset();

    const state = usePomodoroStore.getState();
    expect(state.taskName).toBe('');
    expect(state.currentPhase).toBe('work');
    expect(state.cycle).toBe(1);
    expect(state.isRunning).toBe(false);
  });
});
