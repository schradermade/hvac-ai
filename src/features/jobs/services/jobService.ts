import type {
  AppointmentStatus,
  Job,
  JobFormData,
  JobFilters,
  JobListResponse,
  JobType,
} from '../types';
import { fetchCopilotJson } from '@/lib/api/copilotApi';

/**
 * Service for job/appointment management operations
 *
 * Currently uses in-memory storage for MVP
 * Will be replaced with real API integration later
 */
type ApiJob = {
  id: string;
  tenant_id: string;
  client_id: string;
  property_id: string;
  job_type: string;
  status: string;
  scheduled_at: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

class JobService {
  private jobs: Map<string, Job> = new Map();
  private idCounter = 0;

  constructor() {
    // Initialize with test jobs for development
    if (!process.env.EXPO_PUBLIC_COPILOT_API_URL) {
      this.createTestJobs();
    }
  }

  private mapJobType(value: string): JobType {
    if (value === 'install') return 'installation';
    if (value === 'inspection') return 'inspection';
    if (value === 'emergency') return 'emergency';
    if (value === 'repair') return 'repair';
    return 'maintenance';
  }

  private mapStatus(value: string): AppointmentStatus {
    const known: AppointmentStatus[] = [
      'unassigned',
      'assigned',
      'accepted',
      'declined',
      'scheduled',
      'in_progress',
      'completed',
      'cancelled',
      'rescheduled',
    ];
    return known.includes(value as AppointmentStatus) ? (value as AppointmentStatus) : 'scheduled';
  }

  private mapApiJob(job: ApiJob): Job {
    const scheduledStart = job.scheduled_at ? new Date(job.scheduled_at) : new Date();
    const scheduledEnd = new Date(scheduledStart.getTime() + 90 * 60 * 1000);

    return {
      id: job.id,
      companyId: job.tenant_id,
      clientId: job.client_id,
      type: this.mapJobType(job.job_type),
      status: this.mapStatus(job.status),
      scheduledStart,
      scheduledEnd,
      description: job.summary ?? '',
      notes: undefined,
      createdBy: 'system',
      createdByName: 'System',
      createdAt: new Date(job.created_at),
      modifiedBy: 'system',
      modifiedByName: 'System',
      updatedAt: new Date(job.updated_at),
    };
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

    const jobTypes: Job['type'][] = [
      'maintenance',
      'repair',
      'installation',
      'inspection',
      'emergency',
    ];
    const jobStatuses: Job['status'][] = [
      'scheduled',
      'in_progress',
      'completed',
      'cancelled',
      'rescheduled',
    ];

    for (let i = 0; i < 150; i += 1) {
      const dayOffset = (i % 30) - 10;
      const hourOffset = 8 + (i % 8);
      const scheduledStart = new Date(
        today.getTime() + dayOffset * 24 * 60 * 60 * 1000 + hourOffset * 60 * 60 * 1000
      );
      const scheduledEnd = new Date(scheduledStart.getTime() + 90 * 60 * 1000);
      const status = i % 12 === 0 ? 'assigned' : jobStatuses[i % jobStatuses.length];
      const type = jobTypes[i % jobTypes.length];
      const clientIndex = (i % 30) + 1;
      const assignedToAlice = i % 12 === 0;

      testJobs.push({
        companyId: 'company_test_1',
        id: `job_seed_${i + 22}`,
        clientId: `client_test_${clientIndex}`,
        type,
        status,
        scheduledStart,
        scheduledEnd,
        description: `${type} visit for client ${clientIndex}`,
        notes: 'Auto-generated job for list testing',
        assignment: assignedToAlice
          ? {
              technicianId: 'tech_test_alice',
              technicianName: 'Alice Johnson',
              assignedAt: new Date(),
              assignedBy: 'tech_test_admin',
              assignedByName: 'Test Admin',
            }
          : undefined,
        createdBy: 'tech_test_admin',
        createdByName: 'Test Admin',
        createdAt: new Date(),
        modifiedBy: 'tech_test_admin',
        modifiedByName: 'Test Admin',
        updatedAt: new Date(),
      });
    }

    testJobs.forEach((job) => {
      this.jobs.set(job.id, job);
    });

    this.idCounter = 171; // Set counter since we used job_test_1 through job_seed_171
  }

  /**
   * Get today's scheduled jobs for a company
   */
  async getTodaysJobs(companyId: string): Promise<JobListResponse> {
    if (process.env.EXPO_PUBLIC_COPILOT_API_URL) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      const params = new URLSearchParams({
        start: today.toISOString(),
        end: end.toISOString(),
      });
      const data = await fetchCopilotJson<{ items: ApiJob[]; total: number }>(
        `/api/jobs?${params.toString()}`
      );

      return {
        items: data.items.map((job) => this.mapApiJob(job)),
        total: data.total,
      };
    }

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
    if (process.env.EXPO_PUBLIC_COPILOT_API_URL) {
      const params = new URLSearchParams();

      if (filters?.clientId) {
        params.set('clientId', filters.clientId);
      }

      if (filters?.status) {
        params.set('status', filters.status);
      }

      if (filters?.type) {
        params.set('type', filters.type);
      }

      if (filters?.dateRange) {
        const start = new Date(filters.dateRange.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.dateRange.endDate);
        end.setHours(23, 59, 59, 999);
        params.set('start', start.toISOString());
        params.set('end', end.toISOString());
      } else if (filters?.date) {
        const start = new Date(filters.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.date);
        end.setHours(23, 59, 59, 999);
        params.set('start', start.toISOString());
        params.set('end', end.toISOString());
      }

      const data = await fetchCopilotJson<{ items: ApiJob[]; total: number }>(
        `/api/jobs${params.toString() ? `?${params.toString()}` : ''}`
      );

      return {
        items: data.items.map((job) => this.mapApiJob(job)),
        total: data.total,
      };
    }

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

    if (filters?.dateRange) {
      const rangeStart = new Date(filters.dateRange.startDate);
      rangeStart.setHours(0, 0, 0, 0);
      const rangeEnd = new Date(filters.dateRange.endDate);
      rangeEnd.setHours(23, 59, 59, 999);

      items = items.filter((job) => {
        const scheduled = job.scheduledStart;
        return scheduled >= rangeStart && scheduled <= rangeEnd;
      });
    } else if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      items = items.filter((job) => {
        const scheduled = job.scheduledStart;
        return scheduled >= startOfDay && scheduled <= endOfDay;
      });
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
    if (process.env.EXPO_PUBLIC_COPILOT_API_URL) {
      const job = await fetchCopilotJson<ApiJob>(`/api/jobs/${id}`);
      return this.mapApiJob(job);
    }

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
    if (process.env.EXPO_PUBLIC_COPILOT_API_URL) {
      const response = await fetchCopilotJson<{ id: string }>('/api/jobs', {
        method: 'POST',
        body: {
          clientId: data.clientId,
          jobType: data.type,
          scheduledAt: data.scheduledStart.toISOString(),
          summary: data.description,
        },
      });

      const job = await fetchCopilotJson<ApiJob>(`/api/jobs/${response.id}`);
      return this.mapApiJob(job);
    }

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
   * Get jobs assigned to a specific technician
   */
  async getByTechnician(companyId: string, technicianId: string): Promise<JobListResponse> {
    await this.delay(300);

    const items = Array.from(this.jobs.values())
      .filter((job) => job.companyId === companyId && job.assignment?.technicianId === technicianId)
      .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Assign job to a technician (admin action)
   */
  async assign(
    jobId: string,
    technicianId: string,
    technicianName: string,
    assignedBy: string,
    assignedByName: string
  ): Promise<Job> {
    await this.delay(400);

    const job = await this.getById(jobId);

    const updated: Job = {
      ...job,
      status: 'assigned',
      assignment: {
        technicianId,
        technicianName,
        assignedAt: new Date(),
        assignedBy,
        assignedByName,
      },
      modifiedBy: assignedBy,
      modifiedByName: assignedByName,
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, updated);
    return updated;
  }

  /**
   * Technician accepts assigned job
   */
  async accept(jobId: string, technicianId: string): Promise<Job> {
    await this.delay(400);

    const job = await this.getById(jobId);

    if (!job.assignment) {
      throw new Error('Job is not assigned');
    }

    if (job.assignment.technicianId !== technicianId) {
      throw new Error('Job is not assigned to this technician');
    }

    const updated: Job = {
      ...job,
      status: 'accepted',
      assignment: {
        ...job.assignment,
        acceptedAt: new Date(),
      },
      modifiedBy: technicianId,
      modifiedByName: job.assignment.technicianName,
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, updated);
    return updated;
  }

  /**
   * Technician declines assigned job
   */
  async decline(jobId: string, technicianId: string, reason?: string): Promise<Job> {
    await this.delay(400);

    const job = await this.getById(jobId);

    if (!job.assignment) {
      throw new Error('Job is not assigned');
    }

    if (job.assignment.technicianId !== technicianId) {
      throw new Error('Job is not assigned to this technician');
    }

    const updated: Job = {
      ...job,
      status: 'declined',
      assignment: {
        ...job.assignment,
        declinedAt: new Date(),
        declineReason: reason,
      },
      modifiedBy: technicianId,
      modifiedByName: job.assignment.technicianName,
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, updated);
    return updated;
  }

  /**
   * Unassign job (admin action)
   */
  async unassign(jobId: string, adminId: string, adminName: string): Promise<Job> {
    await this.delay(400);

    const job = await this.getById(jobId);

    const updated: Job = {
      ...job,
      status: 'unassigned',
      assignment: undefined,
      modifiedBy: adminId,
      modifiedByName: adminName,
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, updated);
    return updated;
  }

  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const jobService = new JobService();
