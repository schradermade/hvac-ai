export interface D1PreparedStatement<T> {
  // eslint-disable-next-line no-unused-vars
  bind: (..._values: unknown[]) => D1PreparedStatement<T>;
  first: <R = T>() => Promise<R | null>;
  all: <R = T>() => Promise<{ results: R[] }>;
}

export interface D1DatabaseLike {
  // eslint-disable-next-line no-unused-vars
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
      WHERE tenant_id = ? AND job_id = ?
      ORDER BY created_at DESC
      LIMIT ?
      `.trim()
    )
    .bind(tenantId, jobId, limit)
    .all();

  const noteResults = await db
    .prepare<NoteRow>(
      `
      SELECT
        id,
        note_type,
        content,
        created_at
      FROM notes
      WHERE tenant_id = ? AND entity_type = 'job' AND entity_id = ?
      ORDER BY created_at DESC
      LIMIT ?
      `.trim()
    )
    .bind(tenantId, jobId, limit)
    .all();

  const events = eventResults.results.map((row) => ({
    docId: row.id,
    type: 'job_event' as const,
    date: row.created_at,
    text: [row.event_type, row.issue, row.resolution]
      .filter((value) => value && value.trim().length > 0)
      .join(' — '),
  }));

  const notes = noteResults.results.map((row) => ({
    docId: row.id,
    type: 'note' as const,
    date: row.created_at,
    text: row.content,
  }));

  return [...events, ...notes].slice(0, limit);
}
