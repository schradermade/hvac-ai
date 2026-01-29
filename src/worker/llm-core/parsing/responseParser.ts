export type ParsedResponse = {
  answer: string;
  citations: Array<Record<string, unknown>>;
  followUps: string[];
};

export type RawResponse = {
  content: string;
};

export function parseResponse(raw: RawResponse): ParsedResponse {
  const trimmed = raw.content.trim();
  let payload = trimmed;

  if (payload.startsWith('```')) {
    payload = payload.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    payload = payload.replace(/```\s*$/, '').trim();
  }

  try {
    const parsed = JSON.parse(payload) as {
      answer?: string;
      citations?: unknown[];
      follow_ups?: unknown[];
    };

    return {
      answer: parsed.answer ?? '',
      citations: Array.isArray(parsed.citations)
        ? (parsed.citations as Record<string, unknown>[])
        : [],
      followUps: Array.isArray(parsed.follow_ups)
        ? (parsed.follow_ups as string[]).filter((item) => typeof item === 'string')
        : [],
    };
  } catch {
    return { answer: trimmed, citations: [], followUps: [] };
  }
}
