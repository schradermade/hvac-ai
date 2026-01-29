export type StoredMessage = {
  id: string;
  conversationId: string;
  tenantId: string;
  jobId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  source: string;
  model: string;
  promptVersion: string;
  metadataJson: string;
  contentHash: string;
};

export async function saveMessage(db: D1Database, message: StoredMessage): Promise<void> {
  await db
    .prepare(
      `
      INSERT INTO copilot_messages (
        id, conversation_id, tenant_id, job_id, user_id, role, content,
        source, model, prompt_version, metadata_json, content_hash
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `.trim()
    )
    .bind(
      message.id,
      message.conversationId,
      message.tenantId,
      message.jobId,
      message.userId,
      message.role,
      message.content,
      message.source,
      message.model,
      message.promptVersion,
      message.metadataJson,
      message.contentHash
    )
    .run();
}
