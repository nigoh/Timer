import { describe, expect, it } from "vitest";
import { getAgendaMinutesQuillModules } from "../agenda-minutes-quill";

describe("agenda minutes quill config", () => {
  it("モバイル向けの簡易ツールバーを返す", () => {
    const modules = getAgendaMinutesQuillModules(true);

    expect(modules.toolbar).toEqual([
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      ["image", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "clean"],
    ]);
  });

  it("PC向けの詳細ツールバーを返す", () => {
    const modules = getAgendaMinutesQuillModules(false);

    expect(modules.toolbar).toEqual([
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      ["image", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote"],
      ["link"],
      ["clean"],
    ]);
  });
});
