type JobSearchSeedRow = {
  job_id: string;
  tenant_id: string;
  job_type: string;
  status: string;
  scheduled_at: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  assigned_user_email: string | null;
  client_id: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  property_id: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  access_notes: string | null;
};

type EquipmentRow = {
  type: string | null;
  brand: string | null;
  model: string | null;
  serial: string | null;
};

type NoteRow = {
  content: string;
};

type JobEventRow = {
  event_type: string | null;
  issue: string | null;
  resolution: string | null;
  parts_used_json: string | null;
};

function normalizeContent(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function combineParts(parts: Array<string | null | undefined>): string {
  return normalizeContent(parts.filter((part) => part && part.trim()).join(' '));
}

export function buildSearchQuery(raw: string): string | null {
  const tokens = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return null;
  }

  return tokens.map((token) => `${token}*`).join(' AND ');
}

export async function buildJobSearchContent(
  db: D1Database,
  tenantId: string,
  jobId: string
): Promise<string | null> {
  const job = await db
    .prepare(
      `
      SELECT
        j.id AS job_id,
        j.tenant_id,
        j.job_type,
        j.status,
        j.scheduled_at,
        j.summary,
        j.created_at,
        j.updated_at,
        j.assigned_user_id,
        NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') AS assigned_user_name,
        u.email AS assigned_user_email,
        j.client_id,
        c.name AS client_name,
        c.primary_phone AS client_phone,
        c.email AS client_email,
        j.property_id,
        p.address_line1,
        p.address_line2,
        p.city,
        p.state,
        p.zip,
        p.access_notes
      FROM jobs j
      LEFT JOIN users u
        ON u.id = j.assigned_user_id
       AND u.tenant_id = j.tenant_id
      LEFT JOIN clients c
        ON c.id = j.client_id
       AND c.tenant_id = j.tenant_id
      LEFT JOIN properties p
        ON p.id = j.property_id
       AND p.tenant_id = j.tenant_id
      WHERE j.tenant_id = ? AND j.id = ?
      LIMIT 1
      `.trim()
    )
    .bind(tenantId, jobId)
    .first<JobSearchSeedRow>();

  if (!job) {
    return null;
  }

  const equipment = await db
    .prepare(
      `
      SELECT type, brand, model, serial
      FROM equipment
      WHERE tenant_id = ? AND property_id = ?
      `.trim()
    )
    .bind(tenantId, job.property_id)
    .all<EquipmentRow>();

  const notes = await db
    .prepare(
      `
      SELECT content
      FROM notes
      WHERE tenant_id = ?
        AND (
          (entity_type = 'job' AND entity_id = ?)
          OR (entity_type = 'client' AND entity_id = ?)
          OR (entity_type = 'property' AND entity_id = ?)
        )
      ORDER BY created_at DESC
      `.trim()
    )
    .bind(tenantId, job.job_id, job.client_id, job.property_id)
    .all<NoteRow>();

  const events = await db
    .prepare(
      `
      SELECT event_type, issue, resolution, parts_used_json
      FROM job_events
      WHERE tenant_id = ? AND job_id = ?
      ORDER BY created_at DESC
      `.trim()
    )
    .bind(tenantId, job.job_id)
    .all<JobEventRow>();

  const equipmentText = equipment.results
    ?.map((row) => [row.type, row.brand, row.model, row.serial].filter(Boolean).join(' '))
    .join(' ');

  const notesText = notes.results?.map((row) => row.content).join(' ');

  const eventsText = events.results
    ?.map((row) =>
      [row.event_type, row.issue, row.resolution, row.parts_used_json].filter(Boolean).join(' ')
    )
    .join(' ');

  const content = combineParts([
    job.job_type,
    job.status,
    job.summary,
    job.scheduled_at,
    job.created_at,
    job.updated_at,
    job.assigned_user_name,
    job.assigned_user_email,
    job.client_name,
    job.client_phone,
    job.client_email,
    job.address_line1,
    job.address_line2,
    job.city,
    job.state,
    job.zip,
    job.access_notes,
    equipmentText,
    notesText,
    eventsText,
  ]);

  return content || null;
}

export async function upsertJobSearchIndex(
  db: D1Database,
  tenantId: string,
  jobId: string
): Promise<void> {
  const content = await buildJobSearchContent(db, tenantId, jobId);

  await db
    .prepare(
      `
      DELETE FROM job_search_index
      WHERE tenant_id = ? AND job_id = ?
      `.trim()
    )
    .bind(tenantId, jobId)
    .run();

  if (!content) {
    return;
  }

  await db
    .prepare(
      `
      INSERT INTO job_search_index (job_id, tenant_id, content, updated_at)
      VALUES (?, ?, ?, ?)
      `.trim()
    )
    .bind(jobId, tenantId, content, new Date().toISOString())
    .run();
}

export async function searchJobIds(
  db: D1Database,
  tenantId: string,
  rawQuery: string
): Promise<string[]> {
  const query = buildSearchQuery(rawQuery);
  if (!query) {
    return [];
  }

  const result = await db
    .prepare(
      `
      SELECT job_id
      FROM job_search_index
      WHERE tenant_id = ? AND job_search_index MATCH ?
      ORDER BY bm25(job_search_index)
      `.trim()
    )
    .bind(tenantId, query)
    .all<{ job_id: string }>();

  return result.results?.map((row) => row.job_id) ?? [];
}

async function fetchJobIds(
  db: D1Database,
  tenantId: string,
  clause: string,
  params: unknown[]
): Promise<string[]> {
  const result = await db
    .prepare(
      `
      SELECT id
      FROM jobs
      WHERE tenant_id = ? AND ${clause}
      `.trim()
    )
    .bind(tenantId, ...params)
    .all<{ id: string }>();

  return result.results?.map((row) => row.id) ?? [];
}

export async function reindexJobsByClient(
  db: D1Database,
  tenantId: string,
  clientId: string
): Promise<number> {
  const jobIds = await fetchJobIds(db, tenantId, 'client_id = ?', [clientId]);
  for (const jobId of jobIds) {
    await upsertJobSearchIndex(db, tenantId, jobId);
  }
  return jobIds.length;
}

export async function reindexJobsByProperty(
  db: D1Database,
  tenantId: string,
  propertyId: string
): Promise<number> {
  const jobIds = await fetchJobIds(db, tenantId, 'property_id = ?', [propertyId]);
  for (const jobId of jobIds) {
    await upsertJobSearchIndex(db, tenantId, jobId);
  }
  return jobIds.length;
}

export async function reindexJobsForTenant(db: D1Database, tenantId: string): Promise<number> {
  const jobIds = await fetchJobIds(db, tenantId, '1 = 1', []);
  for (const jobId of jobIds) {
    await upsertJobSearchIndex(db, tenantId, jobId);
  }
  return jobIds.length;
}
