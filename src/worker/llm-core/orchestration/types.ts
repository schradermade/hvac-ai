import type { CopilotConfig } from '../config/types';
import type { ChatMessage } from '../models/types';

export interface CopilotRequest {
  requestId: string;
  userInput: string;
  context: Record<string, unknown>;
  evidenceText: string;
  history: ChatMessage[];
  config: CopilotConfig;
}

export interface CopilotResponse {
  answer: string;
  citations: Array<Record<string, unknown>>;
  followUps: string[];
}
