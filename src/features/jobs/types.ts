// Types for job/appointment management feature

import type { Auditable } from '@/lib/types';

/**
 * Job type categories
 */
export type JobType = 'maintenance' | 'repair' | 'installation' | 'inspection' | 'emergency';

/**
 * Job note entry (auditable timeline item)
 */
export type JobNote = {
  id: string;
  noteType: string;
  content: string;
  createdAt: Date;
  authorId?: string | null;
  authorName?: string | null;
  authorEmail?: string | null;
};

/**
 * Appointment status
 */
export type AppointmentStatus =
  | 'unassigned' // Not assigned to any technician
  | 'assigned' // Assigned but not accepted
  | 'accepted' // Tech accepted the job
  | 'declined' // Tech declined the job
  | 'scheduled' // Scheduled and ready
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

/**
 * Job assignment information
 */
export interface JobAssignment {
  technicianId: string;
  technicianName: string;
  assignedAt: Date;
  assignedBy: string; // Admin who assigned
  assignedByName: string;
  acceptedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
}

/**
 * Job/Appointment entity
 * Represents a scheduled service call
 */
export interface Job extends Auditable {
  id: string;
  companyId: string;
  clientId: string;
  equipmentId?: string; // Optional - may be multi-equipment or new install
  type: JobType;
  status: AppointmentStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  description: string;
  notes?: string;

  // Assignment info
  assignment?: JobAssignment;

  // Future sync preparation
  syncedAt?: Date;
  externalId?: string;
}

/**
 * Job form data (without system-generated fields)
 */
export interface JobFormData {
  clientId: string;
  equipmentId?: string;
  type: JobType;
  scheduledStart: Date;
  scheduledEnd: Date;
  description: string;
  notes?: string;
  assignedTechnicianId?: string;
}

/**
 * Filters for job list queries
 */
export interface JobFilters {
  clientId?: string;
  status?: AppointmentStatus;
  type?: JobType;
  assignedUserId?: string;
  search?: string;
  date?: Date;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Response for job list operations
 */
export interface JobListResponse {
  items: Job[];
  total: number;
}
