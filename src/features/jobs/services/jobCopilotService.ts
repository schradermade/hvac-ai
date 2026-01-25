import type { JobCopilotResponse } from '../types/copilot';
import { fetchCopilotJson } from '@/lib/api/copilotApi';

function buildMockResponse(message: string): JobCopilotResponse {
  const lower = message.toLowerCase();
  if (lower.includes('rattle') || lower.includes('noise')) {
    return {
      answer:
        'Yes — the notes mention intermittent rattling from the air handler. The prior tech recommended tightening the blower mount on the next visit.',
      citations: [
        {
          doc_id: 'note_demo_1',
          date: '2024-11-12T17:40:00Z',
          type: 'note',
          snippet:
            'Homeowner reported intermittent rattling from the air handler. Recommended tightening blower mount at next visit.',
        },
      ],
      follow_ups: ['Any parts replaced last visit?', 'Show recent maintenance notes'],
    };
  }

  return {
    answer:
      'I can help with service history, equipment details, and recent notes. Ask about repeat issues, last maintenance, or technician notes.',
    citations: [],
    follow_ups: ['Any repeat issues?', 'When was the last maintenance?'],
  };
}

class JobCopilotService {
  async sendMessage(jobId: string, message: string): Promise<JobCopilotResponse> {
    if (!process.env.EXPO_PUBLIC_COPILOT_API_URL) {
      return buildMockResponse(message);
    }

    return fetchCopilotJson<JobCopilotResponse>(`/api/jobs/${jobId}/ai/chat`, {
      method: 'POST',
      body: { message },
    });
  }
}

export const jobCopilotService = new JobCopilotService();
