export type CopilotCitation = {
  doc_id: string;
  date?: string;
  type: 'note' | 'event' | 'job' | 'property' | 'client' | string;
  snippet: string;
};

export type JobCopilotResponse = {
  conversation_id?: string;
  answer: string;
  citations: CopilotCitation[];
  follow_ups?: string[];
  evidence?: Array<{
    doc_id: string;
    date?: string;
    type: string;
    scope?: string;
    text: string;
  }>;
};
