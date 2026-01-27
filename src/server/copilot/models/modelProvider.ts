export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  responseFormat?: 'json_object';
  messages: ChatMessage[];
}

export interface ChatCompletion {
  content: string;
}

export interface ModelProvider {
  name: string;
  complete: (apiKey: string, request: ChatRequest) => Promise<ChatCompletion>;
}
