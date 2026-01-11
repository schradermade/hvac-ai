// Public API for diagnostic feature
// Only export what other features need to import

// Export types (type-only exports)
export type {
  Message,
  MessageRole,
  DiagnosticMode,
  EquipmentContext,
  ChatSession,
  SendMessageRequest,
  DiagnosticResponse,
} from './types';

// Export hooks
export { useDiagnosticChat } from './hooks/useDiagnostic';

// Export screens
export { DiagnosticChatScreen } from './screens/DiagnosticChatScreen';

// DO NOT export:
// - Services (other features should use hooks, not services directly)
// - Internal components (only screens are public)
// - Helper functions
