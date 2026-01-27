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

export const defaultCopilotConfig: CopilotConfig = {
  model: {
    model: 'gpt-4o',
    embeddingModel: 'text-embedding-3-small',
    temperature: 0.2,
    responseFormat: 'json_object',
  },
  retrieval: {
    mode: 'vector',
    topK: 6,
    fallbackTopK: 10,
    historyLimit: 25,
  },
  prompt: {
    version: 'copilot.v1',
  },
};
