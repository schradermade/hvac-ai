import { buildPrompt } from '../buildPrompt';
import type { ChatMessage } from '../types';

const history: ChatMessage[] = [{ role: 'user', content: 'Previous question' }];

describe('buildPrompt', () => {
  it('builds a system + context + history + user message sequence', () => {
    const messages = buildPrompt('copilot.v1', {
      snapshot: { job: { id: 'job_1' } },
      evidenceText: 'Evidence block',
      history,
      userMessage: 'Current question',
    });

    expect(messages).toMatchInlineSnapshot(`
[
  {
    "content": "You are HVACOps Copilot helping a technician on a specific job. Only answer using the provided structured context. If evidence is provided, you MUST use it and cite it. If you do not see evidence, say you do not see it in the job history. Be concise and field-oriented. Citations must reference the provided evidence with doc_id, date, type, snippet. Return ONLY raw JSON with keys: answer, citations, follow_ups.",
    "role": "system",
  },
  {
    "content": "Structured context:
{\\"job\\":{\\"id\\":\\"job_1\\"}}

Evidence (labeled sections):
Evidence block",
    "role": "system",
  },
  {
    "content": "Previous question",
    "role": "user",
  },
  {
    "content": "Current question",
    "role": "user",
  },
]
`);
  });
});
