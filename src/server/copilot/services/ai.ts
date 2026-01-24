export function buildSystemPrompt() {
  return [
    'You are HVACOps Copilot helping a technician on a specific job.',
    'Only answer using the provided structured context.',
    'If you do not see evidence, say you do not see it in the job history.',
    'Be concise and field-oriented.',
    'Citations must reference the provided evidence with doc_id, date, type, snippet.',
    'Return ONLY raw JSON with keys: answer, citations, follow_ups.',
  ].join(' ');
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
