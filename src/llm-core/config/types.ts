export type RetrievalMode = 'vector' | 'keyword' | 'hybrid';

export interface CopilotModelConfig {
  model: string;
  embeddingModel: string;
  temperature: number;
  topP?: number;
  maxTokens?: number;
  responseFormat: 'json_object';
}

export interface CopilotRetrievalConfig {
  mode: RetrievalMode;
  topK: number;
  fallbackTopK: number;
  historyLimit: number;
}

export interface CopilotPromptConfig {
  version: string;
}

export interface CopilotConfig {
  model: CopilotModelConfig;
  retrieval: CopilotRetrievalConfig;
  prompt: CopilotPromptConfig;
}
