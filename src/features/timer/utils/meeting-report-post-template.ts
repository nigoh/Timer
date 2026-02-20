import { MeetingReportTodo } from "@/types/meetingReport";

export type PostTemplateType = "detailed" | "summary";

export interface PostTemplateInput {
  meetingTitle: string;
  summary: string;
  decisions: string;
  nextActions: string;
  todos: MeetingReportTodo[];
  markdown: string;
}

const buildSummaryMarkdown = (input: PostTemplateInput): string => {
  const todoRows = input.todos
    .filter((todo) => todo.text.trim().length > 0)
    .map((todo) => `- ${todo.text}`)
    .join("\n");

  return [
    `## ${input.meetingTitle} 要約`,
    "",
    "### サマリー",
    input.summary || "（未入力）",
    "",
    "### 決定事項",
    input.decisions || "（未入力）",
    "",
    "### 次回アクション",
    input.nextActions || "（未入力）",
    "",
    "### ToDo",
    todoRows || "- なし",
  ].join("\n");
};

const toLineSet = (markdown: string): Set<string> =>
  new Set(markdown.split("\n").map((line) => line.trim()).filter(Boolean));

const applyDiff = (markdown: string, previousMarkdown: string): string => {
  const previousLineSet = toLineSet(previousMarkdown);
  return markdown
    .split("\n")
    .filter((line) => {
      const normalized = line.trim();
      return normalized && !previousLineSet.has(normalized);
    })
    .join("\n");
};

export const buildPostPreviewMarkdown = (
  template: PostTemplateType,
  input: PostTemplateInput,
  options?: { diffOnly?: boolean; previousMarkdown?: string },
): string => {
  const baseMarkdown =
    template === "summary" ? buildSummaryMarkdown(input) : input.markdown;

  if (options?.diffOnly) {
    return applyDiff(baseMarkdown, options.previousMarkdown ?? "");
  }

  return baseMarkdown;
};
