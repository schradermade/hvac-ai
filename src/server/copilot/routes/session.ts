import { Hono } from 'hono';
import { jobExists } from '../jobContext';
import type { AppEnv } from '../workerTypes';

export function registerSessionRoutes(app: Hono<AppEnv>) {
  app.post('/jobs/:jobId/ai/session', async (c) => {
    const tenantId = c.get('tenantId');
    const jobId = c.req.param('jobId');
    const exists = await jobExists(c.env.D1_DB, tenantId, jobId);
    if (!exists) {
      return c.json({ error: 'Job not found' }, 404);
    }
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
