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
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  created_at: string;
  updated_at: string;
};

type NoteRow = {
  id: string;
  note_type: string;
  content: string;
  created_at: string;
  author_user_id: string | null;
  author_name: string | null;
  author_email: string | null;
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
    const assignedUserId = c.req.query('assignedUserId');
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

    if (assignedUserId) {
      where.push('j.assigned_user_id = ?');
      params.push(assignedUserId);
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
        j.assigned_user_id,
        NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') AS assigned_user_name,
        j.created_at,
        j.updated_at
      FROM jobs j
      LEFT JOIN users u
        ON u.id = j.assigned_user_id
       AND u.tenant_id = j.tenant_id
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
        j.assigned_user_id,
        NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') AS assigned_user_name,
        j.created_at,
        j.updated_at
      FROM jobs j
      LEFT JOIN users u
        ON u.id = j.assigned_user_id
       AND u.tenant_id = j.tenant_id
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

  app.post('/jobs/:id/assign', async (c) => {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    const body = await c.req.json<{ technicianId?: string }>();

    if (!body?.technicianId) {
      return c.json({ error: 'Missing technicianId' }, 400);
    }

    const technician = await c.env.D1_DB.prepare(
      `
      SELECT id FROM users WHERE tenant_id = ? AND id = ? LIMIT 1
      `.trim()
    )
      .bind(tenantId, body.technicianId)
      .first();

    if (!technician) {
      return c.json({ error: 'Technician not found' }, 404);
    }

    await c.env.D1_DB.prepare(
      `
      UPDATE jobs
      SET assigned_user_id = ?, status = 'assigned',
          updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      WHERE tenant_id = ? AND id = ?
      `.trim()
    )
      .bind(body.technicianId, tenantId, id)
      .run();

    return c.json({ id }, 200);
  });

  app.get('/jobs/:id/notes', async (c) => {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');

    const job = await c.env.D1_DB.prepare(
      `
      SELECT id FROM jobs
      WHERE tenant_id = ? AND id = ?
      LIMIT 1
      `.trim()
    )
      .bind(tenantId, id)
      .first<{ id: string }>();

    if (!job) {
      return c.json({ error: 'Job not found' }, 404);
    }

    const result = await c.env.D1_DB.prepare(
      `
      SELECT
        n.id,
        n.note_type,
        n.content,
        n.created_at,
        n.author_user_id,
        NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') AS author_name,
        u.email AS author_email
      FROM notes n
      LEFT JOIN users u
        ON u.id = n.author_user_id
       AND u.tenant_id = n.tenant_id
      WHERE n.tenant_id = ? AND n.entity_type = 'job' AND n.entity_id = ?
      ORDER BY n.created_at DESC
      `.trim()
    )
      .bind(tenantId, id)
      .all<NoteRow>();

    return c.json({
      items: result.results ?? [],
      total: result.results?.length ?? 0,
    });
  });
}
