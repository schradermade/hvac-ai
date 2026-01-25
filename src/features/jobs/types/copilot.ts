export type CopilotCitation = {
  doc_id: string;
  date?: string;
  type: 'note' | 'event' | 'job' | 'property' | 'client' | string;
  snippet: string;
};

export type JobCopilotResponse = {
  answer: string;
  citations: CopilotCitation[];
  follow_ups?: string[];
};
