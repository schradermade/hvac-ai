/**
 * Equipment Feature Types
 *
 * Data models for HVAC equipment profiles
 */

import type { Auditable } from '@/lib/types';

// Re-export UNASSIGNED_CLIENT_ID for convenience
export { UNASSIGNED_CLIENT_ID } from '@/features/clients';

/**
 * System type categories
 */
export type SystemType = 'split_system' | 'package_unit' | 'heat_pump' | 'mini_split' | 'other';

/**
 * Equipment entity
 *
 * Represents a saved HVAC unit with specifications
 * Now belongs to a client
 */
export interface Equipment extends Auditable {
  id: string;
  companyId: string;
  clientId: string; // Equipment belongs to a client
  name: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  systemType: SystemType;
  refrigerant?: string;
  tonnage?: number;
  installDate?: Date;
  location?: string;
  notes?: string;
}

/**
 * Form data for creating/updating equipment
 * Now requires clientId
 */
export interface EquipmentFormData {
  clientId: string; // Required - equipment must belong to a client
  name: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  systemType: SystemType;
  refrigerant?: string;
  tonnage?: number;
  installDate?: Date;
  location?: string;
  notes?: string;
}

/**
 * Equipment list with pagination
 */
export interface EquipmentListResponse {
  items: Equipment[];
  total: number;
}

/**
 * Filters for equipment list
 */
export interface EquipmentFilters {
  systemType?: SystemType;
  manufacturer?: string;
  search?: string;
}
