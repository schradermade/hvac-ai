import type { CopilotConfig } from '../config/copilotConfig';
import type { ModelProvider } from '../models/modelProvider';
import type { Retriever } from '../retrieval/types';
import { buildPrompt } from '../prompts/promptBuilder';
import { parseResponse } from '../parsing/responseParser';

export type OrchestratorDeps = {
  config: CopilotConfig;
  provider: ModelProvider;
  retriever: Retriever;
};

export type OrchestratorInput = {
  apiKey: string;
  query: string;
  snapshot: Record<string, unknown>;
  evidenceText: string;
  history: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
};

export type OrchestratorResult = {
  answer: string;
  citations: Array<Record<string, unknown>>;
  followUps: string[];
  retrieval: { evidence: Array<{ text: string }> };
};

export async function runCopilotOrchestrator(
  deps: OrchestratorDeps,
  input: OrchestratorInput
): Promise<OrchestratorResult> {
  const prompt = buildPrompt(deps.config.prompt.version, {
    snapshot: input.snapshot,
    evidenceText: input.evidenceText,
    history: input.history,
    userMessage: input.query,
  });

  const completion = await deps.provider.complete(input.apiKey, {
    model: deps.config.model.model,
    temperature: deps.config.model.temperature,
    topP: deps.config.model.topP,
    maxTokens: deps.config.model.maxTokens,
    responseFormat: deps.config.model.responseFormat,
    messages: prompt,
  });

  const parsed = parseResponse({ content: completion.content });

  return {
    answer: parsed.answer,
    citations: parsed.citations,
    followUps: parsed.followUps,
    retrieval: { evidence: [] },
  };
}
