CREATE VIRTUAL TABLE IF NOT EXISTS job_search_index USING fts5(
  job_id UNINDEXED,
  tenant_id UNINDEXED,
  content,
  updated_at UNINDEXED
);
