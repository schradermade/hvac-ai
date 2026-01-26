PRAGMA foreign_keys = ON;

ALTER TABLE copilot_messages ADD COLUMN source TEXT NOT NULL DEFAULT 'app';
ALTER TABLE copilot_messages ADD COLUMN model TEXT;
ALTER TABLE copilot_messages ADD COLUMN prompt_version TEXT;
ALTER TABLE copilot_messages ADD COLUMN metadata_json TEXT;
ALTER TABLE copilot_messages ADD COLUMN content_hash TEXT NOT NULL DEFAULT '';
