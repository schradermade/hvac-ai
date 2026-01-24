import { Hono } from 'hono';
import type { AppEnv } from '../workerTypes';

export function registerSessionRoutes(app: Hono<AppEnv>) {
  app.post('/jobs/:jobId/ai/session', (c) => {
    const tenantId = c.get('tenantId');
    const jobId = c.req.param('jobId');
    return c.json(
      {
        sessionId: `session_${jobId}`,
        jobId,
        tenantId,
        status: 'active',
      },
      200
    );
  });
}
