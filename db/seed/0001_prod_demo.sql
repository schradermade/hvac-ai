PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO tenants (id, name, copilot_enabled)
VALUES ('tenant_demo', 'HVACOps Demo', 1);

INSERT OR IGNORE INTO clients (id, tenant_id, name, type, primary_phone, email)
VALUES
  ('client_demo_01', 'tenant_demo', 'Susan Smith', 'residential', '555-0101', 'susan.smith@example.com'),
  ('client_demo_02', 'tenant_demo', 'Marcus Lee', 'residential', '555-0102', 'marcus.lee@example.com'),
  ('client_demo_03', 'tenant_demo', 'Priya Patel', 'residential', '555-0103', 'priya.patel@example.com'),
  ('client_demo_04', 'tenant_demo', 'Elena Garcia', 'residential', '555-0104', 'elena.garcia@example.com'),
  ('client_demo_05', 'tenant_demo', 'Jordan Whitfield', 'residential', '555-0105', 'jordan.whitfield@example.com'),
  ('client_demo_06', 'tenant_demo', 'Daniel Kim', 'commercial', '555-0106', 'daniel.kim@example.com'),
  ('client_demo_07', 'tenant_demo', 'Alyssa Nguyen', 'residential', '555-0107', 'alyssa.nguyen@example.com'),
  ('client_demo_08', 'tenant_demo', 'Thomas Brooks', 'commercial', '555-0108', 'thomas.brooks@example.com'),
  ('client_demo_09', 'tenant_demo', 'Rosa Martinez', 'residential', '555-0109', 'rosa.martinez@example.com'),
  ('client_demo_10', 'tenant_demo', 'Henry Collins', 'residential', '555-0110', 'henry.collins@example.com');

INSERT OR IGNORE INTO properties (
  id, tenant_id, client_id, address_line1, address_line2, city, state, zip, access_notes
)
VALUES
  ('property_demo_01', 'tenant_demo', 'client_demo_01', '8421 Lakeview Dr', NULL, 'Austin', 'TX', '78745', 'Front gate code 1194.'),
  ('property_demo_02', 'tenant_demo', 'client_demo_02', '2603 Elmcrest Ave', NULL, 'Austin', 'TX', '78704', 'Garage access only.'),
  ('property_demo_03', 'tenant_demo', 'client_demo_03', '1129 Southridge Ct', NULL, 'Austin', 'TX', '78748', 'Call on arrival.'),
  ('property_demo_04', 'tenant_demo', 'client_demo_04', '4100 Rockwood Ln', NULL, 'Round Rock', 'TX', '78681', 'Side yard gate is sticky.'),
  ('property_demo_05', 'tenant_demo', 'client_demo_05', '77 Ridgepoint Blvd', 'Suite 220', 'Cedar Park', 'TX', '78613', 'Office HVAC room on 2nd floor.'),
  ('property_demo_06', 'tenant_demo', 'client_demo_06', '1500 Commerce St', 'Unit B', 'Austin', 'TX', '78701', 'Loading dock access required.'),
  ('property_demo_07', 'tenant_demo', 'client_demo_07', '3021 Meadowbrook Dr', NULL, 'Austin', 'TX', '78723', 'Dog on premises.'),
  ('property_demo_08', 'tenant_demo', 'client_demo_08', '908 Westlake Blvd', NULL, 'Austin', 'TX', '78746', 'Roof access via rear stairwell.'),
  ('property_demo_09', 'tenant_demo', 'client_demo_09', '2101 Juniper St', NULL, 'Pflugerville', 'TX', '78660', 'Filter sizes in closet.'),
  ('property_demo_10', 'tenant_demo', 'client_demo_10', '6450 Cedar Crest Rd', NULL, 'Austin', 'TX', '78747', 'Thermostat lockbox in hallway.');

INSERT OR IGNORE INTO jobs (
  id, tenant_id, property_id, client_id, job_type, scheduled_at, status, assigned_user_id, summary
)
VALUES
  ('job_demo_01', 'tenant_demo', 'property_demo_01', 'client_demo_01', 'maintenance', '2026-02-03T15:00:00Z', 'scheduled', NULL, 'Seasonal tune-up and filter replacement.'),
  ('job_demo_02', 'tenant_demo', 'property_demo_02', 'client_demo_02', 'repair', '2026-02-04T17:30:00Z', 'scheduled', NULL, 'No cool reported in master bedroom.'),
  ('job_demo_03', 'tenant_demo', 'property_demo_03', 'client_demo_03', 'maintenance', '2026-02-05T14:15:00Z', 'scheduled', NULL, 'Bi-annual system inspection.'),
  ('job_demo_04', 'tenant_demo', 'property_demo_04', 'client_demo_04', 'install', '2026-02-06T16:00:00Z', 'scheduled', NULL, 'Mini-split install consultation.'),
  ('job_demo_05', 'tenant_demo', 'property_demo_05', 'client_demo_05', 'maintenance', '2026-02-07T18:00:00Z', 'scheduled', NULL, 'Office HVAC maintenance visit.'),
  ('job_demo_06', 'tenant_demo', 'property_demo_06', 'client_demo_06', 'repair', '2026-02-08T13:00:00Z', 'scheduled', NULL, 'Rooftop unit fan noise investigation.'),
  ('job_demo_07', 'tenant_demo', 'property_demo_07', 'client_demo_07', 'maintenance', '2026-02-09T15:30:00Z', 'scheduled', NULL, 'Filter swap and coil cleaning.'),
  ('job_demo_08', 'tenant_demo', 'property_demo_08', 'client_demo_08', 'repair', '2026-02-10T19:00:00Z', 'scheduled', NULL, 'Thermostat offline; check wiring.'),
  ('job_demo_09', 'tenant_demo', 'property_demo_09', 'client_demo_09', 'maintenance', '2026-02-11T14:45:00Z', 'scheduled', NULL, 'Heat pump service visit.'),
  ('job_demo_10', 'tenant_demo', 'property_demo_10', 'client_demo_10', 'maintenance', '2026-02-12T16:30:00Z', 'scheduled', NULL, 'Preventative maintenance visit.');
