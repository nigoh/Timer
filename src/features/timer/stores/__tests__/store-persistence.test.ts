import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBasicTimerStore } from '../basic-timer-store';
import { usePomodoroStore } from '../pomodoro-store';
import { useMultiTimerStore } from '../multi-timer-store';
import { useAgendaTimerStore } from '../agenda-timer-store';

const TASK_ID = 'persist-test-task';

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

describe('basic-timer-store partialize', () => {
  beforeEach(() => {
    useBasicTimerStore.setState({ instances: {} });
    useBasicTimerStore.getState().getOrCreateInstance(TASK_ID);
  });

  it('永続化対象: history, duration, sessionLabel のみが partialize される', () => {
    // Arrange: 履歴を追加
    useBasicTimerStore.getState().addToHistory(TASK_ID, {
      duration: 1500,
      actualDuration: 1500,
      startTime: new Date(),
      endTime: new Date(),
      completed: true,
      label: 'テスト',
    });
    useBasicTimerStore.getState().setSessionLabel(TASK_ID, 'ラベルテスト');

    // Act: persist options から partialize を取得してテスト
    const state = useBasicTimerStore.getState();
    const persistOptions = useBasicTimerStore.persist;
    const opts = persistOptions.getOptions();
    const partialized = opts.partialize?.(state);

    // Assert: ランタイム状態 (isRunning, lastTickTime 等) は含まれない
    const inst = (partialized as Record<string, Record<string, Record<string, unknown>>>).instances[TASK_ID];
    expect(inst).toBeDefined();
    expect(inst.duration).toBe(25 * 60);
    expect(inst.sessionLabel).toBe('ラベルテスト');
    expect(inst.history).toHaveLength(1);
    expect(inst).not.toHaveProperty('isRunning');
    expect(inst).not.toHaveProperty('lastTickTime');
    expect(inst).not.toHaveProperty('sessionStartTime');
  });
});

describe('pomodoro-store partialize', () => {
  beforeEach(() => {
    usePomodoroStore.setState({ instances: {} });
    usePomodoroStore.getState().getOrCreateInstance(TASK_ID);
  });

  it('永続化対象: settings, todayStats, sessions のみが partialize される', () => {
    // Arrange
    usePomodoroStore.getState().updateSettings(TASK_ID, {
      workDuration: 30,
      shortBreakDuration: 10,
      longBreakDuration: 20,
      longBreakInterval: 3,
      autoStartBreaks: true,
      autoStartWork: false,
    });

    // Act
    const state = usePomodoroStore.getState();
    const opts = usePomodoroStore.persist.getOptions();
    const partialized = opts.partialize?.(state);

    // Assert
    const inst = (partialized as Record<string, Record<string, Record<string, unknown>>>).instances[TASK_ID];
    expect(inst).toBeDefined();
    expect(inst.settings).toBeDefined();
    expect(inst.todayStats).toBeDefined();
    expect(inst.sessions).toBeDefined();
    expect(inst).not.toHaveProperty('isRunning');
    expect(inst).not.toHaveProperty('lastTickTime');
    expect(inst).not.toHaveProperty('timeRemaining');
  });
});

describe('multi-timer-store partialize', () => {
  beforeEach(() => {
    useMultiTimerStore.setState({ instances: {} });
    useMultiTimerStore.getState().getOrCreateInstance(TASK_ID);
  });

  it('永続化対象: timers, categories, globalSettings, sessions のみが partialize される', () => {
    // Arrange
    useMultiTimerStore.getState().addTimer(TASK_ID, {
      name: '永続化テスト',
      duration: 300,
      category: '仕事',
      color: '#ff0000',
    });

    // Act
    const state = useMultiTimerStore.getState();
    const opts = useMultiTimerStore.persist.getOptions();
    const partialized = opts.partialize?.(state);

    // Assert
    const inst = (partialized as Record<string, Record<string, Record<string, unknown>>>).instances[TASK_ID];
    expect(inst).toBeDefined();
    expect(inst.timers).toBeDefined();
    expect(inst.categories).toBeDefined();
    expect(inst.globalSettings).toBeDefined();
    expect(inst.sessions).toBeDefined();
    expect(inst).not.toHaveProperty('isAnyRunning');
  });

  it('partialize 時にタイマーの isRunning は false にリセットされる', () => {
    // Arrange
    useMultiTimerStore.getState().addTimer(TASK_ID, {
      name: 'ランニングテスト',
      duration: 600,
      category: '仕事',
    });
    const timerId = useMultiTimerStore.getState().instances[TASK_ID].timers[0].id;
    useMultiTimerStore.getState().startTimer(TASK_ID, timerId);

    // Act
    const state = useMultiTimerStore.getState();
    const opts = useMultiTimerStore.persist.getOptions();
    const partialized = opts.partialize?.(state);

    // Assert
    const inst = (partialized as Record<string, Record<string, { timers: { isRunning: boolean }[] }>>).instances[TASK_ID];
    const timer = inst.timers[0];
    expect(timer.isRunning).toBe(false);
  });
});

describe('agenda-timer-store partialize', () => {
  beforeEach(() => {
    useAgendaTimerStore.setState({ instances: {} });
    useAgendaTimerStore.getState().getOrCreateInstance(TASK_ID);
  });

  it('永続化対象: meetings, currentMeeting のみが partialize される', () => {
    // Arrange
    useAgendaTimerStore.getState().createMeeting(TASK_ID, '永続化テスト会議');

    // Act
    const state = useAgendaTimerStore.getState();
    const opts = useAgendaTimerStore.persist.getOptions();
    const partialized = opts.partialize?.(state);

    // Assert
    const inst = (partialized as Record<string, Record<string, Record<string, unknown>>>).instances[TASK_ID];
    expect(inst).toBeDefined();
    expect(inst.meetings).toBeDefined();
    expect(inst).not.toHaveProperty('isRunning');
    expect(inst).not.toHaveProperty('currentTime');
    expect(inst).not.toHaveProperty('lastTickTime');
  });
});
