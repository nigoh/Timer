import { describe, expect, it } from "vitest";
import { appendTranscriptToMinutesContent } from "../speech-recognition-utils";

describe("appendTranscriptToMinutesContent", () => {
  it("空の議事録へ音声テキストを段落として追加する", () => {
    expect(appendTranscriptToMinutesContent("", "決定事項を確認しました")).toBe(
      "<p>決定事項を確認しました</p>",
    );
  });

  it("既存議事録の末尾に音声テキストを追記する", () => {
    expect(
      appendTranscriptToMinutesContent(
        "<p>前回議題</p>",
        "次回の担当者を決定",
      ),
    ).toBe("<p>前回議題</p><p>次回の担当者を決定</p>");
  });

  it("音声テキスト内のHTML文字をエスケープする", () => {
    expect(appendTranscriptToMinutesContent("", "<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
    );
  });
});
