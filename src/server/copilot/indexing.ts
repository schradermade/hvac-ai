import { fetchOpenAIEmbedding } from './vectorize';

/* eslint-disable no-unused-vars */
export interface D1PreparedStatement<T> {
  bind: (..._args: unknown[]) => D1PreparedStatement<T>;
  first: <R = T>() => Promise<R | null>;
  all: <R = T>() => Promise<{ results: R[] }>;
}

export interface D1DatabaseLike {
  prepare: <T = unknown>(..._args: unknown[]) => D1PreparedStatement<T>;
}

export interface VectorizeIndex {
  upsert: (
    ..._args: [Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }>]
  ) => Promise<void>;
}
/* eslint-enable no-unused-vars */

interface JobRow {
  property_id: string;
  client_id: string;
}

interface JobEventRow {
  id: string;
  event_type: string;
  issue: string | null;
  resolution: string | null;
  created_at: string;
}

interface NoteRow {
  id: string;
  note_type: string;
  content: string;
  created_at: string;
  entity_type: string;
  entity_id: string;
}

export async function reindexJobEvidence(params: {
  db: D1DatabaseLike;
  vectorize: VectorizeIndex;
  openAiApiKey: string;
  tenantId: string;
  jobId: string;
  limit?: number;
}) {
  const { db, vectorize, openAiApiKey, tenantId, jobId } = params;
  const limit = params.limit ?? 50;

  const job = await db
    .prepare<JobRow>(
      `
      SELECT property_id, client_id
      FROM jobs
      WHERE tenant_id = ? AND id = ?
      LIMIT 1
      `.trim()
    )
    .bind(tenantId, jobId)
    .first();

  if (!job) {
    throw new Error(`Job not found for tenant ${tenantId}: ${jobId}`);
  }

  const events = await db
    .prepare<JobEventRow>(
      `
      SELECT id, event_type, issue, resolution, created_at
      FROM job_events
      WHERE tenant_id = ? AND job_id = ?
      ORDER BY created_at DESC
      LIMIT ?
      `.trim()
    )
    .bind(tenantId, jobId, limit)
    .all();

  const notes = await db
    .prepare<NoteRow>(
      `
      SELECT id, note_type, content, created_at, entity_type, entity_id
      FROM notes
      WHERE tenant_id = ? AND entity_type IN ('job','property','client')
        AND entity_id IN (?, ?, ?)
      ORDER BY created_at DESC
      LIMIT ?
      `.trim()
    )
    .bind(tenantId, jobId, job.property_id, job.client_id, limit)
    .all();

  const records = [
    ...events.results.map((row) => ({
      id: `job_event_${row.id}`,
      type: 'job_event',
      text: [row.event_type, row.issue, row.resolution]
        .filter((value) => value && value.trim().length > 0)
        .join(' — '),
      createdAt: row.created_at,
    })),
    ...notes.results.map((row) => ({
      id: `note_${row.id}`,
      type: 'note',
      text: row.content,
      createdAt: row.created_at,
    })),
  ].filter((record) => record.text.length > 0);

  const upserts = [] as Array<{ id: string; values: number[]; metadata: Record<string, unknown> }>;

  for (const record of records) {
    const embedding = await fetchOpenAIEmbedding(openAiApiKey, record.text);
    const vector = embedding.data[0]?.embedding;
    if (!vector) {
      continue;
    }

    upserts.push({
      id: record.id,
      values: vector,
      metadata: {
        tenant_id: tenantId,
        job_id: jobId,
        property_id: job.property_id,
        client_id: job.client_id,
        type: record.type,
        doc_id: record.id,
        created_at: record.createdAt,
        text: record.text,
      },
    });
  }

  if (upserts.length > 0) {
    await vectorize.upsert(upserts);
  }

  return { indexed: upserts.length };
}
