import { Hono } from 'hono';
import { reindexJobEvidence } from '../indexing';
import type { AppEnv } from '../workerTypes';

export function registerReindexRoutes(app: Hono<AppEnv>) {
  app.post('/vectorize/reindex/job/:jobId', async (c) => {
    const tenantId = c.get('tenantId');

    if (!c.env.VECTORIZE_INDEX) {
      return c.json({ error: 'Vectorize index not configured' }, 500);
    }

    if (!c.env.OPENAI_API_KEY) {
      return c.json({ error: 'Missing OpenAI API key' }, 500);
    }

    const apiKeyHeader = c.req.header('x-api-key');
    if (!c.env.VECTORIZE_ADMIN_TOKEN || apiKeyHeader !== c.env.VECTORIZE_ADMIN_TOKEN) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const result = await reindexJobEvidence({
      db: c.env.D1_DB,
      vectorize: c.env.VECTORIZE_INDEX,
      openAiApiKey: c.env.OPENAI_API_KEY,
      tenantId,
      jobId: c.req.param('jobId'),
    });

    return c.json({ status: 'ok', ...result }, 200);
  });
}
