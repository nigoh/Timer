import { describe, expect, it } from "vitest";
import { validateAiProviderConfig } from "../ai-provider-config";

describe("validateAiProviderConfig", () => {
  it("有効な設定を受け入れる", () => {
    const result = validateAiProviderConfig({
      provider: "openai",
      model: "gpt-4o-mini",
      apiKey: "sk-test",
      temperature: 0.7,
    });

    expect(result.valid).toBe(true);
  });

  it("必須項目不足を検出する", () => {
    const result = validateAiProviderConfig({
      provider: "openai",
      model: "",
      apiKey: "",
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("model");
  });

  it("temperature 範囲外を検出する", () => {
    const result = validateAiProviderConfig({
      provider: "anthropic",
      model: "claude-3-5-sonnet-latest",
      apiKey: "sk-ant-test",
      temperature: 2.5,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("temperature");
  });
});

