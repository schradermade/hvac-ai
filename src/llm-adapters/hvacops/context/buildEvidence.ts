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
  scope: 'job' | 'property' | 'client';
  date: string;
  text: string;
  authorName?: string | null;
  authorEmail?: string | null;
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
  author_name: string | null;
  author_email: string | null;
}

export async function getJobEvidence(
  db: D1DatabaseLike,
  tenantId: string,
  jobId: string,
  limit?: number
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

  const [jobEvents, jobNotes, propertyEvents, propertyNotes, clientNotes] = await Promise.all([
    loadJobEvents(db, tenantId, 'job_id', jobId, limit),
    loadNotes(db, tenantId, 'job', jobId, limit),
    loadJobEvents(db, tenantId, 'property_id', jobRow.property_id, limit),
    loadNotes(db, tenantId, 'property', jobRow.property_id, limit),
    loadNotes(db, tenantId, 'client', jobRow.client_id, limit),
  ]);

  const evidence: EvidenceItem[] = [
    ...jobEvents,
    ...jobNotes,
    ...propertyEvents,
    ...propertyNotes,
    ...clientNotes,
  ];

  evidence.sort((a, b) => b.date.localeCompare(a.date));

  return limit ? evidence.slice(0, limit) : evidence;
}

async function loadJobEvents(
  db: D1DatabaseLike,
  tenantId: string,
  column: 'job_id' | 'property_id',
  id: string,
  limit?: number
): Promise<EvidenceItem[]> {
  const scope = column === 'job_id' ? 'job' : 'property';
  const limitClause = typeof limit === 'number' ? 'LIMIT ?' : '';
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
      ${limitClause}
      `.trim()
    )
    .bind(...(typeof limit === 'number' ? [tenantId, id, limit] : [tenantId, id]))
    .all();

  return eventResults.results.map((row) => ({
    docId: row.id,
    type: 'job_event' as const,
    scope,
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
  limit?: number
): Promise<EvidenceItem[]> {
  const scope = entityType;
  const limitClause = typeof limit === 'number' ? 'LIMIT ?' : '';
  const noteResults = await db
    .prepare<NoteRow>(
      `
      SELECT
        n.id,
        n.note_type,
        n.content,
        n.created_at,
        TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS author_name,
        u.email AS author_email
      FROM notes n
      LEFT JOIN users u ON u.id = n.author_user_id
      WHERE n.tenant_id = ? AND n.entity_type = ? AND n.entity_id = ?
      ORDER BY n.created_at DESC
      ${limitClause}
      `.trim()
    )
    .bind(
      ...(typeof limit === 'number'
        ? [tenantId, entityType, entityId, limit]
        : [tenantId, entityType, entityId])
    )
    .all();

  return noteResults.results.map((row) => ({
    docId: row.id,
    type: 'note' as const,
    scope,
    date: row.created_at,
    text: row.content,
    authorName: row.author_name || null,
    authorEmail: row.author_email || null,
  }));
}
