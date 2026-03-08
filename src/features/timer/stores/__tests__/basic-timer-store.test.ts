import { describe, expect, beforeEach, it } from 'vitest';
import { useBasicTimerStore } from '../basic-timer-store';

const TASK_ID = 'test-task-1';

const resetBasicTimerStore = () => {
  useBasicTimerStore.setState({ instances: {} });
  useBasicTimerStore.getState().getOrCreateInstance(TASK_ID);
};

const inst = () => useBasicTimerStore.getState().instances[TASK_ID];

describe('useBasicTimerStore', () => {
  beforeEach(() => {
    resetBasicTimerStore();
  });

  it('initialises with default duration and remaining time', () => {
    const i = inst();
    expect(i.duration).toBe(25 * 60);
    expect(i.remainingTime).toBe(25 * 60);
    expect(i.isRunning).toBe(false);
  });

  it('counts down and records history on completion', () => {
    const store = useBasicTimerStore.getState();
    store.setDuration(TASK_ID, 3);
    useBasicTimerStore.setState((s) => ({
      instances: {
        ...s.instances,
        [TASK_ID]: { ...s.instances[TASK_ID], remainingTime: 3 },
      },
    }));

    store.start(TASK_ID);
    store.tick(TASK_ID);
    store.tick(TASK_ID);
    store.tick(TASK_ID);

    const updated = inst();
    expect(updated.isRunning).toBe(false);
    expect(updated.history.length).toBe(1);
    expect(updated.history[0].completed).toBe(true);
  });

  it('supports pausing and resetting the timer', () => {
    const store = useBasicTimerStore.getState();
    store.start(TASK_ID);
    store.tick(TASK_ID);
    store.pause(TASK_ID);
    expect(inst().isPaused).toBe(true);

    store.reset(TASK_ID);
    const i = inst();
    expect(i.isRunning).toBe(false);
    expect(i.isPaused).toBe(false);
    expect(i.remainingTime).toBe(i.duration);
  });

  // TC-BS-04
  it('setDuration: 停止中は duration と remainingTime の両方が更新される', () => {
    useBasicTimerStore.getState().setDuration(TASK_ID, 10 * 60);
    const i = inst();
    expect(i.duration).toBe(10 * 60);
    expect(i.remainingTime).toBe(10 * 60);
  });

  // TC-BS-07
  it('setDuration: 実行中は duration のみ更新され remainingTime は変わらない', () => {
    const remainingBefore = 20 * 60;
    useBasicTimerStore.setState((s) => ({
      instances: {
        ...s.instances,
        [TASK_ID]: { ...s.instances[TASK_ID], isRunning: true, duration: 25 * 60, remainingTime: remainingBefore },
      },
    }));
    useBasicTimerStore.getState().setDuration(TASK_ID, 30 * 60);
    const i = inst();
    expect(i.duration).toBe(30 * 60);
    expect(i.remainingTime).toBe(remainingBefore);
  });

  // TC-BS-05
  it('setSessionLabel でセッションラベルを設定できる', () => {
    useBasicTimerStore.getState().setSessionLabel(TASK_ID, '重要作業');
    expect(inst().sessionLabel).toBe('重要作業');
  });

  // TC-BS-08
  it('isRunning=false のとき tick は何もしない', () => {
    useBasicTimerStore.getState().tick(TASK_ID);
    expect(inst().remainingTime).toBe(25 * 60);
  });

  it('stop は実行中セッションを未完了として履歴に追加する', () => {
    const startTime = new Date(Date.now() - 5000);
    useBasicTimerStore.setState((s) => ({
      instances: {
        ...s.instances,
        [TASK_ID]: {
          ...s.instances[TASK_ID],
          isRunning: true,
          sessionStartTime: startTime,
          sessionLabel: '中断テスト',
          duration: 25 * 60,
          remainingTime: 20 * 60,
        },
      },
    }));
    useBasicTimerStore.getState().stop(TASK_ID);
    const { history } = inst();
    expect(history).toHaveLength(1);
    expect(history[0].completed).toBe(false);
    expect(history[0].label).toBe('中断テスト');
  });

  it('stop は sessionStartTime がない場合は履歴に追加しない', () => {
    useBasicTimerStore.getState().stop(TASK_ID);
    expect(inst().history).toHaveLength(0);
  });

  it('clearHistory で履歴を空にできる', () => {
    useBasicTimerStore.setState((s) => ({
      instances: {
        ...s.instances,
        [TASK_ID]: {
          ...s.instances[TASK_ID],
          history: [
            { id: 'h1', duration: 1500, actualDuration: 1500, startTime: new Date(), endTime: new Date(), completed: true },
          ],
        },
      },
    }));
    useBasicTimerStore.getState().clearHistory(TASK_ID);
    expect(inst().history).toHaveLength(0);
  });

  it('deleteHistoryEntry で指定 ID の履歴エントリを削除できる', () => {
    useBasicTimerStore.setState((s) => ({
      instances: {
        ...s.instances,
        [TASK_ID]: {
          ...s.instances[TASK_ID],
          history: [
            { id: 'h1', duration: 1500, actualDuration: 1500, startTime: new Date(), endTime: new Date(), completed: true },
            { id: 'h2', duration: 600, actualDuration: 600, startTime: new Date(), endTime: new Date(), completed: false },
          ],
        },
      },
    }));
    useBasicTimerStore.getState().deleteHistoryEntry(TASK_ID, 'h1');
    const { history } = inst();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('h2');
  });

  // --- 追加テスト ---

  it('removeInstance でインスタンスを削除できる', () => {
    expect(inst()).toBeDefined();
    useBasicTimerStore.getState().removeInstance(TASK_ID);
    expect(useBasicTimerStore.getState().instances[TASK_ID]).toBeUndefined();
  });

  it('completeSession でセッションを完了として履歴に追加する', () => {
    const startTime = new Date(Date.now() - 10000);
    useBasicTimerStore.setState((s) => ({
      instances: {
        ...s.instances,
        [TASK_ID]: {
          ...s.instances[TASK_ID],
          isRunning: true,
          sessionStartTime: startTime,
          sessionLabel: '完了テスト',
          duration: 25 * 60,
          remainingTime: 0,
        },
      },
    }));
    useBasicTimerStore.getState().completeSession(TASK_ID);
    const { history } = inst();
    expect(history).toHaveLength(1);
    expect(history[0].completed).toBe(true);
  });

  it('start を2回呼んでも状態が壊れない', () => {
    const store = useBasicTimerStore.getState();
    store.start(TASK_ID);
    store.start(TASK_ID);
    expect(inst().isRunning).toBe(true);
  });

  it('pause を2回呼んでも状態が壊れない', () => {
    const store = useBasicTimerStore.getState();
    store.start(TASK_ID);
    store.pause(TASK_ID);
    store.pause(TASK_ID);
    expect(inst().isPaused).toBe(true);
    expect(inst().isRunning).toBe(false);
  });

  it('duration=0 でカウントダウン即完了する', () => {
    const store = useBasicTimerStore.getState();
    store.setDuration(TASK_ID, 0);
    store.start(TASK_ID);
    store.tick(TASK_ID);
    expect(inst().isRunning).toBe(false);
  });
});

