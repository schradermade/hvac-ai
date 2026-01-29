import { Hono } from 'hono';
import type { AppEnv } from '../workerTypes';

type TechnicianRow = {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export function registerTechnicianRoutes(app: Hono<AppEnv>) {
  app.get('/technicians', async (c) => {
    const tenantId = c.get('tenantId');
    const search = c.req.query('search')?.toLowerCase();
    const role = c.req.query('role');

    const params: unknown[] = [tenantId];
    const where: string[] = ['tenant_id = ?'];

    if (search) {
      where.push('(LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(email) LIKE ?)');
      const token = `%${search}%`;
      params.push(token, token, token);
    }

    if (role) {
      where.push('role = ?');
      params.push(role);
    }

    const query = `
      SELECT id, tenant_id, email, first_name, last_name, phone, role, created_at, updated_at
      FROM users
      WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC
    `.trim();

    const result = await c.env.D1_DB.prepare(query)
      .bind(...params)
      .all<TechnicianRow>();

    return c.json({
      technicians: result.results ?? [],
      total: result.results?.length ?? 0,
    });
  });

  app.get('/technicians/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const row = await c.env.D1_DB.prepare(
      `
      SELECT id, tenant_id, email, first_name, last_name, phone, role, created_at, updated_at
      FROM users
      WHERE tenant_id = ? AND id = ?
      LIMIT 1
      `.trim()
    )
      .bind(tenantId, id)
      .first<TechnicianRow>();

    if (!row) {
      return c.json({ error: 'Technician not found' }, 404);
    }

    return c.json(row);
  });

  app.post('/technicians', async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json<{
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
    }>();

    if (!body?.email || !body?.firstName || !body?.lastName) {
      return c.json({ error: 'Missing email, firstName, or lastName' }, 400);
    }

    const id = crypto.randomUUID();
    const role = body.role ?? 'technician';

    await c.env.D1_DB.prepare(
      `
      INSERT INTO users (id, tenant_id, first_name, last_name, email, role, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `.trim()
    )
      .bind(id, tenantId, body.firstName, body.lastName, body.email, role, body.phone ?? null)
      .run();

    return c.json({ id }, 201);
  });
}
