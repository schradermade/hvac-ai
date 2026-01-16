/**
 * Auditable interface
 *
 * Add this to any entity that needs to track who created and modified it.
 * Provides full audit trail for accountability and compliance.
 */
export interface Auditable {
  /**
   * ID of the technician who created this record
   */
  createdBy: string;

  /**
   * Name of the technician who created this record
   * Cached for display purposes to avoid extra lookups
   */
  createdByName?: string;

  /**
   * Timestamp when this record was created
   */
  createdAt: Date;

  /**
   * ID of the technician who last modified this record
   */
  modifiedBy: string;

  /**
   * Name of the technician who last modified this record
   * Cached for display purposes to avoid extra lookups
   */
  modifiedByName?: string;

  /**
   * Timestamp when this record was last modified
   */
  updatedAt: Date;
}
