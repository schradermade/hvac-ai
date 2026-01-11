import { apiClient } from '@/lib/api';
import type { Example, ExampleFormData, ExampleFilters, ExampleListResponse } from '../types';

/**
 * Example service demonstrates best practices for service layer
 *
 * Key principles:
 * 1. No React dependencies (no hooks, no JSX)
 * 2. All public methods have JSDoc comments
 * 3. All public methods have explicit return types
 * 4. API responses are normalized to domain models
 * 5. Business logic is encapsulated in private methods
 */
class ExampleService {
  /**
   * Get all examples with optional filters
   */
  async getAll(filters?: ExampleFilters): Promise<ExampleListResponse> {
    const queryString = this.buildQueryString(filters);
    const response = await apiClient.get<ExampleListResponse>(`/examples?${queryString}`);
    return this.normalizeListResponse(response);
  }

  /**
   * Get example by ID
   */
  async getById(id: string): Promise<Example> {
    const response = await apiClient.get<Example>(`/examples/${id}`);
    return this.normalizeExample(response);
  }

  /**
   * Create new example
   */
  async create(data: ExampleFormData): Promise<Example> {
    const payload = this.buildCreatePayload(data);
    const response = await apiClient.post<Example>('/examples', payload);
    return this.normalizeExample(response);
  }

  /**
   * Update existing example
   */
  async update(id: string, data: Partial<ExampleFormData>): Promise<Example> {
    const payload = this.buildUpdatePayload(data);
    const response = await apiClient.put<Example>(`/examples/${id}`, payload);
    return this.normalizeExample(response);
  }

  /**
   * Delete example
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/examples/${id}`);
  }

  // Private helper methods

  /**
   * Build query string from filters
   */
  private buildQueryString(filters?: ExampleFilters): string {
    if (!filters) return '';

    const params = new URLSearchParams();

    if (filters.status) {
      params.append('status', filters.status);
    }

    if (filters.search) {
      params.append('search', filters.search);
    }

    return params.toString();
  }

  /**
   * Build payload for create request
   */
  private buildCreatePayload(data: ExampleFormData): Record<string, unknown> {
    return {
      title: data.title.trim(),
      description: data.description.trim(),
      status: data.status,
    };
  }

  /**
   * Build payload for update request
   */
  private buildUpdatePayload(data: Partial<ExampleFormData>): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (data.title !== undefined) {
      payload.title = data.title.trim();
    }

    if (data.description !== undefined) {
      payload.description = data.description.trim();
    }

    if (data.status !== undefined) {
      payload.status = data.status;
    }

    return payload;
  }

  /**
   * Normalize API response to domain model
   * This converts snake_case API responses to camelCase domain models
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeExample(raw: any): Example {
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      status: raw.status,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
    };
  }

  /**
   * Normalize list response
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private normalizeListResponse(raw: any): ExampleListResponse {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (raw.items || raw.data || []).map((item: any) => this.normalizeExample(item)),
      total: raw.total ?? 0,
      page: raw.page ?? 1,
      pageSize: raw.page_size ?? raw.pageSize ?? 20,
    };
  }
}

// Export singleton instance
export const exampleService = new ExampleService();
