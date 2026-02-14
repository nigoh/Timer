import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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

  // REQ-5.4
  it('会議作成とアジェンダ追加/更新/削除ができる', () => {
    const store = useAgendaTimerStore.getState();

    store.createMeeting('定例会議');
    const createdMeeting = useAgendaTimerStore.getState().currentMeeting;
    expect(createdMeeting).not.toBeNull();

    const meetingId = createdMeeting!.id;
    store.addAgenda(meetingId, '進捗確認', 60, '先週分');

    let updatedMeeting = useAgendaTimerStore.getState().currentMeeting;
    expect(updatedMeeting?.agenda).toHaveLength(1);
    expect(updatedMeeting?.totalPlannedDuration).toBe(60);

    const agendaId = updatedMeeting!.agenda[0].id;
    store.updateAgenda(meetingId, agendaId, {
      title: '進捗確認（更新）',
      plannedDuration: 90,
    });

    updatedMeeting = useAgendaTimerStore.getState().currentMeeting;
    expect(updatedMeeting?.agenda[0].title).toBe('進捗確認（更新）');
    expect(updatedMeeting?.totalPlannedDuration).toBe(90);

    store.deleteAgenda(meetingId, agendaId);
    updatedMeeting = useAgendaTimerStore.getState().currentMeeting;
    expect(updatedMeeting?.agenda).toHaveLength(0);
    expect(updatedMeeting?.totalPlannedDuration).toBe(0);
  });

  // REQ-5.4
  it('開始/停止/次アジェンダ遷移が動作する', () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting('顧客MTG');
    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;

    store.addAgenda(meetingId, '導入説明', 30);
    store.addAgenda(meetingId, '質疑応答', 45);

    store.startTimer();
    expect(useAgendaTimerStore.getState().isRunning).toBe(true);

    const currentAgenda = useAgendaTimerStore.getState().getCurrentAgenda();
    expect(currentAgenda?.status).toBe('running');

    store.nextAgenda();
    const nextAgenda = useAgendaTimerStore.getState().getCurrentAgenda();
    expect(nextAgenda?.title).toBe('質疑応答');

    store.stopTimer();
    expect(useAgendaTimerStore.getState().isRunning).toBe(false);
    expect(useAgendaTimerStore.getState().currentTime).toBe(0);
  });

  // REQ-5.4
  it('tickで経過時間が更新され、予定超過時はovertimeになる', () => {
    const nowSpy = vi.spyOn(Date, 'now');

    const store = useAgendaTimerStore.getState();
    store.createMeeting('時間管理テスト');
    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;

    store.addAgenda(meetingId, '短時間アジェンダ', 2);

    nowSpy.mockReturnValue(2_000);
    store.startTimer();

    nowSpy.mockReturnValue(5_000);
    store.tick();

    const agenda = useAgendaTimerStore.getState().getCurrentAgenda();
    expect(useAgendaTimerStore.getState().currentTime).toBe(3);
    expect(agenda?.actualDuration).toBe(3);
    expect(agenda?.remainingTime).toBe(-1);
    expect(agenda?.status).toBe('overtime');

    nowSpy.mockRestore();
  });
});
