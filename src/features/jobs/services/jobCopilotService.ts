import type { JobCopilotResponse } from '../types/copilot';
import { fetchCopilotJson } from '@/lib/api/copilotApi';
import { getAuthToken } from '@/lib/storage';

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
  async sendMessage(
    jobId: string,
    message: string,
    conversationId?: string
  ): Promise<JobCopilotResponse> {
    if (!process.env.EXPO_PUBLIC_COPILOT_API_URL) {
      return buildMockResponse(message);
    }

    return fetchCopilotJson<JobCopilotResponse>(`/api/jobs/${jobId}/ai/chat`, {
      method: 'POST',
      body: { message, conversationId },
    });
  }

  async sendMessageStreaming(params: {
    jobId: string;
    message: string;
    conversationId?: string | null;
    onDelta: (delta: string) => void;
  }): Promise<JobCopilotResponse> {
    if (!process.env.EXPO_PUBLIC_COPILOT_API_URL) {
      const mock = buildMockResponse(params.message);
      mock.answer.split(' ').forEach((word) => params.onDelta(`${word} `));
      return mock;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      const tenantId = process.env.EXPO_PUBLIC_COPILOT_TENANT_ID;
      const userId = process.env.EXPO_PUBLIC_COPILOT_USER_ID;
      if (tenantId) {
        headers['x-tenant-id'] = tenantId;
      }
      if (userId) {
        headers['x-user-id'] = userId;
      }
    }

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_COPILOT_API_URL}/api/jobs/${params.jobId}/ai/chat`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: params.message,
          conversationId: params.conversationId ?? undefined,
          stream: true,
        }),
      }
    );

    if (!response.body || !('getReader' in response.body)) {
      return this.sendMessage(params.jobId, params.message, params.conversationId ?? undefined);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let donePayload: JobCopilotResponse | null = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() ?? '';

      for (const chunk of chunks) {
        const line = chunk.split('\n').find((entry) => entry.trim().startsWith('data: '));
        if (!line) continue;
        const payload = line.replace(/^data:\s*/, '').trim();
        if (!payload) continue;
        try {
          const parsed = JSON.parse(payload) as { delta?: string } | JobCopilotResponse;
          if ('delta' in parsed && typeof parsed.delta === 'string') {
            params.onDelta(parsed.delta);
          } else if ('answer' in parsed) {
            donePayload = parsed as JobCopilotResponse;
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    if (!donePayload) {
      throw new Error('Streaming response incomplete');
    }

    return donePayload;
  }
}

export const jobCopilotService = new JobCopilotService();
