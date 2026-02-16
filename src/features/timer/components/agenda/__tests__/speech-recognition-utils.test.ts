import { afterEach, describe, expect, it } from "vitest";
import {
  appendTranscriptToMinutesContent,
  buildAiMinutesPrompt,
  createSpeechRecognitionInstance,
} from "../speech-recognition-utils";

afterEach(() => {
  (
    window as Window & {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    }
  ).SpeechRecognition = undefined;
  (
    window as Window & {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    }
  ).webkitSpeechRecognition = undefined;
});

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

describe("createSpeechRecognitionInstance", () => {
  it("SpeechRecognition が存在しない場合は null を返す", () => {
    (
      window as Window & {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: unknown;
      }
    ).SpeechRecognition = undefined;
    (
      window as Window & {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: unknown;
      }
    ).webkitSpeechRecognition = undefined;

    expect(createSpeechRecognitionInstance()).toBeNull();
  });

  it("SpeechRecognition があればインスタンスを生成する", () => {
    class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onstart = null;
      onend = null;
      onerror = null;
      onresult = null;
      start() {}
      stop() {}
    }
    (
      window as Window & {
        SpeechRecognition?: typeof MockSpeechRecognition;
        webkitSpeechRecognition?: unknown;
      }
    ).SpeechRecognition = MockSpeechRecognition;
    (
      window as Window & {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: unknown;
      }
    ).webkitSpeechRecognition = undefined;

    expect(createSpeechRecognitionInstance()).toBeInstanceOf(
      MockSpeechRecognition,
    );
  });

  it("SpeechRecognition が無くても webkitSpeechRecognition があれば利用する", () => {
    class MockWebkitSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onstart = null;
      onend = null;
      onerror = null;
      onresult = null;
      start() {}
      stop() {}
    }
    (
      window as Window & {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: typeof MockWebkitSpeechRecognition;
      }
    ).SpeechRecognition = undefined;
    (
      window as Window & {
        SpeechRecognition?: unknown;
        webkitSpeechRecognition?: typeof MockWebkitSpeechRecognition;
      }
    ).webkitSpeechRecognition = MockWebkitSpeechRecognition;

    expect(createSpeechRecognitionInstance()).toBeInstanceOf(
      MockWebkitSpeechRecognition,
    );
  });
});

describe("buildAiMinutesPrompt", () => {
  it("会議情報とメモ本文をAI向けプロンプトへ整形する", () => {
    const prompt = buildAiMinutesPrompt({
      meetingTitle: "定例会議",
      agendaTitle: "進捗共有",
      minutesContent: "<p>A案件を継続</p><p>B案件は完了</p>",
    });

    expect(prompt).toContain("会議名: 定例会議");
    expect(prompt).toContain("議題: 進捗共有");
    expect(prompt).toContain("A案件を継続");
    expect(prompt).toContain("B案件は完了");
    expect(prompt).not.toContain("<p>");
  });

  it("議事録が空の場合はプレースホルダー文言を含む", () => {
    const prompt = buildAiMinutesPrompt({
      meetingTitle: "定例会議",
      agendaTitle: "進捗共有",
      minutesContent: "",
    });

    expect(prompt).toContain("（音声認識テキストなし）");
  });

  it("会議名と議題が空でも既定値を入れてプロンプト生成する", () => {
    const prompt = buildAiMinutesPrompt({
      meetingTitle: " ",
      agendaTitle: "",
      minutesContent: "議論あり",
    });

    expect(prompt).toContain("会議名: 未設定の会議");
    expect(prompt).toContain("議題: 未設定の議題");
  });
});
