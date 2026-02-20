import { AiProviderConfig } from "@/types/aiAssist";

const SUPPORTED_PROVIDERS = ["openai", "anthropic"] as const;

export const validateAiProviderConfig = (
  config: Partial<AiProviderConfig>,
): { valid: boolean; reason?: string } => {
  if (!config.provider || !SUPPORTED_PROVIDERS.includes(config.provider)) {
    return { valid: false, reason: "provider が未設定です" };
  }

  if (!config.model?.trim()) {
    return { valid: false, reason: "model が未設定です" };
  }

  if (!config.apiKey?.trim()) {
    return { valid: false, reason: "apiKey が未設定です" };
  }

  if (
    config.temperature !== undefined &&
    (config.temperature < 0 || config.temperature > 2)
  ) {
    return { valid: false, reason: "temperature は 0〜2 の範囲で指定してください" };
  }

  return { valid: true };
};
