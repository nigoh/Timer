import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Meeting } from "@/types/agenda";
import { MeetingReport, MeetingReportTodo } from "@/types/meetingReport";

interface MeetingReportState {
  reports: MeetingReport[];
  draft: MeetingReport | null;
  isDialogOpen: boolean;
}

interface MeetingReportActions {
  createDraftFromMeeting: (meeting: Meeting) => void;
  updateDraftField: (
    field: "summary" | "decisions" | "nextActions",
    value: string,
  ) => void;
  setDraftParticipantsFromText: (value: string) => void;
  addDraftTodo: () => void;
  updateDraftTodo: (id: string, updates: Partial<MeetingReportTodo>) => void;
  removeDraftTodo: (id: string) => void;
  setDraftTodos: (
    todos: Array<Pick<MeetingReportTodo, "text" | "owner" | "dueDate">>,
  ) => void;
  setDialogOpen: (open: boolean) => void;
  saveDraft: () => void;
  deleteReport: (id: string) => void;
}

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

const toIsoStringSafe = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
};

const formatDuration = (seconds: number) => {
  const absSeconds = Math.abs(seconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const buildReportMarkdown = (report: MeetingReport): string => {
  const agendaRows = report.agendaItems
    .map((item) => {
      const variancePrefix = item.varianceSec >= 0 ? "+" : "-";
      return `| ${item.title} | ${formatDuration(
        item.plannedDurationSec,
      )} | ${formatDuration(item.actualDurationSec)} | ${variancePrefix}${formatDuration(
        Math.abs(item.varianceSec),
      )} |`;
    })
    .join("\n");

  const todoRows = report.todos.length
    ? report.todos
        .map((todo) => {
          const owner = todo.owner ? `（担当: ${todo.owner}）` : "";
          const dueDate = todo.dueDate ? ` [期限: ${todo.dueDate}]` : "";
          return `- [${todo.done ? "x" : " "}] ${todo.text}${owner}${dueDate}`;
        })
        .join("\n")
    : "- なし";

  return [
    `# 会議レポート: ${report.meetingTitle}`,
    `- 開催日時: ${report.heldAt}`,
    `- 作成日時: ${report.createdAt}`,
    `- 参加者: ${report.participants.length > 0 ? report.participants.join(", ") : "未入力"}`,
    "",
    "## サマリー",
    report.summary || "（未入力）",
    "",
    "## アジェンダ実績",
    "| 議題 | 予定 | 実績 | 差分 |",
    "|---|---:|---:|---:|",
    agendaRows || "| なし | 0:00 | 0:00 | 0:00 |",
    "",
    "## 決定事項",
    report.decisions || "（未入力）",
    "",
    "## ToDo",
    todoRows,
    "",
    "## 次回アクション",
    report.nextActions || "（未入力）",
  ].join("\n");
};

export const useMeetingReportStore = create<
  MeetingReportState & MeetingReportActions
>()(
  persist(
    (set, get) => ({
      reports: [],
      draft: null,
      isDialogOpen: false,

      createDraftFromMeeting: (meeting) => {
        const agendaItems = [...meeting.agenda]
          .sort((a, b) => a.order - b.order)
          .map((agenda) => ({
            agendaId: agenda.id,
            title: agenda.title,
            plannedDurationSec: agenda.plannedDuration,
            actualDurationSec: agenda.actualDuration,
            varianceSec: agenda.actualDuration - agenda.plannedDuration,
          }));

        const draft: MeetingReport = {
          id: generateId(),
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          createdAt: new Date().toISOString(),
          heldAt: toIsoStringSafe(meeting.endTime || meeting.startTime),
          participants: [],
          summary: `${meeting.title} の会議レポート`,
          decisions: "",
          nextActions: "",
          agendaItems,
          todos: [],
          markdown: "",
        };

        draft.markdown = buildReportMarkdown(draft);

        set({ draft });
      },

      updateDraftField: (field, value) => {
        set((state) => {
          if (!state.draft) return state;
          const updatedDraft = {
            ...state.draft,
            [field]: value,
          };
          updatedDraft.markdown = buildReportMarkdown(updatedDraft);
          return { draft: updatedDraft };
        });
      },

      setDraftParticipantsFromText: (value) => {
        set((state) => {
          if (!state.draft) return state;
          const participants = value
            .split(/[,\n]/)
            .map((item) => item.trim())
            .filter(Boolean);

          const updatedDraft = {
            ...state.draft,
            participants,
          };
          updatedDraft.markdown = buildReportMarkdown(updatedDraft);
          return { draft: updatedDraft };
        });
      },

      addDraftTodo: () => {
        set((state) => {
          if (!state.draft) return state;

          const updatedDraft = {
            ...state.draft,
            todos: [
              ...state.draft.todos,
              {
                id: generateId(),
                text: "",
                done: false,
              },
            ],
          };
          updatedDraft.markdown = buildReportMarkdown(updatedDraft);
          return { draft: updatedDraft };
        });
      },

      updateDraftTodo: (id, updates) => {
        set((state) => {
          if (!state.draft) return state;
          const updatedDraft = {
            ...state.draft,
            todos: state.draft.todos.map((todo) =>
              todo.id === id ? { ...todo, ...updates } : todo,
            ),
          };
          updatedDraft.markdown = buildReportMarkdown(updatedDraft);
          return { draft: updatedDraft };
        });
      },

      removeDraftTodo: (id) => {
        set((state) => {
          if (!state.draft) return state;
          const updatedDraft = {
            ...state.draft,
            todos: state.draft.todos.filter((todo) => todo.id !== id),
          };
          updatedDraft.markdown = buildReportMarkdown(updatedDraft);
          return { draft: updatedDraft };
        });
      },

      setDraftTodos: (todos) => {
        set((state) => {
          if (!state.draft) return state;
          const updatedDraft = {
            ...state.draft,
            todos: todos.map((todo) => ({
              id: generateId(),
              text: todo.text,
              owner: todo.owner,
              dueDate: todo.dueDate,
              done: false,
            })),
          };
          updatedDraft.markdown = buildReportMarkdown(updatedDraft);
          return { draft: updatedDraft };
        });
      },

      setDialogOpen: (open) => set({ isDialogOpen: open }),

      saveDraft: () => {
        const state = get();
        if (!state.draft) return;

        const cleanedTodos = state.draft.todos.filter((todo) =>
          todo.text.trim(),
        );

        const reportToSave = {
          ...state.draft,
          todos: cleanedTodos,
        };
        reportToSave.markdown = buildReportMarkdown(reportToSave);

        set((prev) => ({
          reports: [reportToSave, ...prev.reports],
          draft: null,
          isDialogOpen: false,
        }));
      },

      deleteReport: (id) => {
        set((state) => ({
          reports: state.reports.filter((report) => report.id !== id),
        }));
      },
    }),
    {
      name: "meeting-report-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        reports: state.reports,
      }),
    },
  ),
);
