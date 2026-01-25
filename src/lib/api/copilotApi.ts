import { getAuthToken } from '@/lib/storage';

const COPILOT_API_URL = process.env.EXPO_PUBLIC_COPILOT_API_URL;
const DEV_TENANT_ID = process.env.EXPO_PUBLIC_COPILOT_TENANT_ID;
const DEV_USER_ID = process.env.EXPO_PUBLIC_COPILOT_USER_ID;

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

export async function fetchCopilotJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
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
