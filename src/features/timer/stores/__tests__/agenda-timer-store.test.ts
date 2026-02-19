import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useAgendaTimerStore } from "../agenda-timer-store";

vi.mock("@/utils/notification-manager", () => ({
  notificationManager: {
    notify: vi.fn(),
    ensureInitialized: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    timerStart: vi.fn(),
  },
}));

import { notificationManager } from "@/utils/notification-manager";

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
  vi.stubGlobal("Notification", {
    permission: "denied",
    requestPermission: vi.fn().mockResolvedValue("denied"),
  } as unknown as Notification);
});
const setupMeetingWithAgendas = () => {
  const store = useAgendaTimerStore.getState();
  store.createMeeting("定例MTG");

  const meeting = useAgendaTimerStore.getState().currentMeeting;
  if (!meeting) {
    throw new Error("meeting was not created");
  }

  store.addAgenda(meeting.id, "議題1", 10);
  store.addAgenda(meeting.id, "議題2", 5);

  return useAgendaTimerStore.getState().currentMeeting!;
};

describe("useAgendaTimerStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAgendaTimerStore();
  });

  // REQ-5.4
  it("会議作成とアジェンダ追加/更新/削除ができる", () => {
    const store = useAgendaTimerStore.getState();

    store.createMeeting("定例会議");
    const createdMeeting = useAgendaTimerStore.getState().currentMeeting;
    expect(createdMeeting).not.toBeNull();

    const meetingId = createdMeeting!.id;
    store.addAgenda(meetingId, "進捗確認", 60, "先週分");

    let updatedMeeting = useAgendaTimerStore.getState().currentMeeting;
    expect(updatedMeeting?.agenda).toHaveLength(1);
    expect(updatedMeeting?.totalPlannedDuration).toBe(60);

    const agendaId = updatedMeeting!.agenda[0].id;
    store.updateAgenda(meetingId, agendaId, {
      title: "進捗確認（更新）",
      plannedDuration: 90,
    });

    updatedMeeting = useAgendaTimerStore.getState().currentMeeting;
    expect(updatedMeeting?.agenda[0].title).toBe("進捗確認（更新）");
    expect(updatedMeeting?.totalPlannedDuration).toBe(90);

    store.deleteAgenda(meetingId, agendaId);
    updatedMeeting = useAgendaTimerStore.getState().currentMeeting;
    expect(updatedMeeting?.agenda).toHaveLength(0);
    expect(updatedMeeting?.totalPlannedDuration).toBe(0);
  });

  it("会議名更新時に meetings と currentMeeting のタイトルが同期される", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting("更新前会議");

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;
    store.updateMeetingTitle(meetingId, "更新後会議");

    const updatedState = useAgendaTimerStore.getState();
    expect(updatedState.currentMeeting?.title).toBe("更新後会議");
    expect(
      updatedState.meetings.find((meeting) => meeting.id === meetingId)?.title,
    ).toBe("更新後会議");
  });

  // REQ-5.4
  it("開始/停止/次アジェンダ遷移が動作する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting("顧客MTG");
    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;

    store.addAgenda(meetingId, "導入説明", 30);
    store.addAgenda(meetingId, "質疑応答", 45);

    store.startTimer();
    expect(useAgendaTimerStore.getState().isRunning).toBe(true);

    const currentAgenda = useAgendaTimerStore.getState().getCurrentAgenda();
    expect(currentAgenda?.status).toBe("running");

    store.pauseTimer();
    expect(useAgendaTimerStore.getState().isRunning).toBe(false);

    store.nextAgenda();
    const nextAgenda = useAgendaTimerStore.getState().getCurrentAgenda();
    expect(nextAgenda?.title).toBe("質疑応答");

    store.stopTimer();
    expect(useAgendaTimerStore.getState().isRunning).toBe(false);
    expect(useAgendaTimerStore.getState().currentTime).toBe(0);
  });

  // REQ-5.4



  it("セッション完了で現在議題を完了し次の議題へ遷移する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting("セッション完了テスト");

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;
    store.addAgenda(meetingId, "議題1", 60);
    store.addAgenda(meetingId, "議題2", 60);

    store.startTimer();
    store.stopTimer();

    const state = useAgendaTimerStore.getState();
    const currentAgenda = state.getCurrentAgenda();
    const firstAgenda = state.currentMeeting?.agenda.find((agenda) => agenda.title === "議題1");

    expect(state.isRunning).toBe(false);
    expect(firstAgenda?.status).toBe("completed");
    expect(currentAgenda?.title).toBe("議題2");
  });
  it("実行中は前へ/次へが無効で議題遷移しない", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting("厳密運用テスト");

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;
    store.addAgenda(meetingId, "議題1", 60);
    store.addAgenda(meetingId, "議題2", 60);

    const firstAgenda = store.getCurrentAgenda();
    expect(firstAgenda?.title).toBe("議題1");

    store.startTimer();
    expect(useAgendaTimerStore.getState().isRunning).toBe(true);

    store.nextAgenda();
    expect(useAgendaTimerStore.getState().currentMeeting?.currentAgendaId).toBe(firstAgenda?.id);

  });

  it("未開始のpending議題では次へを実行できない", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting("pending遷移防止");

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;
    store.addAgenda(meetingId, "議題1", 60);
    store.addAgenda(meetingId, "議題2", 60);

    const before = useAgendaTimerStore.getState().currentMeeting;
    const currentAgendaId = before?.currentAgendaId || store.getCurrentAgenda()?.id;

    store.nextAgenda();

    const after = useAgendaTimerStore.getState().currentMeeting;
    expect(after?.currentAgendaId).toBe(currentAgendaId);
    const firstAgenda = after?.agenda.find((agenda) => agenda.title === "議題1");
    expect(firstAgenda?.status).toBe("pending");
  });


  it("議事録フォーマットを更新できる", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting("議事録テスト");

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;
    store.addAgenda(meetingId, "議題1", 60);

    const agendaId = useAgendaTimerStore.getState().currentMeeting!.agenda[0].id;

    store.updateAgendaMinutes(meetingId, agendaId, {
      minutesContent: "<p>決定事項</p>",
      minutesFormat: "richtext",
    });

    const updatedAgenda = useAgendaTimerStore
      .getState()
      .currentMeeting?.agenda.find((agenda) => agenda.id === agendaId);

    expect(updatedAgenda?.minutesFormat).toBe("richtext");
    expect(updatedAgenda?.minutesContent).toBe("<p>決定事項</p>");
  });

  it("tickで経過時間が更新され、予定超過時はovertimeになる", () => {
    const nowSpy = vi.spyOn(Date, "now");

    const store = useAgendaTimerStore.getState();
    store.createMeeting("時間管理テスト");
    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;

    store.addAgenda(meetingId, "短時間アジェンダ", 2);

    nowSpy.mockReturnValue(2_000);
    store.startTimer();

    nowSpy.mockReturnValue(5_000);
    store.tick();

    const agenda = useAgendaTimerStore.getState().getCurrentAgenda();
    expect(useAgendaTimerStore.getState().currentTime).toBe(3);
    expect(agenda?.actualDuration).toBe(3);
    expect(agenda?.remainingTime).toBe(-1);
    expect(agenda?.status).toBe("overtime");

    nowSpy.mockRestore();
  });

  it("開始/停止/次アジェンダ遷移で currentAgendaId を meetings と currentMeeting の両方で維持する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting("定例会議");

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;

    store.addAgenda(meetingId, "議題1", 120);
    store.addAgenda(meetingId, "議題2", 60);

    const firstAgenda = store.getCurrentAgenda();
    expect(firstAgenda).not.toBeNull();

    const initialState = useAgendaTimerStore.getState();
    expect(initialState.currentMeeting?.currentAgendaId).toBe(firstAgenda!.id);
    expect(initialState.meetings[0].currentAgendaId).toBe(firstAgenda!.id);

    store.startTimer();
    expect(useAgendaTimerStore.getState().isRunning).toBe(true);

    store.pauseTimer();
    const pausedState = useAgendaTimerStore.getState();
    expect(pausedState.isRunning).toBe(false);

    store.nextAgenda();
    const movedState = useAgendaTimerStore.getState();
    const secondAgenda = movedState.currentMeeting?.agenda.find(
      (agenda) => agenda.title === "議題2",
    );

    expect(movedState.currentMeeting?.currentAgendaId).toBe(secondAgenda?.id);
    expect(movedState.meetings[0].currentAgendaId).toBe(secondAgenda?.id);
  });

  it("現在議題削除時は order順で次候補を優先し、なければ先頭候補へ再選択する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting("削除再選択テスト");

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;
    store.addAgenda(meetingId, "議題1", 30);
    store.addAgenda(meetingId, "議題2", 20);
    store.addAgenda(meetingId, "議題3", 10);

    let meeting = useAgendaTimerStore.getState().currentMeeting!;
    const secondAgenda = meeting.agenda.find(
      (agenda) => agenda.title === "議題2",
    );
    const thirdAgenda = meeting.agenda.find(
      (agenda) => agenda.title === "議題3",
    );

    expect(secondAgenda).toBeDefined();
    expect(thirdAgenda).toBeDefined();

    store.startTimer();
    store.pauseTimer();
    store.nextAgenda();
    expect(useAgendaTimerStore.getState().currentMeeting?.currentAgendaId).toBe(
      secondAgenda!.id,
    );

    store.deleteAgenda(meetingId, secondAgenda!.id);

    const updatedState = useAgendaTimerStore.getState();
    expect(
      updatedState.currentMeeting?.agenda.map((agenda) => agenda.title),
    ).toEqual(["議題1", "議題3"]);
    expect(updatedState.currentMeeting?.currentAgendaId).toBe(thirdAgenda!.id);
    expect(updatedState.meetings[0].currentAgendaId).toBe(thirdAgenda!.id);

    store.deleteAgenda(meetingId, thirdAgenda!.id);

    const fallbackState = useAgendaTimerStore.getState();
    meeting = fallbackState.currentMeeting!;
    const firstAgenda = meeting.agenda.find((agenda) => agenda.title === "議題1");
    expect(firstAgenda).toBeDefined();
    expect(meeting.currentAgendaId).toBe(firstAgenda!.id);
    expect(fallbackState.meetings[0].currentAgendaId).toBe(firstAgenda!.id);
  });

  it("壊れた currentAgendaId から getCurrentAgenda で復旧し、meetings/currentMeeting を再同期する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting("currentAgendaId復旧テスト");

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;
    store.addAgenda(meetingId, "議題A", 15);
    store.addAgenda(meetingId, "議題B", 15);

    const firstAgenda = store.getCurrentAgenda();
    expect(firstAgenda).toBeDefined();

    useAgendaTimerStore.setState((state) => ({
      currentMeeting: state.currentMeeting
        ? { ...state.currentMeeting, currentAgendaId: "broken-id" }
        : state.currentMeeting,
      meetings: state.meetings.map((meeting) =>
        meeting.id === meetingId ? { ...meeting, currentAgendaId: "broken-id" } : meeting,
      ),
    }));

    const recoveredAgenda = useAgendaTimerStore.getState().getCurrentAgenda();
    const recoveredState = useAgendaTimerStore.getState();

    expect(recoveredAgenda?.id).toBe(firstAgenda!.id);
    expect(recoveredState.currentMeeting?.currentAgendaId).toBe(firstAgenda!.id);
    expect(recoveredState.meetings[0].currentAgendaId).toBe(firstAgenda!.id);
  });

  it("tick 実行時に running と currentTime が更新される", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting("進捗会議");

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;
    store.addAgenda(meetingId, "進捗共有", 180);

    const currentAgenda = store.getCurrentAgenda();
    expect(currentAgenda).not.toBeNull();

    store.startTimer();
    const beforeTick = Date.now();
    useAgendaTimerStore.setState({ lastTickTime: beforeTick - 1000 });

    store.tick();

    const state = useAgendaTimerStore.getState();
    const afterTickAgenda = state.currentMeeting?.agenda.find(
      (agenda) => agenda.id === currentAgenda!.id,
    );

    expect(state.isRunning).toBe(true);
    expect(state.currentTime).toBeGreaterThan(0);
    expect(afterTickAgenda?.actualDuration).toBe(state.currentTime);
    expect(afterTickAgenda?.status).toBe("running");
  });

  it("nextAgenda で現在議題を完了にして次の議題へ遷移する", () => {
    const meeting = setupMeetingWithAgendas();
    const store = useAgendaTimerStore.getState();

    const firstAgenda = meeting.agenda.find(
      (agenda) => agenda.title === "議題1",
    );
    const secondAgenda = meeting.agenda.find(
      (agenda) => agenda.title === "議題2",
    );

    expect(firstAgenda).toBeDefined();
    expect(secondAgenda).toBeDefined();

    store.getCurrentAgenda();
    store.startTimer();
    store.pauseTimer();
    store.nextAgenda();

    const updatedMeeting = useAgendaTimerStore.getState().currentMeeting;
    const updatedFirst = updatedMeeting?.agenda.find(
      (agenda) => agenda.id === firstAgenda!.id,
    );

    expect(updatedMeeting?.currentAgendaId).toBeDefined();
    expect([firstAgenda!.id, secondAgenda!.id]).toContain(
      updatedMeeting?.currentAgendaId,
    );
    expect(updatedFirst?.status).toBe("completed");
    expect(useAgendaTimerStore.getState().currentTime).toBe(0);
  });

  it("最終議題完了時は会議を completed へ遷移し、終了時刻を保持する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting("完了遷移テスト");

    const meetingId = useAgendaTimerStore.getState().currentMeeting!.id;
    store.addAgenda(meetingId, "最終議題", 10);

    store.getCurrentAgenda();
    store.startTimer();
    store.pauseTimer();
    store.nextAgenda();

    const completedState = useAgendaTimerStore.getState();
    const completedAgenda = completedState.currentMeeting?.agenda.find(
      (agenda) => agenda.title === "最終議題",
    );

    expect(completedAgenda?.status).toBe("completed");
    expect(completedState.currentMeeting?.status).toBe("completed");
    expect(completedState.currentMeeting?.endTime).toBeDefined();
    expect(completedState.isRunning).toBe(false);
    expect(completedState.currentTime).toBe(0);
    expect(
      completedState.meetings.find((meeting) => meeting.id === meetingId)?.status,
    ).toBe("completed");
    expect(
      completedState.meetings.find((meeting) => meeting.id === meetingId)?.endTime,
    ).toBeDefined();
  });

  it("tick で経過時間を進め、残り時間を更新する", () => {
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
    expect(updatedAgenda?.remainingTime).toBeLessThan(
      currentAgenda!.plannedDuration,
    );
    expect(updatedAgenda?.status).toBe("running");
  });


  it("pause後に再開すると経過時間を保持したまま進行する", () => {
    const nowSpy = vi.spyOn(Date, "now");
    const meeting = setupMeetingWithAgendas();

    useAgendaTimerStore.setState({ currentMeeting: meeting });

    const store = useAgendaTimerStore.getState();
    nowSpy.mockReturnValue(10_000);
    store.startTimer();

    useAgendaTimerStore.setState({ currentTime: 4, lastTickTime: 10_000 });
    store.pauseTimer();

    let pausedAgenda = useAgendaTimerStore.getState().getCurrentAgenda();
    expect(useAgendaTimerStore.getState().isRunning).toBe(false);
    expect(useAgendaTimerStore.getState().currentTime).toBe(4);
    expect(pausedAgenda?.status).toBe("paused");

    nowSpy.mockReturnValue(12_000);
    store.startTimer();
    nowSpy.mockReturnValue(13_000);
    store.tick();

    pausedAgenda = useAgendaTimerStore.getState().getCurrentAgenda();
    expect(useAgendaTimerStore.getState().currentTime).toBe(5);
    expect(pausedAgenda?.actualDuration).toBe(5);
    expect(pausedAgenda?.status).toBe("running");

    nowSpy.mockRestore();
  });

  it("stop後に再開すると計測を初期化して開始する", () => {
    const meeting = setupMeetingWithAgendas();

    useAgendaTimerStore.setState({ currentMeeting: meeting });

    const store = useAgendaTimerStore.getState();
    store.startTimer();
    useAgendaTimerStore.setState({
      currentTime: 7,
      lastTickTime: Date.now() - 1000,
    });

    store.tick();
    const agendaAfterTick = useAgendaTimerStore.getState().getCurrentAgenda();
    expect(agendaAfterTick?.actualDuration).toBeGreaterThanOrEqual(8);

    store.stopTimer();

    let stoppedAgenda = useAgendaTimerStore.getState().getCurrentAgenda();
    expect(useAgendaTimerStore.getState().isRunning).toBe(false);
    expect(useAgendaTimerStore.getState().currentTime).toBe(0);
    expect(stoppedAgenda?.status).toBe("pending");
    expect(stoppedAgenda?.actualDuration).toBe(0);
    expect(stoppedAgenda?.remainingTime).toBe(stoppedAgenda?.plannedDuration);

    store.startTimer();
    stoppedAgenda = useAgendaTimerStore.getState().getCurrentAgenda();
    expect(useAgendaTimerStore.getState().isRunning).toBe(true);
    expect(useAgendaTimerStore.getState().currentTime).toBe(0);
    expect(stoppedAgenda?.status).toBe("running");
  });

  it("startTimer は notificationManager のモックを呼び出す", () => {
    const meeting = setupMeetingWithAgendas();

    useAgendaTimerStore.setState({
      currentMeeting: meeting,
    });

    const store = useAgendaTimerStore.getState();
    store.getCurrentAgenda();
    store.startTimer();

    expect(notificationManager.notify).toHaveBeenCalledTimes(1);
  });
});
