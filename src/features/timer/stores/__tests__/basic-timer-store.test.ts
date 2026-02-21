import { describe, expect, beforeEach, it } from 'vitest';
import { useBasicTimerStore } from '../basic-timer-store';

const resetBasicTimerStore = () => {
  useBasicTimerStore.setState({
    duration: 25 * 60,
    remainingTime: 25 * 60,
    isRunning: false,
    isPaused: false,
    sessionId: null,
    sessionStartTime: null,
    sessionLabel: '',
    history: [],
    showHistory: false,
    showSettings: false,
  });
};

describe('useBasicTimerStore', () => {
  beforeEach(() => {
    resetBasicTimerStore();
  });

  it('initialises with default duration and remaining time', () => {
    const state = useBasicTimerStore.getState();
    expect(state.duration).toBe(25 * 60);
    expect(state.remainingTime).toBe(25 * 60);
    expect(state.isRunning).toBe(false);
  });

  it('counts down and records history on completion', () => {
    const store = useBasicTimerStore.getState();
    store.setDuration(3);
    useBasicTimerStore.setState({ remainingTime: 3 });

    store.start();
    store.tick();
    store.tick();
    store.tick();

    const updated = useBasicTimerStore.getState();
    expect(updated.isRunning).toBe(false);
    expect(updated.history.length).toBe(1);
    expect(updated.history[0].completed).toBe(true);
  });

  it('supports pausing and resetting the timer', () => {
    const store = useBasicTimerStore.getState();
    store.start();
    store.tick();
    store.pause();
    expect(useBasicTimerStore.getState().isPaused).toBe(true);

    store.reset();
    const state = useBasicTimerStore.getState();
    expect(state.isRunning).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.remainingTime).toBe(state.duration);
  });

  // TC-BS-04
  it('setDuration: 停止中は duration と remainingTime の両方が更新される', () => {
    useBasicTimerStore.setState({ isRunning: false, duration: 25 * 60, remainingTime: 25 * 60 });
    useBasicTimerStore.getState().setDuration(10 * 60);
    const state = useBasicTimerStore.getState();
    expect(state.duration).toBe(10 * 60);
    expect(state.remainingTime).toBe(10 * 60);
  });

  // TC-BS-07
  it('setDuration: 実行中は duration のみ更新され remainingTime は変わらない', () => {
    const remainingBefore = 20 * 60;
    useBasicTimerStore.setState({ isRunning: true, duration: 25 * 60, remainingTime: remainingBefore });
    useBasicTimerStore.getState().setDuration(30 * 60);
    const state = useBasicTimerStore.getState();
    expect(state.duration).toBe(30 * 60);
    expect(state.remainingTime).toBe(remainingBefore);
  });

  // TC-BS-05
  it('setSessionLabel でセッションラベルを設定できる', () => {
    useBasicTimerStore.getState().setSessionLabel('重要作業');
    expect(useBasicTimerStore.getState().sessionLabel).toBe('重要作業');
  });

  // TC-BS-06
  it('toggleHistory で showHistory を切り替えられる', () => {
    useBasicTimerStore.setState({ showHistory: false });
    useBasicTimerStore.getState().toggleHistory();
    expect(useBasicTimerStore.getState().showHistory).toBe(true);
    useBasicTimerStore.getState().toggleHistory();
    expect(useBasicTimerStore.getState().showHistory).toBe(false);
  });

  it('toggleSettings で showSettings を切り替えられる', () => {
    useBasicTimerStore.setState({ showSettings: false });
    useBasicTimerStore.getState().toggleSettings();
    expect(useBasicTimerStore.getState().showSettings).toBe(true);
  });

  // TC-BS-08
  it('isRunning=false のとき tick は何もしない', () => {
    useBasicTimerStore.setState({ isRunning: false, remainingTime: 100 });
    useBasicTimerStore.getState().tick();
    expect(useBasicTimerStore.getState().remainingTime).toBe(100);
  });

  it('stop は実行中セッションを未完了として履歴に追加する', () => {
    const startTime = new Date(Date.now() - 5000);
    useBasicTimerStore.setState({
      isRunning: true,
      sessionStartTime: startTime,
      sessionLabel: '中断テスト',
      duration: 25 * 60,
      remainingTime: 20 * 60,
    });
    useBasicTimerStore.getState().stop();
    const { history } = useBasicTimerStore.getState();
    expect(history).toHaveLength(1);
    expect(history[0].completed).toBe(false);
    expect(history[0].label).toBe('中断テスト');
  });

  it('stop は sessionStartTime がない場合は履歴に追加しない', () => {
    useBasicTimerStore.getState().stop();
    expect(useBasicTimerStore.getState().history).toHaveLength(0);
  });

  it('clearHistory で履歴を空にできる', () => {
    useBasicTimerStore.setState({
      history: [
        { id: 'h1', duration: 1500, actualDuration: 1500, startTime: new Date(), endTime: new Date(), completed: true },
      ],
    });
    useBasicTimerStore.getState().clearHistory();
    expect(useBasicTimerStore.getState().history).toHaveLength(0);
  });

  it('deleteHistoryEntry で指定 ID の履歴エントリを削除できる', () => {
    useBasicTimerStore.setState({
      history: [
        { id: 'h1', duration: 1500, actualDuration: 1500, startTime: new Date(), endTime: new Date(), completed: true },
        { id: 'h2', duration: 600, actualDuration: 600, startTime: new Date(), endTime: new Date(), completed: false },
      ],
    });
    useBasicTimerStore.getState().deleteHistoryEntry('h1');
    const { history } = useBasicTimerStore.getState();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('h2');
  });
});

