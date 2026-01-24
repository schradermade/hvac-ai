export interface D1PreparedStatement<T> {
  bind: (..._values: unknown[]) => D1PreparedStatement<T>;
  first: <R = T>() => Promise<R | null>;
  all: <R = T>() => Promise<{ results: R[] }>;
}

export interface D1DatabaseLike {
  prepare: <T = unknown>(_query: string) => D1PreparedStatement<T>;
}

export interface JobContextSnapshot {
  job: {
    id: string;
    jobType: string;
    scheduledAt: string | null;
    status: string;
    summary: string | null;
    assignedUser?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
  client: {
    id: string;
    name: string;
    type: string;
    primaryPhone: string | null;
    email: string | null;
  };
  property: {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    zip: string;
    accessNotes: string | null;
  };
  equipment: Array<{
    id: string;
    type: string;
    brand: string | null;
    model: string | null;
    serial: string | null;
    installedAt: string | null;
    warrantyExpiresAt: string | null;
  }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    issue: string | null;
    resolution: string | null;
    equipmentId: string | null;
    createdAt: string;
  }>;
  generatedAt: string;
}

export interface JobContextOptions {
  recentEventLimit?: number;
}

export class JobNotFoundError extends Error {
  tenantId: string;
  jobId: string;

  constructor(tenantId: string, jobId: string) {
    super(`Job not found for tenant ${tenantId}: ${jobId}`);
    this.name = 'JobNotFoundError';
    this.tenantId = tenantId;
    this.jobId = jobId;
  }
}

interface JobContextRow {
  job_id: string;
  job_type: string;
  scheduled_at: string | null;
  status: string;
  summary: string | null;
  assigned_user_id: string | null;
  assigned_first_name: string | null;
  assigned_last_name: string | null;
  client_id: string;
  client_name: string;
  client_type: string;
  client_primary_phone: string | null;
  client_email: string | null;
  property_id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  access_notes: string | null;
}

interface EquipmentRow {
  id: string;
  type: string;
  brand: string | null;
  model: string | null;
  serial: string | null;
  installed_at: string | null;
  warranty_expires_at: string | null;
}

interface JobEventRow {
  id: string;
  event_type: string;
  issue: string | null;
  resolution: string | null;
  equipment_id: string | null;
  created_at: string;
}

export async function getJobContextSnapshot(
  db: D1DatabaseLike,
  tenantId: string,
  jobId: string,
  options: JobContextOptions = {}
): Promise<JobContextSnapshot> {
  const recentEventLimit = options.recentEventLimit ?? 3;

  const jobRow = await db
    .prepare<JobContextRow>(
      `
      SELECT
        j.id AS job_id,
        j.job_type AS job_type,
        j.scheduled_at AS scheduled_at,
        j.status AS status,
        j.summary AS summary,
        j.assigned_user_id AS assigned_user_id,
        u.first_name AS assigned_first_name,
        u.last_name AS assigned_last_name,
        c.id AS client_id,
        c.name AS client_name,
        c.type AS client_type,
        c.primary_phone AS client_primary_phone,
        c.email AS client_email,
        p.id AS property_id,
        p.address_line1 AS address_line1,
        p.address_line2 AS address_line2,
        p.city AS city,
        p.state AS state,
        p.zip AS zip,
        p.access_notes AS access_notes
      FROM jobs j
      JOIN clients c ON c.id = j.client_id AND c.tenant_id = j.tenant_id
      JOIN properties p ON p.id = j.property_id AND p.tenant_id = j.tenant_id
      LEFT JOIN users u ON u.id = j.assigned_user_id AND u.tenant_id = j.tenant_id
      WHERE j.id = ? AND j.tenant_id = ?
      LIMIT 1
      `.trim()
    )
    .bind(jobId, tenantId)
    .first();

  if (!jobRow) {
    throw new JobNotFoundError(tenantId, jobId);
  }

  const equipmentResults = await db
    .prepare<EquipmentRow>(
      `
      SELECT
        id,
        type,
        brand,
        model,
        serial,
        installed_at,
        warranty_expires_at
      FROM equipment
      WHERE tenant_id = ? AND property_id = ?
      ORDER BY installed_at DESC
      `.trim()
    )
    .bind(tenantId, jobRow.property_id)
    .all();

  const eventResults = await db
    .prepare<JobEventRow>(
      `
      SELECT
        id,
        event_type,
        issue,
        resolution,
        equipment_id,
        created_at
      FROM job_events
      WHERE tenant_id = ? AND job_id = ?
      ORDER BY created_at DESC
      LIMIT ?
      `.trim()
    )
    .bind(tenantId, jobId, recentEventLimit)
    .all();

  return {
    job: {
      id: jobRow.job_id,
      jobType: jobRow.job_type,
      scheduledAt: jobRow.scheduled_at,
      status: jobRow.status,
      summary: jobRow.summary,
      assignedUser: jobRow.assigned_user_id
        ? {
            id: jobRow.assigned_user_id,
            firstName: jobRow.assigned_first_name,
            lastName: jobRow.assigned_last_name,
          }
        : null,
    },
    client: {
      id: jobRow.client_id,
      name: jobRow.client_name,
      type: jobRow.client_type,
      primaryPhone: jobRow.client_primary_phone,
      email: jobRow.client_email,
    },
    property: {
      id: jobRow.property_id,
      addressLine1: jobRow.address_line1,
      addressLine2: jobRow.address_line2,
      city: jobRow.city,
      state: jobRow.state,
      zip: jobRow.zip,
      accessNotes: jobRow.access_notes,
    },
    equipment: equipmentResults.results.map((row) => ({
      id: row.id,
      type: row.type,
      brand: row.brand,
      model: row.model,
      serial: row.serial,
      installedAt: row.installed_at,
      warrantyExpiresAt: row.warranty_expires_at,
    })),
    recentEvents: eventResults.results.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      issue: row.issue,
      resolution: row.resolution,
      equipmentId: row.equipment_id,
      createdAt: row.created_at,
    })),
    generatedAt: new Date().toISOString(),
  };
}
