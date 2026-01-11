// Types for diagnostic chat feature

/**
 * Role of the message sender
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Diagnostic mode
 * - expert: Quick answers for experienced techs
 * - guided: Step-by-step troubleshooting
 * - quick: Fast lookups and calculations
 */
export type DiagnosticMode = 'expert' | 'guided' | 'quick';

/**
 * A single message in the chat
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

/**
 * Equipment context for the diagnostic session
 */
export interface EquipmentContext {
  manufacturer?: string;
  modelNumber?: string;
  systemType?: 'split_system' | 'package_unit' | 'heat_pump' | 'mini_split' | 'other';
  refrigerant?: string;
  installDate?: Date;
}

/**
 * Chat session state
 */
export interface ChatSession {
  id: string;
  messages: Message[];
  mode: DiagnosticMode;
  equipmentContext?: EquipmentContext;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request to send a message
 */
export interface SendMessageRequest {
  content: string;
  mode?: DiagnosticMode;
  equipmentContext?: EquipmentContext;
}

/**
 * Response from AI
 */
export interface DiagnosticResponse {
  message: string;
  suggestions?: string[];
  confidence?: number;
}
