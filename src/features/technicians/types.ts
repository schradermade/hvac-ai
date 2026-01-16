/**
 * Technician Type Definitions
 *
 * Types for technician entities and certifications
 */

/**
 * Technician roles in the system
 */
export type TechnicianRole = 'admin' | 'lead_tech' | 'technician' | 'office_staff';

/**
 * Technician status
 */
export type TechnicianStatus = 'active' | 'inactive' | 'on_leave';

/**
 * Certification types
 */
export type CertificationType = 'epa_608' | 'nate' | 'manufacturer' | 'other';

/**
 * Certification entity
 */
export interface Certification {
  type: CertificationType;
  name: string;
  number?: string;
  issuedDate?: Date;
  expiryDate?: Date;
  issuer?: string;
}

/**
 * Technician entity
 */
export interface Technician {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: TechnicianRole;
  status: TechnicianStatus;
  certifications: Certification[];
  licenseNumber?: string;
  licenseExpiry?: Date;
  hireDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Form data for creating/updating technician
 */
export interface TechnicianFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: TechnicianRole;
  status: TechnicianStatus;
  certifications: Certification[];
  licenseNumber?: string;
  licenseExpiry?: Date;
  hireDate?: Date;
  notes?: string;
}

/**
 * Filter options for technician list
 */
export interface TechnicianFilters {
  status?: TechnicianStatus;
  role?: TechnicianRole;
  search?: string;
}

/**
 * Technician list response
 */
export interface TechnicianListResponse {
  technicians: Technician[];
  total: number;
}
