PRAGMA foreign_keys = ON;

-- Tenants (companies/accounts)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  copilot_enabled INTEGER NOT NULL DEFAULT 0,
  features_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Users (techs, office staff)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technician',
  phone TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_email
  ON users(tenant_id, email);

-- Clients (customers)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'residential',
  primary_phone TEXT,
  email TEXT,
  tags_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clients_tenant
  ON clients(tenant_id);

-- Properties (service locations)
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  lat REAL,
  lng REAL,
  access_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_properties_tenant_client
  ON properties(tenant_id, client_id);

-- Equipment (units at a property)
CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial TEXT,
  installed_at TEXT,
  installed_by TEXT,
  warranty_expires_at TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_equipment_tenant_property
  ON equipment(tenant_id, property_id);

-- Jobs (work orders)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  job_type TEXT NOT NULL,
  scheduled_at TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  assigned_user_id TEXT,
  summary TEXT,
  related_job_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (related_job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_scheduled
  ON jobs(tenant_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_client
  ON jobs(tenant_id, client_id);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_property
  ON jobs(tenant_id, property_id);

-- Job events (service history)
CREATE TABLE IF NOT EXISTS job_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  equipment_id TEXT,
  event_type TEXT NOT NULL,
  issue TEXT,
  resolution TEXT,
  parts_used_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_job_events_tenant_job
  ON job_events(tenant_id, job_id);

CREATE INDEX IF NOT EXISTS idx_job_events_tenant_property
  ON job_events(tenant_id, property_id);

CREATE INDEX IF NOT EXISTS idx_job_events_tenant_equipment
  ON job_events(tenant_id, equipment_id);

-- Notes (unstructured)
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'tech',
  content TEXT NOT NULL,
  author_user_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_tenant_entity
  ON notes(tenant_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notes_tenant_created
  ON notes(tenant_id, created_at);
