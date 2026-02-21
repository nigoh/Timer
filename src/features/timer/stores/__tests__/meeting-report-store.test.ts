import { beforeEach, describe, expect, it } from 'vitest';
import { useMeetingReportStore } from '../meeting-report-store';
import type { Meeting } from '@/types/agenda';

const resetStore = () => {
  useMeetingReportStore.setState({
    reports: [],
    postedCommentHistory: [],
    draft: null,
    isDialogOpen: false,
  });
};

const makeMeeting = (overrides: Partial<Meeting> = {}): Meeting => ({
  id: 'meeting-1',
  title: '定例会議',
  agenda: [
    {
      id: 'agenda-1',
      title: '進捗確認',
      plannedDuration: 600,
      actualDuration: 720,
      remainingTime: -120,
      status: 'completed',
      order: 0,
      minutesContent: '',
      minutesFormat: 'markdown',
    },
    {
      id: 'agenda-2',
      title: 'レビュー',
      plannedDuration: 300,
      actualDuration: 280,
      remainingTime: 20,
      status: 'completed',
      order: 1,
      minutesContent: '',
      minutesFormat: 'markdown',
    },
  ],
  totalPlannedDuration: 900,
  totalActualDuration: 1000,
  status: 'completed',
  settings: {
    autoTransition: false,
    silentMode: false,
    bellSettings: {
      start: false,
      fiveMinWarning: false,
      end: false,
      overtime: false,
      soundType: 'single',
    },
  },
  ...overrides,
});

describe('useMeetingReportStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  // ── createDraftFromMeeting ─────────────────────────────
  describe('createDraftFromMeeting()', () => {
    it('会議データからドラフトを生成し基本フィールドが設定される', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      const { draft } = useMeetingReportStore.getState();
      expect(draft).not.toBeNull();
      expect(draft!.meetingId).toBe('meeting-1');
      expect(draft!.meetingTitle).toBe('定例会議');
      expect(draft!.id).toBeTruthy();
      expect(draft!.createdAt).toBeTruthy();
    });

    it('サマリーに会議タイトルが含まれる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      expect(useMeetingReportStore.getState().draft!.summary).toContain('定例会議');
    });

    it('アジェンダ項目が order 昇順でマッピングされ varianceSec が計算される', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      const { agendaItems } = useMeetingReportStore.getState().draft!;
      expect(agendaItems).toHaveLength(2);
      expect(agendaItems[0].title).toBe('進捗確認');
      expect(agendaItems[0].plannedDurationSec).toBe(600);
      expect(agendaItems[0].actualDurationSec).toBe(720);
      expect(agendaItems[0].varianceSec).toBe(120); // 720 - 600
      expect(agendaItems[1].varianceSec).toBe(-20); // 280 - 300
    });

    it('markdown が自動生成されタイトルと議題が含まれる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      const { markdown } = useMeetingReportStore.getState().draft!;
      expect(markdown).toContain('定例会議');
      expect(markdown).toContain('進捗確認');
    });

    it('heldAt に meeting.endTime が使われる', () => {
      const endTime = new Date('2026-02-21T15:00:00Z');
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting({ endTime }));
      expect(useMeetingReportStore.getState().draft!.heldAt).toBe(endTime.toISOString());
    });

    it('endTime がない場合 startTime が heldAt に使われる', () => {
      const startTime = new Date('2026-02-21T10:00:00Z');
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting({ startTime }));
      expect(useMeetingReportStore.getState().draft!.heldAt).toBe(startTime.toISOString());
    });

    it('ドラフトの todos / participants が初期値は空', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      const { draft } = useMeetingReportStore.getState();
      expect(draft!.todos).toHaveLength(0);
      expect(draft!.participants).toHaveLength(0);
    });
  });

  // ── updateDraftField ───────────────────────────────────
  describe('updateDraftField()', () => {
    it('summary を更新するとドラフトに反映される', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().updateDraftField('summary', '更新後サマリー');
      expect(useMeetingReportStore.getState().draft!.summary).toBe('更新後サマリー');
    });

    it('decisions と nextActions を更新できる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().updateDraftField('decisions', 'A案採用');
      useMeetingReportStore.getState().updateDraftField('nextActions', '来週レビュー');
      const { draft } = useMeetingReportStore.getState();
      expect(draft!.decisions).toBe('A案採用');
      expect(draft!.nextActions).toBe('来週レビュー');
    });

    it('更新後に markdown が再生成される', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().updateDraftField('summary', '特別サマリー内容');
      expect(useMeetingReportStore.getState().draft!.markdown).toContain('特別サマリー内容');
    });

    it('draft が null のとき何も変わらない', () => {
      useMeetingReportStore.getState().updateDraftField('summary', 'test');
      expect(useMeetingReportStore.getState().draft).toBeNull();
    });
  });

  // ── setDraftParticipantsFromText ───────────────────────
  describe('setDraftParticipantsFromText()', () => {
    it('カンマ区切りで参加者リストを設定できる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().setDraftParticipantsFromText('山田, 佐藤, 田中');
      expect(useMeetingReportStore.getState().draft!.participants).toEqual(['山田', '佐藤', '田中']);
    });

    it('改行区切りでも参加者リストを設定できる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().setDraftParticipantsFromText('山田\n佐藤');
      expect(useMeetingReportStore.getState().draft!.participants).toEqual(['山田', '佐藤']);
    });

    it('空文字はフィルタリングされる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().setDraftParticipantsFromText('山田,,田中');
      const { participants } = useMeetingReportStore.getState().draft!;
      expect(participants).toHaveLength(2);
      expect(participants).not.toContain('');
    });

    it('markdown が再生成される', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().setDraftParticipantsFromText('山田');
      expect(useMeetingReportStore.getState().draft!.markdown).toContain('山田');
    });
  });

  // ── addDraftTodo / updateDraftTodo / removeDraftTodo ───
  describe('addDraftTodo() / updateDraftTodo() / removeDraftTodo()', () => {
    it('addDraftTodo で空の ToDo が追加される', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().addDraftTodo();
      const { todos } = useMeetingReportStore.getState().draft!;
      expect(todos).toHaveLength(1);
      expect(todos[0].text).toBe('');
      expect(todos[0].done).toBe(false);
      expect(todos[0].id).toBeTruthy();
    });

    it('updateDraftTodo で text / owner / dueDate を更新できる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().addDraftTodo();
      const todoId = useMeetingReportStore.getState().draft!.todos[0].id;
      useMeetingReportStore.getState().updateDraftTodo(todoId, {
        text: '資料作成',
        owner: '山田',
        dueDate: '2026-03-01',
      });
      const updated = useMeetingReportStore.getState().draft!.todos[0];
      expect(updated.text).toBe('資料作成');
      expect(updated.owner).toBe('山田');
      expect(updated.dueDate).toBe('2026-03-01');
    });

    it('updateDraftTodo で done を true にできる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().addDraftTodo();
      const todoId = useMeetingReportStore.getState().draft!.todos[0].id;
      useMeetingReportStore.getState().updateDraftTodo(todoId, { done: true });
      expect(useMeetingReportStore.getState().draft!.todos[0].done).toBe(true);
    });

    it('removeDraftTodo で指定 ID の ToDo を削除できる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().addDraftTodo();
      useMeetingReportStore.getState().addDraftTodo();
      const todos = useMeetingReportStore.getState().draft!.todos;
      expect(todos).toHaveLength(2);
      useMeetingReportStore.getState().removeDraftTodo(todos[0].id);
      expect(useMeetingReportStore.getState().draft!.todos).toHaveLength(1);
    });

    it('updateDraftTodo 後に markdown が再生成される', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().addDraftTodo();
      const todoId = useMeetingReportStore.getState().draft!.todos[0].id;
      useMeetingReportStore.getState().updateDraftTodo(todoId, { text: '議事録作成' });
      expect(useMeetingReportStore.getState().draft!.markdown).toContain('議事録作成');
    });
  });

  // ── setDraftTodos ──────────────────────────────────────
  describe('setDraftTodos()', () => {
    it('todos を一括置換できる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().addDraftTodo(); // 既存 todo を上書き
      useMeetingReportStore.getState().setDraftTodos([
        { text: 'タスク1', owner: '鈴木', dueDate: '2026-03-01' },
        { text: 'タスク2' },
      ]);
      const { todos } = useMeetingReportStore.getState().draft!;
      expect(todos).toHaveLength(2);
      expect(todos[0].text).toBe('タスク1');
      expect(todos[0].owner).toBe('鈴木');
      expect(todos[0].done).toBe(false);
      expect(todos[1].text).toBe('タスク2');
    });
  });

  // ── saveDraft ──────────────────────────────────────────
  describe('saveDraft()', () => {
    it('ドラフトを reports に保存し draft が null になる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().saveDraft();
      const state = useMeetingReportStore.getState();
      expect(state.reports).toHaveLength(1);
      expect(state.reports[0].meetingTitle).toBe('定例会議');
      expect(state.draft).toBeNull();
      expect(state.isDialogOpen).toBe(false);
    });

    it('text が空の ToDo はフィルタリングされて保存される', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().addDraftTodo(); // text="" → 除外対象
      useMeetingReportStore.getState().addDraftTodo();
      const secondId = useMeetingReportStore.getState().draft!.todos[1].id;
      useMeetingReportStore.getState().updateDraftTodo(secondId, { text: '有効タスク' });
      useMeetingReportStore.getState().saveDraft();
      expect(useMeetingReportStore.getState().reports[0].todos).toHaveLength(1);
      expect(useMeetingReportStore.getState().reports[0].todos[0].text).toBe('有効タスク');
    });

    it('draft が null のとき何も変わらない', () => {
      useMeetingReportStore.getState().saveDraft();
      expect(useMeetingReportStore.getState().reports).toHaveLength(0);
    });

    it('複数回保存すると新しいレポートが先頭に追加される', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting({ title: '1回目' }));
      useMeetingReportStore.getState().saveDraft();
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting({ title: '2回目' }));
      useMeetingReportStore.getState().saveDraft();
      const { reports } = useMeetingReportStore.getState();
      expect(reports).toHaveLength(2);
      expect(reports[0].meetingTitle).toBe('2回目');
    });

    it('保存されたレポートに markdown が含まれる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().saveDraft();
      expect(useMeetingReportStore.getState().reports[0].markdown).toContain('定例会議');
    });
  });

  // ── deleteReport ───────────────────────────────────────
  describe('deleteReport()', () => {
    it('指定 ID のレポートを削除できる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().saveDraft();
      const reportId = useMeetingReportStore.getState().reports[0].id;
      useMeetingReportStore.getState().deleteReport(reportId);
      expect(useMeetingReportStore.getState().reports).toHaveLength(0);
    });

    it('未知 ID を指定しても throw しない', () => {
      expect(() => useMeetingReportStore.getState().deleteReport('unknown-id')).not.toThrow();
    });

    it('複数レポートのうち指定 ID のみを削除する', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting({ title: 'A' }));
      useMeetingReportStore.getState().saveDraft();
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting({ title: 'B' }));
      useMeetingReportStore.getState().saveDraft();
      const reports = useMeetingReportStore.getState().reports;
      useMeetingReportStore.getState().deleteReport(reports[1].id); // 古い方を削除
      expect(useMeetingReportStore.getState().reports).toHaveLength(1);
      expect(useMeetingReportStore.getState().reports[0].meetingTitle).toBe('B');
    });
  });

  // ── addPostedCommentHistory ────────────────────────────
  describe('addPostedCommentHistory()', () => {
    it('投稿履歴エントリが追加される', () => {
      useMeetingReportStore.getState().addPostedCommentHistory({
        meetingId: 'meeting-1',
        meetingTitle: '定例会議',
        commentUrl: 'https://github.com/owner/repo/issues/1#comment-123',
      });
      const { postedCommentHistory } = useMeetingReportStore.getState();
      expect(postedCommentHistory).toHaveLength(1);
      expect(postedCommentHistory[0].meetingId).toBe('meeting-1');
      expect(postedCommentHistory[0].meetingTitle).toBe('定例会議');
      expect(postedCommentHistory[0].commentUrl).toBe(
        'https://github.com/owner/repo/issues/1#comment-123',
      );
      expect(postedCommentHistory[0].id).toBeTruthy();
      expect(postedCommentHistory[0].postedAt).toBeTruthy();
    });

    it('新しいエントリが先頭に追加される', () => {
      useMeetingReportStore.getState().addPostedCommentHistory({
        meetingId: 'm1',
        meetingTitle: '1回目',
        commentUrl: 'url1',
      });
      useMeetingReportStore.getState().addPostedCommentHistory({
        meetingId: 'm2',
        meetingTitle: '2回目',
        commentUrl: 'url2',
      });
      expect(useMeetingReportStore.getState().postedCommentHistory[0].meetingTitle).toBe('2回目');
    });
  });

  // ── setDialogOpen ──────────────────────────────────────
  describe('setDialogOpen()', () => {
    it('isDialogOpen を true にできる', () => {
      useMeetingReportStore.getState().setDialogOpen(true);
      expect(useMeetingReportStore.getState().isDialogOpen).toBe(true);
    });

    it('isDialogOpen を false に戻せる', () => {
      useMeetingReportStore.setState({ isDialogOpen: true });
      useMeetingReportStore.getState().setDialogOpen(false);
      expect(useMeetingReportStore.getState().isDialogOpen).toBe(false);
    });
  });

  // ── markdown 生成 ──────────────────────────────────────
  describe('markdown 生成', () => {
    it('保存されたレポートの markdown に ToDo 内容が含まれる', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      useMeetingReportStore.getState().addDraftTodo();
      const todoId = useMeetingReportStore.getState().draft!.todos[0].id;
      useMeetingReportStore.getState().updateDraftTodo(todoId, { text: '重要タスク' });
      useMeetingReportStore.getState().saveDraft();
      expect(useMeetingReportStore.getState().reports[0].markdown).toContain('重要タスク');
    });

    it('アジェンダの差分が markdown に表示される', () => {
      useMeetingReportStore.getState().createDraftFromMeeting(makeMeeting());
      const { markdown } = useMeetingReportStore.getState().draft!;
      // varianceSec=120 → "+2:00"
      expect(markdown).toContain('+');
    });
  });
});
