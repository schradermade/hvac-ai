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

  const refreshSessionIfNeeded = async () => {
    const storage = await import('@/lib/storage');
    const session = await storage.getActiveAccountSession();
    if (!session) {
      return null;
    }

    const now = new Date();
    if (now <= session.expiresAt) {
      return session.token;
    }

    if (now > session.refreshExpiresAt) {
      return session.token;
    }

    const { authService } = await import('@/features/auth/services/authService');
    const refreshed = await authService.refreshToken();
    await storage.saveAccountSession(
      refreshed.user,
      refreshed.token,
      refreshed.expiresAt,
      refreshed.refreshToken,
      refreshed.refreshExpiresAt
    );
    return refreshed.token;
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let token = await getAuthToken();
  if (token) {
    token = (await refreshSessionIfNeeded()) ?? token;
    headers.Authorization = `Bearer ${token}`;
  }

  if (!token && DEV_TENANT_ID) {
    headers['x-tenant-id'] = DEV_TENANT_ID;
  }

  if (!token && DEV_USER_ID) {
    headers['x-user-id'] = DEV_USER_ID;
  }

  const request = async (authToken?: string) => {
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    return fetch(`${COPILOT_API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  let response = await request(token ?? undefined);

  if (!response.ok && response.status === 401) {
    const body = await response.text();
    if (body.includes('exp') || body.toLowerCase().includes('token')) {
      const refreshedToken = await refreshSessionIfNeeded();
      if (refreshedToken && refreshedToken !== token) {
        response = await request(refreshedToken);
      } else {
        throw new Error(body || 'Copilot API request failed');
      }
    } else {
      throw new Error(body || 'Copilot API request failed');
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Copilot API request failed');
  }

  return (await response.json()) as T;
}
