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

  constructor() {
    // Initialize with test jobs for development
    this.createTestJobs();
  }

  /**
   * Create test jobs for development/testing
   */
  private createTestJobs(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const testJobs: Job[] = [
      {
        companyId: 'company_test_1',
        id: 'job_test_1',
        clientId: 'client_test_1',
        type: 'maintenance',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 8:00 AM
        scheduledEnd: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
        description: 'Annual HVAC maintenance check',
        notes: 'Check filters, coils, and refrigerant levels',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_2',
        clientId: 'client_test_2',
        type: 'repair',
        status: 'in_progress',
        scheduledStart: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM
        scheduledEnd: new Date(today.getTime() + 11 * 60 * 60 * 1000),
        description: 'AC not cooling properly',
        notes: 'Customer reports warm air from vents',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_3',
        clientId: 'client_test_3',
        type: 'installation',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
        scheduledEnd: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        description: 'Install new 3-ton split system',
        notes: 'New construction, all materials on site',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_4',
        clientId: 'client_test_4',
        type: 'inspection',
        status: 'completed',
        scheduledStart: new Date(today.getTime() + 7 * 60 * 60 * 1000), // 7:00 AM
        scheduledEnd: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        description: 'Pre-season inspection',
        notes: 'All systems operational, minor filter replacement needed',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_5',
        clientId: 'client_test_5',
        type: 'emergency',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 11 * 60 * 60 * 1000), // 11:00 AM
        scheduledEnd: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        description: 'No heat - emergency service',
        notes: 'Customer has elderly occupant, priority service',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_6',
        clientId: 'client_test_6',
        type: 'maintenance',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00 PM
        scheduledEnd: new Date(today.getTime() + 13 * 60 * 60 * 1000 + 30 * 60 * 1000),
        description: 'Quarterly maintenance visit',
        notes: 'Commercial property, coordinate with property manager',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_7',
        clientId: 'client_test_7',
        type: 'repair',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 13 * 60 * 60 * 1000), // 1:00 PM
        scheduledEnd: new Date(today.getTime() + 15 * 60 * 60 * 1000),
        description: 'Strange noise from outdoor unit',
        notes: 'Possible compressor or fan issue',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_8',
        clientId: 'client_test_8',
        type: 'maintenance',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
        scheduledEnd: new Date(today.getTime() + 15 * 60 * 60 * 1000 + 30 * 60 * 1000),
        description: 'Spring tune-up service',
        notes: 'Historic home, special care required',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_9',
        clientId: 'client_test_9',
        type: 'inspection',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3:00 PM
        scheduledEnd: new Date(today.getTime() + 16 * 60 * 60 * 1000),
        description: 'Home sale inspection',
        notes: 'Buyer requested inspection before closing',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_10',
        clientId: 'client_test_10',
        type: 'repair',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 4:00 PM
        scheduledEnd: new Date(today.getTime() + 17 * 60 * 60 * 1000 + 30 * 60 * 1000),
        description: 'Water leak from indoor unit',
        notes: 'Possible condensate drain clog',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_11',
        clientId: 'client_test_11',
        type: 'installation',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 8 * 60 * 60 * 1000 + 30 * 60 * 1000), // 8:30 AM
        scheduledEnd: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 30 * 60 * 1000),
        description: 'Replace old furnace with high-efficiency model',
        notes: 'Large property, may need additional time',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_12',
        clientId: 'client_test_12',
        type: 'maintenance',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 30 * 60 * 1000), // 9:30 AM
        scheduledEnd: new Date(today.getTime() + 11 * 60 * 60 * 1000),
        description: 'Fall maintenance service',
        notes: 'Customer prefers afternoon appointments',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_13',
        clientId: 'client_test_13',
        type: 'repair',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 10 * 60 * 60 * 1000 + 30 * 60 * 1000), // 10:30 AM
        scheduledEnd: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        description: 'Thermostat not responding',
        notes: 'May need replacement',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_14',
        clientId: 'client_test_14',
        type: 'inspection',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 11 * 60 * 60 * 1000 + 30 * 60 * 1000), // 11:30 AM
        scheduledEnd: new Date(today.getTime() + 12 * 60 * 60 * 1000 + 30 * 60 * 1000),
        description: 'Building code compliance inspection',
        notes: 'Condo building, coordinate with property manager',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_15',
        clientId: 'client_test_15',
        type: 'maintenance',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 13 * 60 * 60 * 1000 + 30 * 60 * 1000), // 1:30 PM
        scheduledEnd: new Date(today.getTime() + 15 * 60 * 60 * 1000),
        description: 'End of warranty maintenance',
        notes: 'Maintenance contract expires next month',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_16',
        clientId: 'client_test_16',
        type: 'repair',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 14 * 60 * 60 * 1000 + 30 * 60 * 1000), // 2:30 PM
        scheduledEnd: new Date(today.getTime() + 16 * 60 * 60 * 1000),
        description: 'System short cycling',
        notes: 'Recently purchased home, full inspection needed',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_17',
        clientId: 'client_test_17',
        type: 'emergency',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 15 * 60 * 60 * 1000 + 30 * 60 * 1000), // 3:30 PM
        scheduledEnd: new Date(today.getTime() + 17 * 60 * 60 * 1000),
        description: 'Complete system failure',
        notes: 'VIP client, priority service',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_18',
        clientId: 'client_test_18',
        type: 'maintenance',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 16 * 60 * 60 * 1000 + 30 * 60 * 1000), // 4:30 PM
        scheduledEnd: new Date(today.getTime() + 17 * 60 * 60 * 1000 + 30 * 60 * 1000),
        description: 'Rental property inspection',
        notes: 'Contact owner for major repairs',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_19',
        clientId: 'client_test_19',
        type: 'installation',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 7 * 60 * 60 * 1000 + 30 * 60 * 1000), // 7:30 AM
        scheduledEnd: new Date(today.getTime() + 11 * 60 * 60 * 1000 + 30 * 60 * 1000),
        description: 'Install mini-split system',
        notes: 'Office building, service during business hours only',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_20',
        clientId: 'client_test_20',
        type: 'repair',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5:00 PM
        scheduledEnd: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        description: 'Smart thermostat integration issue',
        notes: 'App access available for remote diagnostics',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
      {
        companyId: 'company_test_1',
        id: 'job_test_21',
        clientId: 'client_test_22',
        type: 'maintenance',
        status: 'scheduled',
        scheduledStart: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
        scheduledEnd: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00 PM
        description: 'Annual HVAC system inspection',
        notes: 'Text client before arrival. Large dog on property - see client pet info.',
        createdBy: 'tech_test_admin',

        createdByName: 'Test Admin',

        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',

        modifiedByName: 'Test Admin',

        updatedAt: new Date(),
      },
    ];

    testJobs.forEach((job) => {
      this.jobs.set(job.id, job);
    });

    this.idCounter = 21; // Set counter since we used job_test_1 through job_test_21
  }

  /**
   * Get today's scheduled jobs for a company
   */
  async getTodaysJobs(companyId: string): Promise<JobListResponse> {
    await this.delay(300);

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const items = Array.from(this.jobs.values())
      .filter((job) => {
        const scheduled = job.scheduledStart;
        return job.companyId === companyId && scheduled >= startOfDay && scheduled <= endOfDay;
      })
      .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Get all jobs for a company with optional filtering
   */
  async getAll(companyId: string, filters?: JobFilters): Promise<JobListResponse> {
    await this.delay(300);

    let items = Array.from(this.jobs.values()).filter((job) => job.companyId === companyId);

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
  async getByClient(companyId: string, clientId: string): Promise<JobListResponse> {
    return this.getAll(companyId, { clientId });
  }

  /**
   * Create a new job
   */
  async create(
    companyId: string,
    technicianId: string,
    technicianName: string,
    data: JobFormData
  ): Promise<Job> {
    await this.delay(400);

    this.idCounter++;
    const now = new Date();

    const job: Job = {
      id: `job_${this.idCounter}`,
      companyId,
      ...data,
      status: 'scheduled',
      createdBy: technicianId,
      createdByName: technicianName,
      createdAt: now,
      modifiedBy: technicianId,
      modifiedByName: technicianName,
      updatedAt: now,
    };

    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Update an existing job
   */
  async update(
    id: string,
    technicianId: string,
    technicianName: string,
    data: Partial<Omit<Job, 'id' | 'createdAt'>>
  ): Promise<Job> {
    await this.delay(400);

    const existing = await this.getById(id);

    const updated: Job = {
      ...existing,
      ...data,
      modifiedBy: technicianId,
      modifiedByName: technicianName,
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
