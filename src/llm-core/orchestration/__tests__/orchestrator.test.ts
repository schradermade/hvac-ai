import { runCopilotOrchestrator } from '../orchestrator';
import type { ModelProvider } from '../../models/types';
import { defaultCopilotConfig } from '../../config/defaults';

describe('runCopilotOrchestrator', () => {
  it('builds a prompt and parses the response', async () => {
    const provider: ModelProvider = {
      name: 'test',
      complete: async (request) => {
        expect(request.messages[0]?.role).toBe('system');
        return {
          content: JSON.stringify({
            answer: 'Result',
            citations: [{ doc_id: 'doc_1' }],
            follow_ups: ['Next'],
          }),
        };
      },
    };

    const response = await runCopilotOrchestrator(
      { model: provider },
      {
        requestId: 'req_1',
        userInput: 'What next?',
        context: { job: { id: 'job_1' } },
        evidenceText: 'Evidence',
        history: [],
        config: defaultCopilotConfig,
      }
    );

    expect(response.answer).toBe('Result');
    expect(response.citations).toHaveLength(1);
    expect(response.followUps).toEqual(['Next']);
  });
});
