import { describe, expect, it } from "vitest";
import {
  buildPostPreviewMarkdown,
  PostTemplateInput,
} from "../meeting-report-post-template";

const baseInput: PostTemplateInput = {
  meetingTitle: "定例会議",
  summary: "進捗確認",
  decisions: "A案採用",
  nextActions: "来週レビュー",
  markdown: "# 詳細\n\n本文",
  todos: [{ id: "1", text: "資料更新", done: false }],
};

describe("buildPostPreviewMarkdown", () => {
  it("summary テンプレートを生成できる", () => {
    const markdown = buildPostPreviewMarkdown("summary", baseInput);
    expect(markdown).toContain("## 定例会議 要約");
    expect(markdown).toContain("### ToDo");
    expect(markdown).toContain("- 資料更新");
  });

  it("detailed + diffOnly で差分行のみ返す", () => {
    const markdown = buildPostPreviewMarkdown("detailed", baseInput, {
      diffOnly: true,
      previousMarkdown: "# 詳細",
    });
    expect(markdown).toContain("本文");
    expect(markdown).not.toContain("# 詳細");
  });
});
