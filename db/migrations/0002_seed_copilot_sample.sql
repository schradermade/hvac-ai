PRAGMA foreign_keys = ON;

INSERT INTO tenants (id, name, status, copilot_enabled)
VALUES ('tenant_demo', 'Demo HVAC Co', 'active', 1);

INSERT INTO users (id, tenant_id, first_name, last_name, email, role, phone)
VALUES (
  'user_demo',
  'tenant_demo',
  'Alex',
  'Rivera',
  'alex@demo-hvac.com',
  'technician',
  '555-555-0101'
);

INSERT INTO clients (id, tenant_id, name, type, primary_phone, email, tags_json)
VALUES (
  'client_demo',
  'tenant_demo',
  'Jordan Whitfield',
  'residential',
  '555-555-0123',
  'jordan@example.com',
  '["priority","maintenance-plan"]'
);

INSERT INTO properties (
  id,
  tenant_id,
  client_id,
  address_line1,
  address_line2,
  city,
  state,
  zip,
  access_notes
)
VALUES (
  'property_demo',
  'tenant_demo',
  'client_demo',
  '123 Oak Street',
  NULL,
  'Austin',
  'TX',
  '78701',
  'Gate code 4521. Indoor unit in attic.'
);

INSERT INTO equipment (
  id,
  tenant_id,
  property_id,
  type,
  brand,
  model,
  serial,
  installed_at,
  installed_by,
  warranty_expires_at,
  metadata_json
)
VALUES (
  'equip_demo_1',
  'tenant_demo',
  'property_demo',
  'heat_pump',
  'Trane',
  'XR16',
  'TRN-AX16-00921',
  '2021-05-14',
  'Demo HVAC Co',
  '2031-05-14',
  '{"tonnage":3,"refrigerant":"R-410A"}'
);

INSERT INTO jobs (
  id,
  tenant_id,
  property_id,
  client_id,
  job_type,
  scheduled_at,
  status,
  assigned_user_id,
  summary
)
VALUES (
  'job_demo',
  'tenant_demo',
  'property_demo',
  'client_demo',
  'maintenance',
  '2025-02-10T14:00:00Z',
  'scheduled',
  'user_demo',
  'Seasonal maintenance and filter replacement check.'
);

INSERT INTO job_events (
  id,
  tenant_id,
  job_id,
  property_id,
  client_id,
  equipment_id,
  event_type,
  issue,
  resolution,
  parts_used_json,
  created_at
)
VALUES (
  'event_demo_1',
  'tenant_demo',
  'job_demo',
  'property_demo',
  'client_demo',
  'equip_demo_1',
  'maintenance',
  'Filter heavily soiled; airflow reduced.',
  'Replaced filter and advised quarterly changes.',
  '["16x25x1 filter"]',
  '2024-11-12T17:30:00Z'
);

INSERT INTO notes (
  id,
  tenant_id,
  entity_type,
  entity_id,
  note_type,
  content,
  author_user_id,
  created_at
)
VALUES (
  'note_demo_1',
  'tenant_demo',
  'job',
  'job_demo',
  'tech',
  'Homeowner reported intermittent rattling from the air handler. Recommended tightening blower mount at next visit.',
  'user_demo',
  '2024-11-12T17:40:00Z'
);
