import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePomodoroStore } from '../pomodoro-store';

const TASK_ID = 'test-task-1';

const resetPomodoroStore = () => {
  usePomodoroStore.setState({ instances: {} });
  usePomodoroStore.getState().getOrCreateInstance(TASK_ID);
};

const inst = () => usePomodoroStore.getState().instances[TASK_ID];

const setInst = (partial: Record<string, unknown>) => {
  usePomodoroStore.setState((s) => ({
    instances: {
      ...s.instances,
      [TASK_ID]: { ...s.instances[TASK_ID], ...partial },
    },
  }));
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
    store.start(TASK_ID);
    expect(inst().isRunning).toBe(true);

    store.pause(TASK_ID);
    const i = inst();
    expect(i.isRunning).toBe(false);
    expect(i.isPaused).toBe(true);
  });

  it('transitions to break phase when work session completes', () => {
    const store = usePomodoroStore.getState();
    store.updateSettings(TASK_ID, {
      workDuration: 1,
      shortBreakDuration: 1,
      longBreakDuration: 1,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartWork: false,
    });

    setInst({ timeRemaining: 1 });
    store.start(TASK_ID);
    store.tick(TASK_ID);

    const i = inst();
    expect(i.currentPhase).toBe('short-break');
    expect(i.timeRemaining).toBe(i.settings.shortBreakDuration * 60);
    expect(i.isRunning).toBe(false);
  });

  it('does not complete session twice before auto-start timeout fires', () => {
    vi.useFakeTimers();

    try {
      const store = usePomodoroStore.getState();
      store.updateSettings(TASK_ID, {
        workDuration: 1,
        shortBreakDuration: 1,
        longBreakDuration: 1,
        longBreakInterval: 4,
        autoStartBreaks: true,
        autoStartWork: false,
      });

      setInst({ timeRemaining: 1 });
      store.start(TASK_ID);
      store.tick(TASK_ID);
      store.tick(TASK_ID);

      const beforeTimeout = inst();
      expect(beforeTimeout.sessions).toHaveLength(1);
      expect(beforeTimeout.currentPhase).toBe('work');
      expect(beforeTimeout.isRunning).toBe(false);

      vi.advanceTimersByTime(1000);

      const afterTimeout = inst();
      expect(afterTimeout.currentPhase).toBe('short-break');
      expect(afterTimeout.isRunning).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resets the cycle and task name', () => {
    const store = usePomodoroStore.getState();
    store.setTaskName(TASK_ID, 'Deep Work');
    store.start(TASK_ID);
    store.reset(TASK_ID);

    const i = inst();
    expect(i.taskName).toBe('');
    expect(i.currentPhase).toBe('work');
    expect(i.cycle).toBe(1);
    expect(i.isRunning).toBe(false);
  });

  // TC-PO-05
  it('cycle が longBreakInterval に達した work 完了後は long-break へ遷移する', () => {
    setInst({
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
    usePomodoroStore.getState().tick(TASK_ID);
    expect(inst().currentPhase).toBe('long-break');
  });

  // TC-PO-06
  it('autoStartWork=true のとき休憩完了後に work が自動開始される', () => {
    vi.useFakeTimers();
    try {
      setInst({
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

      usePomodoroStore.getState().tick(TASK_ID);

      const before = inst();
      expect(before.isRunning).toBe(false);
      expect(before.currentPhase).toBe('short-break');

      vi.advanceTimersByTime(1000);

      const after = inst();
      expect(after.currentPhase).toBe('work');
      expect(after.isRunning).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  // TC-PO-07
  it('work 完了時に todayStats.completedPomodoros が増加する', () => {
    setInst({
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
    usePomodoroStore.getState().tick(TASK_ID);
    expect(inst().todayStats.completedPomodoros).toBe(1);
  });

  // TC-PO-08
  it('work 完了時に todayStats.totalFocusTime に workDuration 分が累計される', () => {
    setInst({
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
    usePomodoroStore.getState().tick(TASK_ID);
    expect(inst().todayStats.totalFocusTime).toBe(25);
  });

  // TC-PO-09
  it('work 完了時に sessions に完了セッションが追加される', () => {
    setInst({
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
    usePomodoroStore.getState().tick(TASK_ID);
    const { sessions } = inst();
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
    setInst({ currentPhase: 'work', cycle: 1 });
    usePomodoroStore.getState().skip(TASK_ID);
    expect(inst().currentPhase).toBe('short-break');
  });

  it('skip() で short-break → work へスキップできる', () => {
    setInst({
      currentPhase: 'short-break',
      cycle: 1,
      settings: inst().settings,
    });
    usePomodoroStore.getState().skip(TASK_ID);
    expect(inst().currentPhase).toBe('work');
  });

  // --- 追加テスト ---

  it('skip() で long-break → work へスキップでき cycle が 1 に戻る', () => {
    setInst({
      currentPhase: 'long-break',
      cycle: 4,
      settings: inst().settings,
    });
    usePomodoroStore.getState().skip(TASK_ID);
    const i = inst();
    expect(i.currentPhase).toBe('work');
    expect(i.cycle).toBe(1);
  });

  it('short-break 完了時に todayStats.totalBreakTime が累計される', () => {
    setInst({
      currentPhase: 'short-break',
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
      todayStats: { completedPomodoros: 1, totalFocusTime: 25, totalBreakTime: 0, efficiency: 0 },
    });
    usePomodoroStore.getState().tick(TASK_ID);
    expect(inst().todayStats.totalBreakTime).toBe(5);
  });

  it('removeInstance でインスタンスを削除できる', () => {
    expect(inst()).toBeDefined();
    usePomodoroStore.getState().removeInstance(TASK_ID);
    expect(usePomodoroStore.getState().instances[TASK_ID]).toBeUndefined();
  });

  it('updateSettings で設定を変更できる', () => {
    usePomodoroStore.getState().updateSettings(TASK_ID, {
      workDuration: 50,
      shortBreakDuration: 10,
      longBreakDuration: 30,
      longBreakInterval: 2,
      autoStartBreaks: true,
      autoStartWork: true,
    });
    const { settings } = inst();
    expect(settings.workDuration).toBe(50);
    expect(settings.longBreakInterval).toBe(2);
    expect(settings.autoStartBreaks).toBe(true);
  });

  it('4サイクル完走: work→break×3 → work→long-break', () => {
    const store = usePomodoroStore.getState();
    store.updateSettings(TASK_ID, {
      workDuration: 1,
      shortBreakDuration: 1,
      longBreakDuration: 1,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartWork: false,
    });

    for (let cycle = 1; cycle <= 3; cycle++) {
      setInst({ timeRemaining: 1, isRunning: true, currentPhase: 'work' });
      usePomodoroStore.getState().tick(TASK_ID);
      expect(inst().currentPhase).toBe('short-break');

      setInst({ timeRemaining: 1, isRunning: true, currentPhase: 'short-break' });
      usePomodoroStore.getState().tick(TASK_ID);
      expect(inst().currentPhase).toBe('work');
    }

    // 4th cycle → long-break
    setInst({ timeRemaining: 1, isRunning: true, currentPhase: 'work', cycle: 4 });
    usePomodoroStore.getState().tick(TASK_ID);
    expect(inst().currentPhase).toBe('long-break');
  });
});
