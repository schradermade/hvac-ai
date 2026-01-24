PRAGMA foreign_keys = ON;

-- Cloudflare Access identity mapping
CREATE TABLE IF NOT EXISTS access_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_access_identities_issuer_subject
  ON access_identities(issuer, subject);

CREATE INDEX IF NOT EXISTS idx_access_identities_user
  ON access_identities(user_id);
