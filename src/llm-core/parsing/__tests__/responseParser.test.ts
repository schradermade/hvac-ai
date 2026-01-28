import { parseResponse } from '../responseParser';

describe('parseResponse', () => {
  it('parses JSON payloads', () => {
    const parsed = parseResponse({
      content: JSON.stringify({
        answer: 'Answer',
        citations: [{ doc_id: 'doc_1' }],
        follow_ups: ['Next'],
      }),
    });

    expect(parsed.answer).toBe('Answer');
    expect(parsed.citations).toHaveLength(1);
    expect(parsed.followUps).toEqual(['Next']);
  });

  it('parses fenced JSON payloads', () => {
    const parsed = parseResponse({
      content: '```json\n{"answer":"Hi","citations":[],"follow_ups":[]}\n```',
    });

    expect(parsed.answer).toBe('Hi');
    expect(parsed.citations).toEqual([]);
    expect(parsed.followUps).toEqual([]);
  });

  it('falls back to raw text on invalid JSON', () => {
    const parsed = parseResponse({ content: 'Not JSON' });

    expect(parsed.answer).toBe('Not JSON');
    expect(parsed.citations).toEqual([]);
    expect(parsed.followUps).toEqual([]);
  });
});
