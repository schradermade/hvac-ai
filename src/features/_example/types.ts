// Example feature types
// This demonstrates how to define types for a feature

/**
 * Example item model
 * Represents a single example item in the system
 */
export interface Example {
  id: string;
  title: string;
  description: string;
  status: ExampleStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status of an example item
 */
export type ExampleStatus = 'draft' | 'published' | 'archived';

/**
 * Form data for creating/updating an example
 * This is separate from the main model because forms don't include
 * generated fields like id, createdAt, etc.
 */
export interface ExampleFormData {
  title: string;
  description: string;
  status: ExampleStatus;
}

/**
 * Filters for searching examples
 */
export interface ExampleFilters {
  status?: ExampleStatus;
  search?: string;
}

/**
 * API response for paginated list
 */
export interface ExampleListResponse {
  items: Example[];
  total: number;
  page: number;
  pageSize: number;
}
