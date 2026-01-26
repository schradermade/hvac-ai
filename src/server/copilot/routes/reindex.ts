import { Hono } from 'hono';
import { JobNotFoundError } from '../jobContext';
import { reindexJobEvidence } from '../indexing';
import { reindexJobsForTenant, upsertJobSearchIndex } from '../search/jobSearchIndex';
import type { AppEnv } from '../workerTypes';

export function registerReindexRoutes(app: Hono<AppEnv>) {
  app.post('/search/reindex', async (c) => {
    const tenantId = c.get('tenantId');
    const apiKeyHeader = c.req.header('x-api-key');
    if (!c.env.SEARCH_ADMIN_TOKEN || apiKeyHeader !== c.env.SEARCH_ADMIN_TOKEN) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const count = await reindexJobsForTenant(c.env.D1_DB, tenantId);
    return c.json({ status: 'ok', reindexed: count }, 200);
  });

  app.post('/search/reindex/job/:jobId', async (c) => {
    const tenantId = c.get('tenantId');
    const apiKeyHeader = c.req.header('x-api-key');
    if (!c.env.SEARCH_ADMIN_TOKEN || apiKeyHeader !== c.env.SEARCH_ADMIN_TOKEN) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await upsertJobSearchIndex(c.env.D1_DB, tenantId, c.req.param('jobId'));
    return c.json({ status: 'ok' }, 200);
  });

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

    try {
      const result = await reindexJobEvidence({
        db: c.env.D1_DB,
        vectorize: c.env.VECTORIZE_INDEX,
        openAiApiKey: c.env.OPENAI_API_KEY,
        tenantId,
        jobId: c.req.param('jobId'),
      });

      return c.json({ status: 'ok', ...result }, 200);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        return c.json({ error: 'Job not found' }, 404);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });
}
