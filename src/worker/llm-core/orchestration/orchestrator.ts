import type { ModelProvider } from '../models/types';
import { buildPrompt } from '../prompts/buildPrompt';
import { parseResponse } from '../parsing/responseParser';
import type { CopilotRequest, CopilotResponse } from './types';
import type { Telemetry } from '../telemetry/types';

export interface OrchestratorDeps {
  model: ModelProvider;
  telemetry?: Telemetry;
}

export async function runCopilotOrchestrator(
  deps: OrchestratorDeps,
  request: CopilotRequest
): Promise<CopilotResponse> {
  const startedAt = Date.now();
  deps.telemetry?.emit({
    name: 'llm.request.started',
    requestId: request.requestId,
    timestamp: new Date().toISOString(),
    payload: {
      promptVersion: request.config.prompt.version,
      model: request.config.model.model,
    },
  });

  const prompt = buildPrompt(request.config.prompt.version, {
    snapshot: request.context,
    evidenceText: request.evidenceText,
    history: request.history,
    userMessage: request.userInput,
  });

  try {
    const completion = await deps.model.complete({
      model: request.config.model.model,
      temperature: request.config.model.temperature,
      topP: request.config.model.topP,
      maxTokens: request.config.model.maxTokens,
      responseFormat: request.config.model.responseFormat,
      messages: prompt,
    });

    deps.telemetry?.emit({
      name: 'llm.model.completed',
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      payload: {
        model: request.config.model.model,
        usage: completion.usage ?? null,
      },
    });

    const parsed = parseResponse({ content: completion.content });

    deps.telemetry?.emit({
      name: 'llm.response.parsed',
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      payload: {
        citations: parsed.citations.length,
        followUps: parsed.followUps.length,
      },
    });

    deps.telemetry?.emit({
      name: 'llm.request.completed',
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      payload: {
        latencyMs: Date.now() - startedAt,
      },
    });

    return {
      answer: parsed.answer,
      citations: parsed.citations,
      followUps: parsed.followUps,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    deps.telemetry?.emit({
      name: 'llm.request.failed',
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      payload: {
        error: message,
      },
    });
    throw error;
  }
}
