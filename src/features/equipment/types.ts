/**
 * Equipment Feature Types
 *
 * Data models for HVAC equipment profiles
 */

/**
 * System type categories
 */
export type SystemType = 'split_system' | 'package_unit' | 'heat_pump' | 'mini_split' | 'other';

/**
 * Equipment entity
 *
 * Represents a saved HVAC unit with specifications
 */
export interface Equipment {
  id: string;
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form data for creating/updating equipment
 */
export interface EquipmentFormData {
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
