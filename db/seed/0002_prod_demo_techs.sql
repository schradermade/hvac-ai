PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO users (id, tenant_id, first_name, last_name, email, role)
VALUES
  ('tech_demo_01', 'tenant_demo', 'Avery', 'Reed', 'avery.reed@hvacops.demo', 'technician'),
  ('tech_demo_02', 'tenant_demo', 'Noah', 'Brooks', 'noah.brooks@hvacops.demo', 'technician'),
  ('tech_demo_03', 'tenant_demo', 'Maya', 'Lopez', 'maya.lopez@hvacops.demo', 'technician'),
  ('tech_demo_04', 'tenant_demo', 'Ethan', 'Park', 'ethan.park@hvacops.demo', 'lead_tech'),
  ('tech_demo_05', 'tenant_demo', 'Sofia', 'Nguyen', 'sofia.nguyen@hvacops.demo', 'technician');

UPDATE jobs SET assigned_user_id = 'tech_demo_01'
WHERE tenant_id = 'tenant_demo' AND id IN ('job_demo_01', 'job_demo_06');

UPDATE jobs SET assigned_user_id = 'tech_demo_02'
WHERE tenant_id = 'tenant_demo' AND id IN ('job_demo_02', 'job_demo_07');

UPDATE jobs SET assigned_user_id = 'tech_demo_03'
WHERE tenant_id = 'tenant_demo' AND id IN ('job_demo_03', 'job_demo_08');

UPDATE jobs SET assigned_user_id = 'tech_demo_04'
WHERE tenant_id = 'tenant_demo' AND id IN ('job_demo_04', 'job_demo_09');

UPDATE jobs SET assigned_user_id = 'tech_demo_05'
WHERE tenant_id = 'tenant_demo' AND id IN ('job_demo_05', 'job_demo_10');
