// Types for diagnostic chat feature

import type { Auditable } from '@/lib/types';

/**
 * Role of the message sender
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Participant role in collaborative session
 */
export type ParticipantRole = 'primary' | 'invited' | 'ai';

/**
 * Diagnostic mode
 * - expert: Quick answers for experienced techs
 * - guided: Step-by-step troubleshooting
 * - quick: Fast lookups and calculations
 */
export type DiagnosticMode = 'expert' | 'guided' | 'quick';

/**
 * Participant in a diagnostic session
 */
export interface Participant {
  id: string; // 'ai' or technician ID
  role: ParticipantRole;
  name: string;
  joinedAt: Date;
  leftAt?: Date;
}

/**
 * A single message in the chat
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  sources?: Array<{
    snippet: string;
    date?: string;
    type?: string;
  }>;

  // Sender attribution for collaborative sessions
  senderId?: string; // Technician ID (undefined for AI)
  senderName?: string;
  senderRole?: ParticipantRole;
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
 * Chat session state (legacy - used by current UI)
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
 * Diagnostic session with full job context
 * Connected to the job-client-equipment hierarchy
 */
export interface DiagnosticSession extends Auditable {
  id: string;
  companyId: string;
  clientId: string; // REQUIRED - every diagnostic is for a client
  jobId?: string; // Optional - may be standalone diagnostic
  equipmentId?: string; // Optional - may be general consultation
  messages: Message[];
  mode: DiagnosticMode;
  summary?: string; // Auto-generated or manual summary of the session
  completedAt?: Date; // When the session was marked complete

  // Collaborative features
  participants: Participant[]; // Includes AI and all technicians
  isCollaborative: boolean; // True if more than 1 human participant
}

/**
 * Response containing list of sessions
 */
export interface DiagnosticSessionListResponse {
  items: DiagnosticSession[];
  total: number;
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
