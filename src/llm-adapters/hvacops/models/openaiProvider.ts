import type {
  ChatCompletion,
  ChatRequest,
  ChatStreamChunk,
  ModelProvider,
} from '../../../llm-core/models/types';
import { callOpenAI } from '../services/ai';

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
    async *stream(request: ChatRequest): AsyncIterable<ChatStreamChunk> {
      const payload: Record<string, unknown> = {
        model: request.model,
        temperature: request.temperature,
        response_format: request.responseFormat ? { type: request.responseFormat } : undefined,
        messages: request.messages,
        stream: true,
      };

      if (request.topP !== undefined) {
        payload.top_p = request.topP;
      }

      if (request.maxTokens !== undefined) {
        payload.max_tokens = request.maxTokens;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`OpenAI streaming error: ${response.status} ${errorText}`);
      }

      const decoder = new TextDecoder();
      const reader = response.body.getReader();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          const line = chunk.split('\n').find((entry) => entry.trim().startsWith('data: '));
          if (!line) continue;
          const payloadText = line.replace(/^data:\s*/, '').trim();
          if (payloadText === '[DONE]') {
            yield { delta: '', done: true };
            buffer = '';
            break;
          }
          try {
            const parsed = JSON.parse(payloadText) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              yield { delta };
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    },
  };
}
