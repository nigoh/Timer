export type AiProviderType = "openai" | "anthropic";

export interface AiProviderConfig {
  provider: AiProviderType;
  model: string;
  apiKey: string;
  temperature?: number;
}

export interface AiAssistRequest {
  meetingTitle: string;
  agendaSummary: string;
  decisions: string;
  nextActions: string;
}

export interface AiAssistResponse {
  summary: string;
  consensusAssist: string;
  facilitationAssist: string;
  agendaAssist: string;
  preparationAssist: string;
}

