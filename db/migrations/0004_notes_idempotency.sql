ALTER TABLE notes
  ADD COLUMN idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_tenant_idempotency
  ON notes(tenant_id, idempotency_key);
