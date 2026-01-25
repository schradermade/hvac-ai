import { Hono } from 'hono';
import type { AppEnv } from '../workerTypes';

type JobRow = {
  id: string;
  tenant_id: string;
  client_id: string;
  property_id: string;
  job_type: string;
  status: string;
  scheduled_at: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

function parseDateParam(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function registerJobRoutes(app: Hono<AppEnv>) {
  app.get('/jobs', async (c) => {
    const tenantId = c.get('tenantId');
    const clientId = c.req.query('clientId');
    const status = c.req.query('status');
    const type = c.req.query('type');
    const start = parseDateParam(c.req.query('start'));
    const end = parseDateParam(c.req.query('end'));

    const params: unknown[] = [tenantId];
    const where: string[] = ['j.tenant_id = ?'];

    if (clientId) {
      where.push('j.client_id = ?');
      params.push(clientId);
    }

    if (status) {
      where.push('j.status = ?');
      params.push(status);
    }

    if (type) {
      where.push('j.job_type = ?');
      params.push(type);
    }

    if (start && end) {
      where.push('j.scheduled_at >= ? AND j.scheduled_at <= ?');
      params.push(start, end);
    }

    const query = `
      SELECT
        j.id,
        j.tenant_id,
        j.client_id,
        j.property_id,
        j.job_type,
        j.status,
        j.scheduled_at,
        j.summary,
        j.created_at,
        j.updated_at
      FROM jobs j
      WHERE ${where.join(' AND ')}
      ORDER BY j.scheduled_at ASC
    `.trim();

    const result = await c.env.D1_DB.prepare(query)
      .bind(...params)
      .all<JobRow>();

    return c.json({
      items: result.results ?? [],
      total: result.results?.length ?? 0,
    });
  });

  app.get('/jobs/:id', async (c) => {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const row = await c.env.D1_DB.prepare(
      `
      SELECT
        j.id,
        j.tenant_id,
        j.client_id,
        j.property_id,
        j.job_type,
        j.status,
        j.scheduled_at,
        j.summary,
        j.created_at,
        j.updated_at
      FROM jobs j
      WHERE j.tenant_id = ? AND j.id = ?
      LIMIT 1
      `.trim()
    )
      .bind(tenantId, id)
      .first<JobRow>();

    if (!row) {
      return c.json({ error: 'Job not found' }, 404);
    }

    return c.json(row);
  });

  app.post('/jobs', async (c) => {
    const tenantId = c.get('tenantId');
    const body = await c.req.json<{
      clientId?: string;
      propertyId?: string;
      jobType?: string;
      scheduledAt?: string;
      status?: string;
      summary?: string;
    }>();

    if (!body?.clientId || !body?.jobType) {
      return c.json({ error: 'Missing clientId or jobType' }, 400);
    }

    let propertyId = body.propertyId;
    if (!propertyId) {
      const property = await c.env.D1_DB.prepare(
        `
        SELECT id FROM properties
        WHERE tenant_id = ? AND client_id = ?
        ORDER BY created_at ASC
        LIMIT 1
        `.trim()
      )
        .bind(tenantId, body.clientId)
        .first<{ id: string }>();

      if (!property?.id) {
        return c.json({ error: 'Property not found for client' }, 400);
      }
      propertyId = property.id;
    }

    const id = crypto.randomUUID();
    const status = body.status ?? 'scheduled';

    await c.env.D1_DB.prepare(
      `
      INSERT INTO jobs (
        id,
        tenant_id,
        property_id,
        client_id,
        job_type,
        scheduled_at,
        status,
        summary
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `.trim()
    )
      .bind(
        id,
        tenantId,
        propertyId,
        body.clientId,
        body.jobType,
        body.scheduledAt ?? null,
        status,
        body.summary ?? null
      )
      .run();

    return c.json({ id }, 201);
  });
}
