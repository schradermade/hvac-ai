import type { ChatMessage } from './types';
import { promptVersions, type PromptVersion } from './versions';

export type PromptContext = {
  snapshot: Record<string, unknown>;
  evidenceText: string;
  history: ChatMessage[];
  userMessage: string;
};

export function buildPrompt(version: PromptVersion, context: PromptContext): ChatMessage[] {
  const system = promptVersions[version]?.system ?? promptVersions['copilot.v1'].system;
  return [
    { role: 'system', content: system },
    {
      role: 'system',
      content: `Structured context:\n${JSON.stringify(
        context.snapshot
      )}\n\nEvidence (labeled sections):\n${context.evidenceText}`,
    },
    ...context.history,
    { role: 'user', content: context.userMessage },
  ];
}
