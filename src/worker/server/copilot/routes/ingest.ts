import { Hono } from 'hono';
import { JobNotFoundError, jobExists } from '../jobContext';
import { reindexJobEvidence } from '../indexing';
import {
  reindexJobsByClient,
  reindexJobsByProperty,
  upsertJobSearchIndex,
} from '../search/jobSearchIndex';
import type { AppEnv } from '../workerTypes';

type JsonRecord = Record<string, unknown>;

async function readJson(c: Parameters<Parameters<Hono<AppEnv>['post']>[1]>[0]) {
  return c.req.json<JsonRecord>().catch(() => null);
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredString(value: unknown, field: string) {
  const text = asString(value);
  if (!text) {
    return { error: `Missing ${field}` };
  }
  return { value: text };
}

function optionalString(value: unknown) {
  const text = asString(value);
  return text ? text : null;
}

export function registerIngestRoutes(app: Hono<AppEnv>) {
  app.post('/ingest/clients', async (c) => {
    const tenantId = c.get('tenantId');
    const body = await readJson(c);
    if (!body) {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const name = requiredString(body.name, 'name');
    if ('error' in name) {
      return c.json({ error: name.error }, 400);
    }

    const id = optionalString(body.id) ?? crypto.randomUUID();
    const type = optionalString(body.type) ?? 'residential';

    await c.env.D1_DB.prepare(
      `
      INSERT INTO clients (id, tenant_id, name, type, primary_phone, email)
      VALUES (?, ?, ?, ?, ?, ?)
      `.trim()
    )
      .bind(
        id,
        tenantId,
        name.value,
        type,
        optionalString(body.primaryPhone),
        optionalString(body.email)
      )
      .run();

    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(reindexJobsByClient(c.env.D1_DB, tenantId, id));
    } else {
      await reindexJobsByClient(c.env.D1_DB, tenantId, id);
    }

    return c.json({ id }, 201);
  });

  app.post('/ingest/properties', async (c) => {
    const tenantId = c.get('tenantId');
    const body = await readJson(c);
    if (!body) {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const clientId = requiredString(body.clientId, 'clientId');
    if ('error' in clientId) {
      return c.json({ error: clientId.error }, 400);
    }
    const addressLine1 = requiredString(body.addressLine1, 'addressLine1');
    if ('error' in addressLine1) {
      return c.json({ error: addressLine1.error }, 400);
    }
    const city = requiredString(body.city, 'city');
    if ('error' in city) {
      return c.json({ error: city.error }, 400);
    }
    const state = requiredString(body.state, 'state');
    if ('error' in state) {
      return c.json({ error: state.error }, 400);
    }
    const zip = requiredString(body.zip, 'zip');
    if ('error' in zip) {
      return c.json({ error: zip.error }, 400);
    }

    const id = optionalString(body.id) ?? crypto.randomUUID();

    await c.env.D1_DB.prepare(
      `
      INSERT INTO properties (
        id, tenant_id, client_id, address_line1, address_line2, city, state, zip, access_notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `.trim()
    )
      .bind(
        id,
        tenantId,
        clientId.value,
        addressLine1.value,
        optionalString(body.addressLine2),
        city.value,
        state.value,
        zip.value,
        optionalString(body.accessNotes)
      )
      .run();

    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(reindexJobsByProperty(c.env.D1_DB, tenantId, id));
    } else {
      await reindexJobsByProperty(c.env.D1_DB, tenantId, id);
    }

    return c.json({ id }, 201);
  });

  app.post('/ingest/jobs', async (c) => {
    const tenantId = c.get('tenantId');
    const body = await readJson(c);
    if (!body) {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const jobType = requiredString(body.jobType, 'jobType');
    if ('error' in jobType) {
      return c.json({ error: jobType.error }, 400);
    }
    const clientId = requiredString(body.clientId, 'clientId');
    if ('error' in clientId) {
      return c.json({ error: clientId.error }, 400);
    }
    const propertyId = requiredString(body.propertyId, 'propertyId');
    if ('error' in propertyId) {
      return c.json({ error: propertyId.error }, 400);
    }

    const id = optionalString(body.id) ?? crypto.randomUUID();
    const status = optionalString(body.status) ?? 'scheduled';

    await c.env.D1_DB.prepare(
      `
      INSERT INTO jobs (
        id, tenant_id, property_id, client_id, job_type, scheduled_at, status, assigned_user_id, summary
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `.trim()
    )
      .bind(
        id,
        tenantId,
        propertyId.value,
        clientId.value,
        jobType.value,
        optionalString(body.scheduledAt),
        status,
        optionalString(body.assignedUserId),
        optionalString(body.summary)
      )
      .run();

    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(upsertJobSearchIndex(c.env.D1_DB, tenantId, id));
    } else {
      await upsertJobSearchIndex(c.env.D1_DB, tenantId, id);
    }

    return c.json({ id }, 201);
  });

  app.post('/ingest/notes', async (c) => {
    const tenantId = c.get('tenantId');
    const userId = c.get('userId');
    const idempotencyKey = optionalString(
      c.req.header('Idempotency-Key') ?? c.req.header('idempotency-key')
    );
    const body = await readJson(c);
    if (!body) {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const entityType = requiredString(body.entityType, 'entityType');
    if ('error' in entityType) {
      return c.json({ error: entityType.error }, 400);
    }
    const entityId = requiredString(body.entityId, 'entityId');
    if ('error' in entityId) {
      return c.json({ error: entityId.error }, 400);
    }
    const content = requiredString(body.content, 'content');
    if ('error' in content) {
      return c.json({ error: content.error }, 400);
    }
    const jobId = requiredString(body.jobId, 'jobId');
    if ('error' in jobId) {
      return c.json({ error: jobId.error }, 400);
    }

    const exists = await jobExists(c.env.D1_DB, tenantId, jobId.value);
    if (!exists) {
      return c.json({ error: 'Job not found' }, 404);
    }

    const id = optionalString(body.id) ?? crypto.randomUUID();
    const noteType = optionalString(body.noteType) ?? 'tech';

    const insert = await c.env.D1_DB.prepare(
      `
      INSERT ${idempotencyKey ? 'OR IGNORE' : ''} INTO notes (
        id,
        tenant_id,
        entity_type,
        entity_id,
        note_type,
        content,
        author_user_id,
        idempotency_key
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `.trim()
    )
      .bind(
        id,
        tenantId,
        entityType.value,
        entityId.value,
        noteType,
        content.value,
        userId,
        idempotencyKey
      )
      .run();

    if (idempotencyKey && (insert.meta?.changes ?? 0) === 0) {
      const existing = await c.env.D1_DB.prepare(
        `
        SELECT id
        FROM notes
        WHERE tenant_id = ? AND idempotency_key = ?
        `.trim()
      )
        .bind(tenantId, idempotencyKey)
        .first<{ id: string }>();

      if (existing?.id) {
        return c.json({ id: existing.id, idempotent: true }, 200);
      }

      return c.json({ error: 'Idempotency key already used' }, 409);
    }

    const reindex = async () => {
      await upsertJobSearchIndex(c.env.D1_DB, tenantId, jobId.value);
      if (!c.env.VECTORIZE_INDEX || !c.env.OPENAI_API_KEY) {
        return;
      }
      try {
        await reindexJobEvidence({
          db: c.env.D1_DB,
          vectorize: c.env.VECTORIZE_INDEX,
          openAiApiKey: c.env.OPENAI_API_KEY,
          tenantId,
          jobId: jobId.value,
        });
      } catch (error) {
        if (error instanceof JobNotFoundError) {
          console.error('Reindex skipped: job not found', error);
          return;
        }
        console.error('Failed to reindex job evidence:', error);
      }
    };

    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(reindex());
    } else {
      await reindex();
    }

    return c.json({ id }, 201);
  });
}
