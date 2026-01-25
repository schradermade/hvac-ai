import { Hono } from 'hono';
import { AccessAuthError, authenticateAccessToken } from '../auth/access';
import { authenticateAppJwt } from '../auth/jwt';
import type { AppEnv } from '../workerTypes';
import { registerChatRoutes } from './chat';
import { registerClientRoutes } from './clients';
import { registerContextRoutes } from './context';
import { registerDebugRoutes } from './debug';
import { registerIngestRoutes } from './ingest';
import { registerJobRoutes } from './jobs';
import { registerTechnicianRoutes } from './technicians';
import { registerReindexRoutes } from './reindex';
import { registerSessionRoutes } from './session';

export function createCopilotRouter() {
  const router = new Hono<AppEnv>();

  router.use('*', async (c, next) => {
    const path = c.req.path;
    const adminToken = c.req.header('x-admin-token');
    const expectedAdmin = c.env.VECTORIZE_ADMIN_TOKEN;

    if (path.includes('/debug/') && expectedAdmin && adminToken === expectedAdmin) {
      return next();
    }

    const allowDevAuth = c.env.ALLOW_DEV_AUTH === '1';
    const token = c.req.header('Cf-Access-Jwt-Assertion');
    const bearer = c.req.header('Authorization');

    if (bearer?.startsWith('Bearer ')) {
      try {
        const jwt = bearer.slice('Bearer '.length);
        const jwksFetcher = c.env.AUTH_SERVICE
          ? async () => {
              const response = await c.env.AUTH_SERVICE.fetch('https://auth/.well-known/jwks.json');
              if (!response.ok) {
                throw new Error(`JWKS fetch failed: ${response.status}`);
              }
              return (await response.json()) as JSONWebKeySet;
            }
          : undefined;
        const identity = await authenticateAppJwt({
          token: jwt,
          jwksUrl: c.env.AUTH_JWKS_URL ?? '',
          audience: c.env.AUTH_JWT_AUD ?? '',
          issuer: c.env.AUTH_JWT_ISSUER ?? '',
          jwksFetcher,
        });

        c.set('tenantId', identity.tenantId);
        c.set('userId', identity.userId);
        c.set('userRole', identity.role);
        return next();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid token';
        return c.json({ error: message }, 401);
      }
    }

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
  registerDebugRoutes(router);
  registerClientRoutes(router);
  registerJobRoutes(router);
  registerTechnicianRoutes(router);
  registerIngestRoutes(router);
  registerReindexRoutes(router);

  return router;
}
