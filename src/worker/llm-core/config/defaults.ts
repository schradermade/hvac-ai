import type { CopilotConfig } from './types';

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
