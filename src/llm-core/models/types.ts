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
  raw?: unknown;
  usage?: TokenUsage;
}

export interface ChatStreamChunk {
  delta: string;
  done?: boolean;
  raw?: unknown;
}

export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface ModelProvider {
  name: string;
  complete: (request: ChatRequest) => Promise<ChatCompletion>;
  stream?: (request: ChatRequest) => AsyncIterable<ChatStreamChunk>;
}
