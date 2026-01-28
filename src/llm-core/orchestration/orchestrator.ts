import type { ModelProvider } from '../models/types';
import { buildPrompt } from '../prompts/buildPrompt';
import { parseResponse } from '../parsing/responseParser';
import type { CopilotRequest, CopilotResponse } from './types';

export interface OrchestratorDeps {
  model: ModelProvider;
}

export async function runCopilotOrchestrator(
  deps: OrchestratorDeps,
  request: CopilotRequest
): Promise<CopilotResponse> {
  const prompt = buildPrompt(request.config.prompt.version, {
    snapshot: request.context,
    evidenceText: request.evidenceText,
    history: request.history,
    userMessage: request.userInput,
  });

  const completion = await deps.model.complete({
    model: request.config.model.model,
    temperature: request.config.model.temperature,
    topP: request.config.model.topP,
    maxTokens: request.config.model.maxTokens,
    responseFormat: request.config.model.responseFormat,
    messages: prompt,
  });

  const parsed = parseResponse({ content: completion.content });

  return {
    answer: parsed.answer,
    citations: parsed.citations,
    followUps: parsed.followUps,
  };
}
