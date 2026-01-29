import { Hono } from 'hono';
import type { AppEnv } from '../workerTypes';

export function registerClientRoutes(app: Hono<AppEnv>) {
  app.get('/clients', async (c) => {
    const tenantId = c.get('tenantId');
    const search = c.req.query('search')?.toLowerCase();
    const city = c.req.query('city');
    const state = c.req.query('state');

    const params: unknown[] = [tenantId];
    const where: string[] = ['c.tenant_id = ?'];

    if (search) {
      where.push(
        '(LOWER(c.name) LIKE ? OR LOWER(c.primary_phone) LIKE ? OR LOWER(c.email) LIKE ?)'
      );
      const token = `%${search}%`;
      params.push(token, token, token);
    }

    if (city) {
      where.push(
        `(SELECT city FROM properties p WHERE p.client_id = c.id AND p.tenant_id = c.tenant_id ORDER BY p.created_at LIMIT 1) = ?`
      );
      params.push(city);
    }

    if (state) {
      where.push(
        `(SELECT state FROM properties p WHERE p.client_id = c.id AND p.tenant_id = c.tenant_id ORDER BY p.created_at LIMIT 1) = ?`
      );
      params.push(state);
    }

    const query = `
      SELECT
        c.id,
        c.tenant_id,
        c.name,
        c.type,
        c.primary_phone,
        c.email,
        (SELECT address_line1 FROM properties p WHERE p.client_id = c.id AND p.tenant_id = c.tenant_id ORDER BY p.created_at LIMIT 1) AS address_line1,
        (SELECT city FROM properties p WHERE p.client_id = c.id AND p.tenant_id = c.tenant_id ORDER BY p.created_at LIMIT 1) AS city,
        (SELECT state FROM properties p WHERE p.client_id = c.id AND p.tenant_id = c.tenant_id ORDER BY p.created_at LIMIT 1) AS state,
        (SELECT zip FROM properties p WHERE p.client_id = c.id AND p.tenant_id = c.tenant_id ORDER BY p.created_at LIMIT 1) AS zip,
        c.created_at,
        c.updated_at
      FROM clients c
      WHERE ${where.join(' AND ')}
      ORDER BY c.created_at DESC
    `.trim();

    const result = await c.env.D1_DB.prepare(query)
      .bind(...params)
      .all();

    return c.json({
      items: result.results ?? [],
      total: result.results?.length ?? 0,
    });
  });

  app.get('/clients/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const query = `
      SELECT
        c.id,
        c.tenant_id,
        c.name,
        c.type,
        c.primary_phone,
        c.email,
        (SELECT address_line1 FROM properties p WHERE p.client_id = c.id AND p.tenant_id = c.tenant_id ORDER BY p.created_at LIMIT 1) AS address_line1,
        (SELECT city FROM properties p WHERE p.client_id = c.id AND p.tenant_id = c.tenant_id ORDER BY p.created_at LIMIT 1) AS city,
        (SELECT state FROM properties p WHERE p.client_id = c.id AND p.tenant_id = c.tenant_id ORDER BY p.created_at LIMIT 1) AS state,
        (SELECT zip FROM properties p WHERE p.client_id = c.id AND p.tenant_id = c.tenant_id ORDER BY p.created_at LIMIT 1) AS zip,
        c.created_at,
        c.updated_at
      FROM clients c
      WHERE c.tenant_id = ? AND c.id = ?
      LIMIT 1
    `.trim();

    const row = await c.env.D1_DB.prepare(query).bind(tenantId, id).first();

    if (!row) {
      return c.json({ error: 'Client not found' }, 404);
    }

    return c.json(row);
  });
}
