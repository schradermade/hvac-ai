export type ConversationRecord = {
  id: string;
  tenantId: string;
  jobId: string;
  userId: string;
};

export async function findConversation(
  db: D1Database,
  tenantId: string,
  jobId: string,
  userId: string
): Promise<ConversationRecord | null> {
  return db
    .prepare(
      `
      SELECT id, tenant_id, job_id, user_id
      FROM copilot_conversations
      WHERE tenant_id = ? AND job_id = ? AND user_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
      `.trim()
    )
    .bind(tenantId, jobId, userId)
    .first<ConversationRecord>();
}

export async function findConversationById(
  db: D1Database,
  tenantId: string,
  conversationId: string
): Promise<ConversationRecord | null> {
  return db
    .prepare(
      `
      SELECT id, tenant_id, job_id, user_id
      FROM copilot_conversations
      WHERE tenant_id = ? AND id = ?
      LIMIT 1
      `.trim()
    )
    .bind(tenantId, conversationId)
    .first<ConversationRecord>();
}

export async function ensureConversation(
  db: D1Database,
  record: ConversationRecord
): Promise<void> {
  const result = await db
    .prepare(
      `
      INSERT INTO copilot_conversations (id, tenant_id, job_id, user_id)
      VALUES (?, ?, ?, ?)
      `.trim()
    )
    .bind(record.id, record.tenantId, record.jobId, record.userId)
    .run();

  if (result.meta.changes > 1) {
    throw new Error(`Unexpected insert behavior: ${result.meta.changes} rows affected`);
  }
}

export async function touchConversation(db: D1Database, id: string): Promise<void> {
  const result = await db
    .prepare(
      `
      UPDATE copilot_conversations
      SET updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      WHERE id = ?
      `.trim()
    )
    .bind(id)
    .run();

  if (result.meta.changes !== 1) {
    throw new Error(`Touch failed: conversation ${id} not found`);
  }
}
