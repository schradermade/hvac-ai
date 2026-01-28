import type { ChatCompletion, ChatRequest, ModelProvider } from '../../../llm-core/models/types';
import { callOpenAI } from '../../../server/copilot/services/ai';

type OpenAIResponse = { choices: Array<{ message?: { content?: string } }> };

export function createOpenAIProvider(apiKey: string): ModelProvider {
  return {
    name: 'openai',
    async complete(request: ChatRequest): Promise<ChatCompletion> {
      const payload: Record<string, unknown> = {
        model: request.model,
        temperature: request.temperature,
        response_format: request.responseFormat ? { type: request.responseFormat } : undefined,
        messages: request.messages,
      };

      if (request.topP !== undefined) {
        payload.top_p = request.topP;
      }

      if (request.maxTokens !== undefined) {
        payload.max_tokens = request.maxTokens;
      }

      const response = (await callOpenAI(apiKey, payload)) as OpenAIResponse;
      return { content: response.choices[0]?.message?.content ?? '' };
    },
  };
}
