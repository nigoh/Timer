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
});

