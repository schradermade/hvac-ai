export type RetrievalScope = {
  tenantId: string;
  jobId: string;
};

export type RetrievalEvidence = {
  docId: string;
  type: string;
  date?: string | null;
  text: string;
  score?: number;
};

export type RetrievalResult = {
  evidence: RetrievalEvidence[];
  debug?: Record<string, unknown>;
};

export interface Retriever {
  retrieve: (query: string, scope: RetrievalScope) => Promise<RetrievalResult>;
}
