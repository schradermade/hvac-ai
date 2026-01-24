import { Hono } from 'hono';
import { AccessAuthError, authenticateAccessToken } from '../auth/access';
import type { AppEnv } from '../workerTypes';
import { registerChatRoutes } from './chat';
import { registerContextRoutes } from './context';
import { registerReindexRoutes } from './reindex';
import { registerSessionRoutes } from './session';

export function createCopilotRouter() {
  const router = new Hono<AppEnv>();

  router.use('*', async (c, next) => {
    const allowDevAuth = c.env.ALLOW_DEV_AUTH === '1';
    const token = c.req.header('Cf-Access-Jwt-Assertion');

    if (!token && allowDevAuth) {
      const tenantId = c.req.header('x-tenant-id');
      const userId = c.req.header('x-user-id');
      const userRole = c.req.header('x-user-role') ?? 'technician';

      if (!tenantId || !userId) {
        return c.json({ error: 'Missing dev auth headers' }, 401);
      }

      console.warn('Using dev auth headers for copilot request.');
      c.set('tenantId', tenantId);
      c.set('userId', userId);
      c.set('userRole', userRole);
      return next();
    }

    try {
      const identity = await authenticateAccessToken({
        db: c.env.D1_DB,
        token,
        jwksUrl: c.env.CF_ACCESS_JWKS_URL ?? null,
        audience: c.env.CF_ACCESS_AUD ?? null,
        issuer: c.env.CF_ACCESS_ISSUER ?? null,
      });

      c.set('tenantId', identity.tenantId);
      c.set('userId', identity.userId);
      c.set('userRole', identity.role);
      return next();
    } catch (error) {
      if (error instanceof AccessAuthError) {
        return c.json({ error: error.message }, error.status);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  registerContextRoutes(router);
  registerSessionRoutes(router);
  registerChatRoutes(router);
  registerReindexRoutes(router);

  return router;
}
