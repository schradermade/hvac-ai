import { promptVersions } from '../../../llm-core/prompts/versions';

export function buildSystemPrompt() {
  return promptVersions['copilot.v1'].system;
}

export function extractJsonPayload(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith('```')) {
    const fenced = trimmed.replace(/^```json\\s*/i, '').replace(/^```\\s*/i, '');
    const withoutFence = fenced.replace(/```\\s*$/, '');
    return withoutFence.trim();
  }
  return trimmed;
}

export async function callOpenAI(apiKey: string, payload: unknown) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<{
    choices: Array<{ message?: { content?: string } }>;
  }>;
}
