import { Hono } from 'hono';
import type { AppEnv } from '../workerTypes';

export function registerDebugRoutes(app: Hono<AppEnv>) {
  app.get('/debug/jwks', async (c) => {
    const adminToken = c.req.header('x-admin-token');
    const expected = c.env.VECTORIZE_ADMIN_TOKEN;

    if (!expected || adminToken !== expected) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const jwksUrl = c.env.AUTH_JWKS_URL ?? '';
    if (!jwksUrl) {
      return c.json({ error: 'AUTH_JWKS_URL not set' }, 400);
    }

    try {
      const response = await fetch(jwksUrl);
      const text = await response.text();
      const snippet = text.slice(0, 200).replace(/\s+/g, ' ');
      return c.json({
        jwksUrl,
        status: response.status,
        contentType: response.headers.get('content-type') ?? 'unknown',
        bodySnippet: snippet,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ jwksUrl, error: message }, 500);
    }
  });
}
