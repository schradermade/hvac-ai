// Public API for diagnostic feature
// Only export what other features need to import

// Export types (type-only exports)
export type {
  Message,
  MessageRole,
  DiagnosticMode,
  EquipmentContext,
  ChatSession,
  DiagnosticSession,
  DiagnosticSessionListResponse,
  SendMessageRequest,
  DiagnosticResponse,
} from './types';

// Export hooks
export {
  useDiagnosticChat,
  useCreateSession,
  useSession,
  useSessionsByClient,
  useAllSessions,
  useAddMessageToSession,
  useCompleteSession,
} from './hooks/useDiagnostic';

// Export screens
export { DiagnosticChatScreen } from './screens/DiagnosticChatScreen';

// DO NOT export:
// - Services (other features should use hooks, not services directly)
// - Internal components (only screens are public)
// - Helper functions
