/**
 * Company Type Definitions
 *
 * Types for company entities in multi-tenant architecture
 */

/**
 * Company entity
 * Represents a HVAC company using the platform
 */
export interface Company {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Company form data for updates
 */
export interface CompanyFormData {
  name: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  website?: string;
}
