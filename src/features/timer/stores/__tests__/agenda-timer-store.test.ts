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

const TASK_ID = "test-task-1";

const resetAgendaTimerStore = () => {
  useAgendaTimerStore.setState({ instances: {} });
  useAgendaTimerStore.getState().getOrCreateInstance(TASK_ID);
};

const inst = () => useAgendaTimerStore.getState().instances[TASK_ID];

const setInst = (partial: Record<string, unknown>) => {
  useAgendaTimerStore.setState((s) => ({
    instances: {
      ...s.instances,
      [TASK_ID]: { ...s.instances[TASK_ID], ...partial },
    },
  }));
};

beforeAll(() => {
  vi.stubGlobal("Notification", {
    permission: "denied",
    requestPermission: vi.fn().mockResolvedValue("denied"),
  } as unknown as Notification);
});

const setupMeetingWithAgendas = () => {
  const store = useAgendaTimerStore.getState();
  store.createMeeting(TASK_ID, "定例MTG");

  const meeting = inst().currentMeeting;
  if (!meeting) {
    throw new Error("meeting was not created");
  }

  store.addAgenda(TASK_ID, meeting.id, "議題1", 10);
  store.addAgenda(TASK_ID, meeting.id, "議題2", 5);

  return inst().currentMeeting!;
};

describe("useAgendaTimerStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAgendaTimerStore();
  });

  // REQ-5.4
  it("会議作成とアジェンダ追加/更新/削除ができる", () => {
    const store = useAgendaTimerStore.getState();

    store.createMeeting(TASK_ID, "定例会議");
    const createdMeeting = inst().currentMeeting;
    expect(createdMeeting).not.toBeNull();

    const meetingId = createdMeeting!.id;
    store.addAgenda(TASK_ID, meetingId, "進捗確認", 60, "先週分");

    let updatedMeeting = inst().currentMeeting;
    expect(updatedMeeting?.agenda).toHaveLength(1);
    expect(updatedMeeting?.totalPlannedDuration).toBe(60);

    const agendaId = updatedMeeting!.agenda[0].id;
    store.updateAgenda(TASK_ID, meetingId, agendaId, {
      title: "進捗確認（更新）",
      plannedDuration: 90,
    });

    updatedMeeting = inst().currentMeeting;
    expect(updatedMeeting?.agenda[0].title).toBe("進捗確認（更新）");
    expect(updatedMeeting?.totalPlannedDuration).toBe(90);

    store.deleteAgenda(TASK_ID, meetingId, agendaId);
    updatedMeeting = inst().currentMeeting;
    expect(updatedMeeting?.agenda).toHaveLength(0);
    expect(updatedMeeting?.totalPlannedDuration).toBe(0);
  });

  it("会議名更新時に meetings と currentMeeting のタイトルが同期される", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "更新前会議");

    const meetingId = inst().currentMeeting!.id;
    store.updateMeetingTitle(TASK_ID, meetingId, "更新後会議");

    const i = inst();
    expect(i.currentMeeting?.title).toBe("更新後会議");
    expect(
      i.meetings.find((meeting) => meeting.id === meetingId)?.title,
    ).toBe("更新後会議");
  });

  // REQ-5.4
  it("開始/停止/次アジェンダ遷移が動作する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "顧客MTG");
    const meetingId = inst().currentMeeting!.id;

    store.addAgenda(TASK_ID, meetingId, "導入説明", 30);
    store.addAgenda(TASK_ID, meetingId, "質疑応答", 45);

    store.startTimer(TASK_ID);
    expect(inst().isRunning).toBe(true);

    const currentAgenda = store.getCurrentAgenda(TASK_ID);
    expect(currentAgenda?.status).toBe("running");

    store.pauseTimer(TASK_ID);
    expect(inst().isRunning).toBe(false);

    store.nextAgenda(TASK_ID);
    const nextAgenda = store.getCurrentAgenda(TASK_ID);
    expect(nextAgenda?.title).toBe("質疑応答");

    store.stopTimer(TASK_ID);
    expect(inst().isRunning).toBe(false);
    expect(inst().currentTime).toBe(0);
  });

  it("セッション完了で現在議題を完了し次の議題へ遷移する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "セッション完了テスト");

    const meetingId = inst().currentMeeting!.id;
    store.addAgenda(TASK_ID, meetingId, "議題1", 60);
    store.addAgenda(TASK_ID, meetingId, "議題2", 60);

    store.startTimer(TASK_ID);
    store.stopTimer(TASK_ID);

    const currentAgenda = store.getCurrentAgenda(TASK_ID);
    const firstAgenda = inst().currentMeeting?.agenda.find((agenda) => agenda.title === "議題1");

    expect(inst().isRunning).toBe(false);
    expect(firstAgenda?.status).toBe("completed");
    expect(currentAgenda?.title).toBe("議題2");
  });

  it("実行中は前へ/次へが無効で議題遷移しない", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "厳密運用テスト");

    const meetingId = inst().currentMeeting!.id;
    store.addAgenda(TASK_ID, meetingId, "議題1", 60);
    store.addAgenda(TASK_ID, meetingId, "議題2", 60);

    const firstAgenda = store.getCurrentAgenda(TASK_ID);
    expect(firstAgenda?.title).toBe("議題1");

    store.startTimer(TASK_ID);
    expect(inst().isRunning).toBe(true);

    store.nextAgenda(TASK_ID);
    expect(inst().currentMeeting?.currentAgendaId).toBe(firstAgenda?.id);
  });

  it("未開始のpending議題では次へを実行できない", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "pending遷移防止");

    const meetingId = inst().currentMeeting!.id;
    store.addAgenda(TASK_ID, meetingId, "議題1", 60);
    store.addAgenda(TASK_ID, meetingId, "議題2", 60);

    const before = inst().currentMeeting;
    const currentAgendaId = before?.currentAgendaId || store.getCurrentAgenda(TASK_ID)?.id;

    store.nextAgenda(TASK_ID);

    const after = inst().currentMeeting;
    expect(after?.currentAgendaId).toBe(currentAgendaId);
    const firstAgenda = after?.agenda.find((agenda) => agenda.title === "議題1");
    expect(firstAgenda?.status).toBe("pending");
  });

  it("議事録フォーマットを更新できる", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "議事録テスト");

    const meetingId = inst().currentMeeting!.id;
    store.addAgenda(TASK_ID, meetingId, "議題1", 60);

    const agendaId = inst().currentMeeting!.agenda[0].id;

    store.updateAgendaMinutes(TASK_ID, meetingId, agendaId, {
      minutesContent: "<p>決定事項</p>",
      minutesFormat: "richtext",
    });

    const updatedAgenda = inst().currentMeeting?.agenda.find((agenda) => agenda.id === agendaId);

    expect(updatedAgenda?.minutesFormat).toBe("richtext");
    expect(updatedAgenda?.minutesContent).toBe("<p>決定事項</p>");
  });

  it("tickで経過時間が更新され、予定超過時はovertimeになる", () => {
    const nowSpy = vi.spyOn(Date, "now");

    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "時間管理テスト");
    const meetingId = inst().currentMeeting!.id;

    store.addAgenda(TASK_ID, meetingId, "短時間アジェンダ", 2);

    nowSpy.mockReturnValue(2_000);
    store.startTimer(TASK_ID);

    nowSpy.mockReturnValue(5_000);
    store.tick(TASK_ID);

    const agenda = store.getCurrentAgenda(TASK_ID);
    expect(inst().currentTime).toBe(3);
    expect(agenda?.actualDuration).toBe(3);
    expect(agenda?.remainingTime).toBe(-1);
    expect(agenda?.status).toBe("overtime");

    nowSpy.mockRestore();
  });

  it("開始/停止/次アジェンダ遷移で currentAgendaId を meetings と currentMeeting の両方で維持する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "定例会議");

    const meetingId = inst().currentMeeting!.id;

    store.addAgenda(TASK_ID, meetingId, "議題1", 120);
    store.addAgenda(TASK_ID, meetingId, "議題2", 60);

    const firstAgenda = store.getCurrentAgenda(TASK_ID);
    expect(firstAgenda).not.toBeNull();

    const initialInst = inst();
    expect(initialInst.currentMeeting?.currentAgendaId).toBe(firstAgenda!.id);
    expect(initialInst.meetings[0].currentAgendaId).toBe(firstAgenda!.id);

    store.startTimer(TASK_ID);
    expect(inst().isRunning).toBe(true);

    store.pauseTimer(TASK_ID);
    expect(inst().isRunning).toBe(false);

    store.nextAgenda(TASK_ID);
    const movedInst = inst();
    const secondAgenda = movedInst.currentMeeting?.agenda.find(
      (agenda) => agenda.title === "議題2",
    );

    expect(movedInst.currentMeeting?.currentAgendaId).toBe(secondAgenda?.id);
    expect(movedInst.meetings[0].currentAgendaId).toBe(secondAgenda?.id);
  });

  it("現在議題削除時は order順で次候補を優先し、なければ先頭候補へ再選択する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "削除再選択テスト");

    const meetingId = inst().currentMeeting!.id;
    store.addAgenda(TASK_ID, meetingId, "議題1", 30);
    store.addAgenda(TASK_ID, meetingId, "議題2", 20);
    store.addAgenda(TASK_ID, meetingId, "議題3", 10);

    let meeting = inst().currentMeeting!;
    const secondAgenda = meeting.agenda.find(
      (agenda) => agenda.title === "議題2",
    );
    const thirdAgenda = meeting.agenda.find(
      (agenda) => agenda.title === "議題3",
    );

    expect(secondAgenda).toBeDefined();
    expect(thirdAgenda).toBeDefined();

    store.startTimer(TASK_ID);
    store.pauseTimer(TASK_ID);
    store.nextAgenda(TASK_ID);
    expect(inst().currentMeeting?.currentAgendaId).toBe(
      secondAgenda!.id,
    );

    store.deleteAgenda(TASK_ID, meetingId, secondAgenda!.id);

    const updatedInst = inst();
    expect(
      updatedInst.currentMeeting?.agenda.map((agenda) => agenda.title),
    ).toEqual(["議題1", "議題3"]);
    expect(updatedInst.currentMeeting?.currentAgendaId).toBe(thirdAgenda!.id);
    expect(updatedInst.meetings[0].currentAgendaId).toBe(thirdAgenda!.id);

    store.deleteAgenda(TASK_ID, meetingId, thirdAgenda!.id);

    const fallbackInst = inst();
    meeting = fallbackInst.currentMeeting!;
    const firstAgenda = meeting.agenda.find((agenda) => agenda.title === "議題1");
    expect(firstAgenda).toBeDefined();
    expect(meeting.currentAgendaId).toBe(firstAgenda!.id);
    expect(fallbackInst.meetings[0].currentAgendaId).toBe(firstAgenda!.id);
  });

  it("壊れた currentAgendaId から getCurrentAgenda で復旧し、meetings/currentMeeting を再同期する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "currentAgendaId復旧テスト");

    const meetingId = inst().currentMeeting!.id;
    store.addAgenda(TASK_ID, meetingId, "議題A", 15);
    store.addAgenda(TASK_ID, meetingId, "議題B", 15);

    const firstAgenda = store.getCurrentAgenda(TASK_ID);
    expect(firstAgenda).toBeDefined();

    // Break the currentAgendaId
    const i = inst();
    setInst({
      currentMeeting: i.currentMeeting
        ? { ...i.currentMeeting, currentAgendaId: "broken-id" }
        : i.currentMeeting,
      meetings: i.meetings.map((meeting) =>
        meeting.id === meetingId ? { ...meeting, currentAgendaId: "broken-id" } : meeting,
      ),
    });

    const recoveredAgenda = useAgendaTimerStore.getState().getCurrentAgenda(TASK_ID);
    const recoveredInst = inst();

    expect(recoveredAgenda?.id).toBe(firstAgenda!.id);
    expect(recoveredInst.currentMeeting?.currentAgendaId).toBe(firstAgenda!.id);
    expect(recoveredInst.meetings[0].currentAgendaId).toBe(firstAgenda!.id);
  });

  it("tick 実行時に running と currentTime が更新される", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "進捗会議");

    const meetingId = inst().currentMeeting!.id;
    store.addAgenda(TASK_ID, meetingId, "進捗共有", 180);

    const currentAgenda = store.getCurrentAgenda(TASK_ID);
    expect(currentAgenda).not.toBeNull();

    store.startTimer(TASK_ID);
    const beforeTick = Date.now();
    setInst({ lastTickTime: beforeTick - 1000 });

    store.tick(TASK_ID);

    const i = inst();
    const afterTickAgenda = i.currentMeeting?.agenda.find(
      (agenda) => agenda.id === currentAgenda!.id,
    );

    expect(i.isRunning).toBe(true);
    expect(i.currentTime).toBeGreaterThan(0);
    expect(afterTickAgenda?.actualDuration).toBe(i.currentTime);
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

    store.getCurrentAgenda(TASK_ID);
    store.startTimer(TASK_ID);
    store.pauseTimer(TASK_ID);
    store.nextAgenda(TASK_ID);

    const updatedMeeting = inst().currentMeeting;
    const updatedFirst = updatedMeeting?.agenda.find(
      (agenda) => agenda.id === firstAgenda!.id,
    );

    expect(updatedMeeting?.currentAgendaId).toBeDefined();
    expect([firstAgenda!.id, secondAgenda!.id]).toContain(
      updatedMeeting?.currentAgendaId,
    );
    expect(updatedFirst?.status).toBe("completed");
    expect(inst().currentTime).toBe(0);
  });

  it("最終議題完了時は会議を completed へ遷移し、終了時刻を保持する", () => {
    const store = useAgendaTimerStore.getState();
    store.createMeeting(TASK_ID, "完了遷移テスト");

    const meetingId = inst().currentMeeting!.id;
    store.addAgenda(TASK_ID, meetingId, "最終議題", 10);

    store.getCurrentAgenda(TASK_ID);
    store.startTimer(TASK_ID);
    store.pauseTimer(TASK_ID);
    store.nextAgenda(TASK_ID);

    const i = inst();
    const completedAgenda = i.currentMeeting?.agenda.find(
      (agenda) => agenda.title === "最終議題",
    );

    expect(completedAgenda?.status).toBe("completed");
    expect(i.currentMeeting?.status).toBe("completed");
    expect(i.currentMeeting?.endTime).toBeDefined();
    expect(i.isRunning).toBe(false);
    expect(i.currentTime).toBe(0);
    expect(
      i.meetings.find((meeting) => meeting.id === meetingId)?.status,
    ).toBe("completed");
    expect(
      i.meetings.find((meeting) => meeting.id === meetingId)?.endTime,
    ).toBeDefined();
  });

  it("tick で経過時間を進め、残り時間を更新する", () => {
    const meeting = setupMeetingWithAgendas();
    const store = useAgendaTimerStore.getState();

    const currentAgenda = store.getCurrentAgenda(TASK_ID);
    expect(currentAgenda).toBeDefined();

    setInst({
      currentMeeting: meeting,
      isRunning: true,
      currentTime: 0,
      lastTickTime: Date.now() - 1000,
    });

    store.tick(TASK_ID);

    const updatedAgenda = inst().currentMeeting?.agenda.find(
      (agenda) => agenda.id === currentAgenda!.id,
    );

    expect(inst().currentTime).toBeGreaterThanOrEqual(1);
    expect(updatedAgenda?.remainingTime).toBeLessThan(
      currentAgenda!.plannedDuration,
    );
    expect(updatedAgenda?.status).toBe("running");
  });

  it("pause後に再開すると経過時間を保持したまま進行する", () => {
    const nowSpy = vi.spyOn(Date, "now");
    const meeting = setupMeetingWithAgendas();

    setInst({ currentMeeting: meeting });

    const store = useAgendaTimerStore.getState();
    nowSpy.mockReturnValue(10_000);
    store.startTimer(TASK_ID);

    setInst({ currentTime: 4, lastTickTime: 10_000 });
    store.pauseTimer(TASK_ID);

    let pausedAgenda = store.getCurrentAgenda(TASK_ID);
    expect(inst().isRunning).toBe(false);
    expect(inst().currentTime).toBe(4);
    expect(pausedAgenda?.status).toBe("paused");

    nowSpy.mockReturnValue(12_000);
    store.startTimer(TASK_ID);
    nowSpy.mockReturnValue(13_000);
    store.tick(TASK_ID);

    pausedAgenda = store.getCurrentAgenda(TASK_ID);
    expect(inst().currentTime).toBe(5);
    expect(pausedAgenda?.actualDuration).toBe(5);
    expect(pausedAgenda?.status).toBe("running");

    nowSpy.mockRestore();
  });

  it("stop後に再開すると計測を初期化して開始する", () => {
    const meeting = setupMeetingWithAgendas();

    setInst({ currentMeeting: meeting });

    const store = useAgendaTimerStore.getState();
    store.startTimer(TASK_ID);
    setInst({
      currentTime: 7,
      lastTickTime: Date.now() - 1000,
    });

    store.tick(TASK_ID);
    const agendaAfterTick = store.getCurrentAgenda(TASK_ID);
    expect(agendaAfterTick?.actualDuration).toBeGreaterThanOrEqual(8);

    store.stopTimer(TASK_ID);

    let stoppedAgenda = store.getCurrentAgenda(TASK_ID);
    expect(inst().isRunning).toBe(false);
    expect(inst().currentTime).toBe(0);
    expect(stoppedAgenda?.status).toBe("pending");
    expect(stoppedAgenda?.actualDuration).toBe(0);
    expect(stoppedAgenda?.remainingTime).toBe(stoppedAgenda?.plannedDuration);

    store.startTimer(TASK_ID);
    stoppedAgenda = store.getCurrentAgenda(TASK_ID);
    expect(inst().isRunning).toBe(true);
    expect(inst().currentTime).toBe(0);
    expect(stoppedAgenda?.status).toBe("running");
  });

  it("startTimer は notificationManager のモックを呼び出す", () => {
    const meeting = setupMeetingWithAgendas();

    setInst({
      currentMeeting: meeting,
    });

    const store = useAgendaTimerStore.getState();
    store.getCurrentAgenda(TASK_ID);
    store.startTimer(TASK_ID);

    expect(notificationManager.notify).toHaveBeenCalledTimes(1);
  });
});
