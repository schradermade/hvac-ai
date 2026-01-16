// Types for client management feature

import type { Auditable } from '@/lib/types';

/**
 * Special client ID for equipment migration
 * Equipment without a client will be assigned to this "Unassigned" client
 */
export const UNASSIGNED_CLIENT_ID = 'client_unassigned';

/**
 * Client entity
 * Represents a customer with contact information and service history
 */
export interface Client extends Auditable {
  id: string;
  companyId: string;

  // Required fields
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;

  // Optional fields
  secondaryPhone?: string;
  email?: string;
  homePurchaseDate?: Date;
  warrantyInfo?: string;
  serviceNotes?: string;
  petInfo?: string; // Information about pets (dogs, cats, etc.) for tech safety
}

/**
 * Client form data (without system-generated fields)
 * Used for create and update operations
 */
export interface ClientFormData {
  // Required fields
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;

  // Optional fields
  secondaryPhone?: string;
  email?: string;
  homePurchaseDate?: Date;
  warrantyInfo?: string;
  serviceNotes?: string;
  petInfo?: string;
}

/**
 * Filters for client list queries
 */
export interface ClientFilters {
  search?: string; // Search by name, phone, address
  city?: string;
  state?: string;
}

/**
 * Response for client list operations
 */
export interface ClientListResponse {
  items: Client[];
  total: number;
}
