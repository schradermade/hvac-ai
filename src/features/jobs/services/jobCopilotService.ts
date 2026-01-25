import type { JobCopilotResponse } from '../types/copilot';
import { getAuthToken } from '@/lib/storage';

const COPILOT_API_URL = process.env.EXPO_PUBLIC_COPILOT_API_URL;
const DEV_TENANT_ID = process.env.EXPO_PUBLIC_COPILOT_TENANT_ID;
const DEV_USER_ID = process.env.EXPO_PUBLIC_COPILOT_USER_ID;

type FetchOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
};

async function fetchCopilot<T>(path: string, options: FetchOptions = {}): Promise<T> {
  if (!COPILOT_API_URL) {
    throw new Error('Copilot API URL not configured');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = await getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!token && DEV_TENANT_ID) {
    headers['x-tenant-id'] = DEV_TENANT_ID;
  }

  if (!token && DEV_USER_ID) {
    headers['x-user-id'] = DEV_USER_ID;
  }

  const response = await fetch(`${COPILOT_API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Copilot API request failed');
  }

  return (await response.json()) as T;
}

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
    if (!COPILOT_API_URL) {
      return buildMockResponse(message);
    }

    return fetchCopilot<JobCopilotResponse>(`/api/jobs/${jobId}/ai/chat`, {
      method: 'POST',
      body: { message },
    });
  }
}

export const jobCopilotService = new JobCopilotService();
