import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { bellSoundManager } from '@/utils/bellSoundManager';
import { useAgendaTimerStore } from '../new-agenda-timer-store';

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

const setupMeetingWithAgendas = () => {
  const store = useAgendaTimerStore.getState();
  store.createMeeting('定例MTG');

  const meeting = useAgendaTimerStore.getState().currentMeeting;
  if (!meeting) {
    throw new Error('meeting was not created');
  }

  store.addAgenda(meeting.id, '議題1', 10);
  store.addAgenda(meeting.id, '議題2', 5);

  return useAgendaTimerStore.getState().currentMeeting!;
};

describe('useAgendaTimerStore', () => {
  beforeEach(() => {
    resetAgendaTimerStore();
    vi.clearAllMocks();
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      location: { href: 'http://localhost/' },
    });
    vi.stubGlobal('navigator', { userAgent: 'vitest' });
    vi.stubGlobal('Notification', {
      permission: 'granted',
      requestPermission: vi.fn(),
    });
  });

  it('nextAgenda で現在議題を完了にして次の議題へ遷移する', () => {
    const meeting = setupMeetingWithAgendas();
    const store = useAgendaTimerStore.getState();

    const firstAgenda = meeting.agenda.find((agenda) => agenda.title === '議題1');
    const secondAgenda = meeting.agenda.find((agenda) => agenda.title === '議題2');

    expect(firstAgenda).toBeDefined();
    expect(secondAgenda).toBeDefined();

    store.getCurrentAgenda();
    store.nextAgenda();

    const updatedMeeting = useAgendaTimerStore.getState().currentMeeting;
    const updatedFirst = updatedMeeting?.agenda.find((agenda) => agenda.id === firstAgenda!.id);

    expect(updatedMeeting?.currentAgendaId).toBeDefined();
    expect([firstAgenda!.id, secondAgenda!.id]).toContain(updatedMeeting?.currentAgendaId);
    expect(updatedFirst?.status).toBe('completed');
    expect(useAgendaTimerStore.getState().currentTime).toBe(0);
  });

  it('tick で経過時間を進め、残り時間を更新する', () => {
    const meeting = setupMeetingWithAgendas();
    const store = useAgendaTimerStore.getState();

    const currentAgenda = store.getCurrentAgenda();
    expect(currentAgenda).toBeDefined();

    useAgendaTimerStore.setState({
      currentMeeting: meeting,
      isRunning: true,
      currentTime: 0,
      lastTickTime: Date.now() - 1000,
    });

    store.tick();

    const updatedState = useAgendaTimerStore.getState();
    const updatedAgenda = updatedState.currentMeeting?.agenda.find(
      (agenda) => agenda.id === currentAgenda!.id,
    );

    expect(updatedState.currentTime).toBeGreaterThanOrEqual(1);
    expect(updatedAgenda?.remainingTime).toBeLessThan(currentAgenda!.plannedDuration);
    expect(updatedAgenda?.status).toBe('running');
  });

  it('startTimer は bellSoundManager のモックを呼び出す', () => {
    const meeting = setupMeetingWithAgendas();

    useAgendaTimerStore.setState({
      currentMeeting: meeting,
    });

    const store = useAgendaTimerStore.getState();
    store.getCurrentAgenda();
    store.startTimer();

    expect(bellSoundManager.notifyWithBell).toHaveBeenCalledTimes(1);
  });
});
