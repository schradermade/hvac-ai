import type { Job, JobFormData, JobFilters, JobListResponse } from '../types';

/**
 * Service for job/appointment management operations
 *
 * Currently uses in-memory storage for MVP
 * Will be replaced with real API integration later
 */
class JobService {
  private jobs: Map<string, Job> = new Map();
  private idCounter = 0;

  /**
   * Get today's scheduled jobs
   */
  async getTodaysJobs(): Promise<JobListResponse> {
    await this.delay(300);

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const items = Array.from(this.jobs.values())
      .filter((job) => {
        const scheduled = job.scheduledStart;
        return scheduled >= startOfDay && scheduled <= endOfDay;
      })
      .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Get all jobs with optional filtering
   */
  async getAll(filters?: JobFilters): Promise<JobListResponse> {
    await this.delay(300);

    let items = Array.from(this.jobs.values());

    // Apply filters
    if (filters?.clientId) {
      items = items.filter((job) => job.clientId === filters.clientId);
    }

    if (filters?.status) {
      items = items.filter((job) => job.status === filters.status);
    }

    if (filters?.type) {
      items = items.filter((job) => job.type === filters.type);
    }

    // Sort by scheduled start time
    items.sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Get job by ID
   */
  async getById(id: string): Promise<Job> {
    await this.delay(200);

    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Job with id ${id} not found`);
    }

    return job;
  }

  /**
   * Get jobs by client
   */
  async getByClient(clientId: string): Promise<JobListResponse> {
    return this.getAll({ clientId });
  }

  /**
   * Create a new job
   */
  async create(data: JobFormData): Promise<Job> {
    await this.delay(400);

    this.idCounter++;
    const now = new Date();

    const job: Job = {
      id: `job_${this.idCounter}`,
      ...data,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Update an existing job
   */
  async update(id: string, data: Partial<JobFormData>): Promise<Job> {
    await this.delay(400);

    const existing = await this.getById(id);

    const updated: Job = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    this.jobs.set(id, updated);
    return updated;
  }

  /**
   * Delete a job
   */
  async delete(id: string): Promise<void> {
    await this.delay(300);

    const job = await this.getById(id);
    if (!job) {
      throw new Error(`Job with id ${id} not found`);
    }

    this.jobs.delete(id);
  }

  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const jobService = new JobService();
