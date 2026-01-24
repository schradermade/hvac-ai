export interface D1PreparedStatement<T> {
  bind: (..._values: unknown[]) => D1PreparedStatement<T>;
  first: <R = T>() => Promise<R | null>;
  all: <R = T>() => Promise<{ results: R[] }>;
}

export interface D1DatabaseLike {
  prepare: <T = unknown>(_query: string) => D1PreparedStatement<T>;
}

export interface EvidenceItem {
  docId: string;
  type: 'job_event' | 'note';
  date: string;
  text: string;
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
}

export async function getJobEvidence(
  db: D1DatabaseLike,
  tenantId: string,
  jobId: string,
  limit = 6
): Promise<EvidenceItem[]> {
  const jobRow = await db
    .prepare<{ property_id: string; client_id: string }>(
      `
      SELECT property_id, client_id
      FROM jobs
      WHERE tenant_id = ? AND id = ?
      LIMIT 1
      `.trim()
    )
    .bind(tenantId, jobId)
    .first();

  if (!jobRow) {
    return [];
  }

  const jobEvents = await loadJobEvents(db, tenantId, 'job_id', jobId, limit);
  const jobNotes = await loadNotes(db, tenantId, 'job', jobId, limit);

  let evidence: EvidenceItem[] = [...jobEvents, ...jobNotes];

  if (evidence.length < 3) {
    const propertyEvents = await loadJobEvents(
      db,
      tenantId,
      'property_id',
      jobRow.property_id,
      limit
    );
    const propertyNotes = await loadNotes(db, tenantId, 'property', jobRow.property_id, limit);
    evidence = [...evidence, ...propertyEvents, ...propertyNotes];
  }

  if (evidence.length < 3) {
    const clientNotes = await loadNotes(db, tenantId, 'client', jobRow.client_id, limit);
    evidence = [...evidence, ...clientNotes];
  }

  return evidence.slice(0, limit);
}

async function loadJobEvents(
  db: D1DatabaseLike,
  tenantId: string,
  column: 'job_id' | 'property_id',
  id: string,
  limit: number
): Promise<EvidenceItem[]> {
  const eventResults = await db
    .prepare<JobEventRow>(
      `
      SELECT
        id,
        event_type,
        issue,
        resolution,
        created_at
      FROM job_events
      WHERE tenant_id = ? AND ${column} = ?
      ORDER BY created_at DESC
      LIMIT ?
      `.trim()
    )
    .bind(tenantId, id, limit)
    .all();

  return eventResults.results.map((row) => ({
    docId: row.id,
    type: 'job_event' as const,
    date: row.created_at,
    text: [row.event_type, row.issue, row.resolution]
      .filter((value) => value && value.trim().length > 0)
      .join(' — '),
  }));
}

async function loadNotes(
  db: D1DatabaseLike,
  tenantId: string,
  entityType: 'job' | 'property' | 'client',
  entityId: string,
  limit: number
): Promise<EvidenceItem[]> {
  const noteResults = await db
    .prepare<NoteRow>(
      `
      SELECT
        id,
        note_type,
        content,
        created_at
      FROM notes
      WHERE tenant_id = ? AND entity_type = ? AND entity_id = ?
      ORDER BY created_at DESC
      LIMIT ?
      `.trim()
    )
    .bind(tenantId, entityType, entityId, limit)
    .all();

  return noteResults.results.map((row) => ({
    docId: row.id,
    type: 'note' as const,
    date: row.created_at,
    text: row.content,
  }));
}
