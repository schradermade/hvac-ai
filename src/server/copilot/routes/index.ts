import { Hono } from 'hono';
import type { AppEnv } from '../workerTypes';
import { registerChatRoutes } from './chat';
import { registerContextRoutes } from './context';
import { registerReindexRoutes } from './reindex';
import { registerSessionRoutes } from './session';

export function createCopilotRouter() {
  const router = new Hono<AppEnv>();

  router.use('*', async (c, next) => {
    const tenantId = c.req.header('x-tenant-id');
    if (!tenantId) {
      return c.json({ error: 'Missing x-tenant-id header' }, 400);
    }
    c.set('tenantId', tenantId);
    return next();
  });

  registerContextRoutes(router);
  registerSessionRoutes(router);
  registerChatRoutes(router);
  registerReindexRoutes(router);

  return router;
}
