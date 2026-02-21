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

  // TC-PO-05
  it('cycle が longBreakInterval に達した work 完了後は long-break へ遷移する', () => {
    usePomodoroStore.setState({
      currentPhase: 'work',
      cycle: 4,
      timeRemaining: 1,
      isRunning: true,
      settings: {
        workDuration: 1,
        shortBreakDuration: 1,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartWork: false,
      },
      sessions: [],
      todayStats: { completedPomodoros: 0, totalFocusTime: 0, totalBreakTime: 0, efficiency: 0 },
    });
    usePomodoroStore.getState().tick();
    expect(usePomodoroStore.getState().currentPhase).toBe('long-break');
  });

  // TC-PO-06
  it('autoStartWork=true のとき休憩完了後に work が自動開始される', () => {
    vi.useFakeTimers();
    try {
      usePomodoroStore.setState({
        currentPhase: 'short-break',
        cycle: 1,
        timeRemaining: 1,
        isRunning: true,
        settings: {
          workDuration: 25,
          shortBreakDuration: 1,
          longBreakDuration: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
          autoStartWork: true,
        },
        sessions: [],
        todayStats: { completedPomodoros: 0, totalFocusTime: 0, totalBreakTime: 0, efficiency: 0 },
      });

      usePomodoroStore.getState().tick();

      // タイムアウト前: まだ short-break で停止中
      const before = usePomodoroStore.getState();
      expect(before.isRunning).toBe(false);
      expect(before.currentPhase).toBe('short-break');

      vi.advanceTimersByTime(1000);

      // タイムアウト後: work フェーズで自動開始
      const after = usePomodoroStore.getState();
      expect(after.currentPhase).toBe('work');
      expect(after.isRunning).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  // TC-PO-07
  it('work 完了時に todayStats.completedPomodoros が増加する', () => {
    usePomodoroStore.setState({
      currentPhase: 'work',
      cycle: 1,
      timeRemaining: 1,
      isRunning: true,
      settings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartWork: false,
      },
      sessions: [],
      todayStats: { completedPomodoros: 0, totalFocusTime: 0, totalBreakTime: 0, efficiency: 0 },
    });
    usePomodoroStore.getState().tick();
    expect(usePomodoroStore.getState().todayStats.completedPomodoros).toBe(1);
  });

  // TC-PO-08
  it('work 完了時に todayStats.totalFocusTime に workDuration 分が累計される', () => {
    usePomodoroStore.setState({
      currentPhase: 'work',
      cycle: 1,
      timeRemaining: 1,
      isRunning: true,
      settings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartWork: false,
      },
      sessions: [],
      todayStats: { completedPomodoros: 0, totalFocusTime: 0, totalBreakTime: 0, efficiency: 0 },
    });
    usePomodoroStore.getState().tick();
    expect(usePomodoroStore.getState().todayStats.totalFocusTime).toBe(25);
  });

  // TC-PO-09
  it('work 完了時に sessions に完了セッションが追加される', () => {
    usePomodoroStore.setState({
      currentPhase: 'work',
      cycle: 1,
      timeRemaining: 1,
      isRunning: true,
      taskName: 'テストタスク',
      settings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartWork: false,
      },
      sessions: [],
      todayStats: { completedPomodoros: 0, totalFocusTime: 0, totalBreakTime: 0, efficiency: 0 },
    });
    usePomodoroStore.getState().tick();
    const { sessions } = usePomodoroStore.getState();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].phase).toBe('work');
    expect(sessions[0].completed).toBe(true);
    expect(sessions[0].taskName).toBe('テストタスク');
    expect(sessions[0].id).toBeTruthy();
    expect(sessions[0].startTime).toBeInstanceOf(Date);
    expect(sessions[0].endTime).toBeInstanceOf(Date);
  });

  // TC-PO-10
  it('skip() で work → short-break へスキップできる', () => {
    usePomodoroStore.setState({ currentPhase: 'work', cycle: 1 });
    usePomodoroStore.getState().skip();
    expect(usePomodoroStore.getState().currentPhase).toBe('short-break');
  });

  it('skip() で short-break → work へスキップできる', () => {
    usePomodoroStore.setState({
      currentPhase: 'short-break',
      cycle: 1,
      settings: usePomodoroStore.getState().settings,
    });
    usePomodoroStore.getState().skip();
    expect(usePomodoroStore.getState().currentPhase).toBe('work');
  });
});
