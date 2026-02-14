import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAgendaTimerStore } from '../new-agenda-timer-store';

vi.mock('@/utils/bellSoundManager', () => ({
  bellSoundManager: {
    notifyWithBell: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    timerStart: vi.fn(),
  },
}));

const resetAgendaTimerStore = () => {
  useAgendaTimerStore.setState({
    currentMeeting: null,
    meetings: [],
    isRunning: false,
    currentTime: 0,
    meetingStartTime: undefined,
    lastTickTime: undefined,
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
});

describe('useAgendaTimerStore', () => {
  beforeEach(() => {
    resetAgendaTimerStore();
  });

  it('開始/停止/次アジェンダ遷移で currentAgendaId を meetings と currentMeeting の両方で維持する', () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting('定例会議');

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;

    store.addAgenda(meetingId, '議題1', 120);
    store.addAgenda(meetingId, '議題2', 60);

    const firstAgenda = store.getCurrentAgenda();
    expect(firstAgenda).not.toBeNull();

    const initialState = useAgendaTimerStore.getState();
    expect(initialState.currentMeeting?.currentAgendaId).toBe(firstAgenda!.id);
    expect(initialState.meetings[0].currentAgendaId).toBe(firstAgenda!.id);

    store.startTimer();
    expect(useAgendaTimerStore.getState().isRunning).toBe(true);

    store.stopTimer();
    const stoppedState = useAgendaTimerStore.getState();
    expect(stoppedState.isRunning).toBe(false);
    expect(stoppedState.currentTime).toBe(0);

    store.nextAgenda();
    const movedState = useAgendaTimerStore.getState();
    const secondAgenda = movedState.currentMeeting?.agenda.find((agenda) => agenda.title === '議題2');

    expect(movedState.currentMeeting?.currentAgendaId).toBe(secondAgenda?.id);
    expect(movedState.meetings[0].currentAgendaId).toBe(secondAgenda?.id);
  });

  it('tick 実行時に running と currentTime が更新される', () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting('進捗会議');

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;
    store.addAgenda(meetingId, '進捗共有', 180);

    const currentAgenda = store.getCurrentAgenda();
    expect(currentAgenda).not.toBeNull();

    store.startTimer();
    const beforeTick = Date.now();
    useAgendaTimerStore.setState({ lastTickTime: beforeTick - 1000 });

    store.tick();

    const state = useAgendaTimerStore.getState();
    const afterTickAgenda = state.currentMeeting?.agenda.find((agenda) => agenda.id === currentAgenda!.id);

    expect(state.isRunning).toBe(true);
    expect(state.currentTime).toBeGreaterThan(0);
    expect(afterTickAgenda?.actualDuration).toBe(state.currentTime);
    expect(afterTickAgenda?.status).toBe('running');
  });
});
