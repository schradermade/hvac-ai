import { Hono } from 'hono';
import { getJobContextSnapshot, JobNotFoundError } from '../jobContext';
import type { AppEnv } from '../workerTypes';

export function registerContextRoutes(app: Hono<AppEnv>) {
  app.get('/jobs/:jobId/ai/context', async (c) => {
    const tenantId = c.get('tenantId');
    try {
      const snapshot = await getJobContextSnapshot(c.env.D1_DB, tenantId, c.req.param('jobId'));
      return c.json(snapshot, 200);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        return c.json({ error: 'Job not found' }, 404);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });
}
