/**
 * Technician Service
 *
 * Business logic for technician operations
 * Mock implementation for MVP - will integrate with API later
 */

import type {
  Technician,
  TechnicianFormData,
  TechnicianFilters,
  TechnicianListResponse,
} from '../types';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `tech_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Service class for technician-related operations
 */
class TechnicianService {
  // Mock in-memory storage
  private technicians: Map<string, Technician> = new Map();

  constructor() {
    // Initialize with default test data
    this.initializeTestData();
  }

  /**
   * Initialize test data
   */
  private initializeTestData(): void {
    const testAdmin: Technician = {
      id: 'tech_test_admin',
      companyId: 'company_test_1',
      email: 'admin@test.com',
      firstName: 'Test',
      lastName: 'Admin',
      phone: '(555) 000-0001',
      role: 'admin',
      status: 'active',
      certifications: [
        {
          type: 'epa_608',
          name: 'EPA 608 - Universal',
          number: 'EPA-12345',
          issuedDate: new Date('2020-01-15'),
          expiryDate: new Date('2025-01-15'),
          issuer: 'EPA',
        },
        {
          type: 'nate',
          name: 'NATE Certified',
          number: 'NATE-67890',
          issuedDate: new Date('2021-03-20'),
          issuer: 'NATE',
        },
      ],
      licenseNumber: 'HVAC-IL-12345',
      licenseExpiry: new Date('2026-12-31'),
      hireDate: new Date('2023-01-15'),
      notes: 'Default admin account for testing',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2023-01-15'),
    };

    const testLeadTech: Technician = {
      id: 'tech_test_lead',
      companyId: 'company_test_1',
      email: 'bob.wilson@test.com',
      firstName: 'Bob',
      lastName: 'Wilson',
      phone: '(555) 000-0002',
      role: 'lead_tech',
      status: 'active',
      certifications: [
        {
          type: 'epa_608',
          name: 'EPA 608 - Type II',
          number: 'EPA-54321',
          issuedDate: new Date('2019-06-10'),
          expiryDate: new Date('2024-06-10'),
          issuer: 'EPA',
        },
        {
          type: 'manufacturer',
          name: 'Carrier Factory Authorized',
          issuedDate: new Date('2022-02-15'),
          issuer: 'Carrier',
        },
      ],
      licenseNumber: 'HVAC-IL-54321',
      licenseExpiry: new Date('2025-08-31'),
      hireDate: new Date('2019-03-01'),
      createdAt: new Date('2019-03-01'),
      updatedAt: new Date('2019-03-01'),
    };

    const testTechnician: Technician = {
      id: 'tech_test_alice',
      companyId: 'company_test_1',
      email: 'alice.johnson@test.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '(555) 000-0003',
      role: 'technician',
      status: 'active',
      certifications: [
        {
          type: 'epa_608',
          name: 'EPA 608 - Type I',
          number: 'EPA-11111',
          issuedDate: new Date('2023-01-10'),
          expiryDate: new Date('2028-01-10'),
          issuer: 'EPA',
        },
      ],
      hireDate: new Date('2023-06-01'),
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2023-06-01'),
    };

    this.technicians.set(testAdmin.id, testAdmin);
    this.technicians.set(testLeadTech.id, testLeadTech);
    this.technicians.set(testTechnician.id, testTechnician);
  }

  /**
   * Get all technicians for a company with optional filters
   */
  async getAll(companyId: string, filters?: TechnicianFilters): Promise<TechnicianListResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    let technicians = Array.from(this.technicians.values()).filter(
      (tech) => tech.companyId === companyId
    );

    // Apply filters
    if (filters?.status) {
      technicians = technicians.filter((tech) => tech.status === filters.status);
    }

    if (filters?.role) {
      technicians = technicians.filter((tech) => tech.role === filters.role);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      technicians = technicians.filter(
        (tech) =>
          tech.firstName.toLowerCase().includes(searchLower) ||
          tech.lastName.toLowerCase().includes(searchLower) ||
          tech.email.toLowerCase().includes(searchLower) ||
          tech.phone.includes(searchLower)
      );
    }

    // Sort by lastName, then firstName
    technicians.sort((a, b) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    });

    return {
      technicians,
      total: technicians.length,
    };
  }

  /**
   * Get technician by ID
   */
  async getById(technicianId: string): Promise<Technician> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    const technician = this.technicians.get(technicianId);

    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    return technician;
  }

  /**
   * Create new technician
   */
  async create(companyId: string, data: TechnicianFormData): Promise<Technician> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Validate email uniqueness
    const existingTech = Array.from(this.technicians.values()).find(
      (tech) => tech.email.toLowerCase() === data.email.toLowerCase()
    );

    if (existingTech) {
      throw new Error('Email already in use');
    }

    const newTechnician: Technician = {
      id: generateId(),
      companyId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.technicians.set(newTechnician.id, newTechnician);

    return newTechnician;
  }

  /**
   * Update technician
   */
  async update(technicianId: string, data: Partial<TechnicianFormData>): Promise<Technician> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const existingTechnician = this.technicians.get(technicianId);

    if (!existingTechnician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    // If updating email, validate uniqueness
    if (data.email && data.email !== existingTechnician.email) {
      const newEmail = data.email;
      const emailExists = Array.from(this.technicians.values()).find(
        (tech) => tech.id !== technicianId && tech.email.toLowerCase() === newEmail.toLowerCase()
      );

      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    const updatedTechnician: Technician = {
      ...existingTechnician,
      ...data,
      updatedAt: new Date(),
    };

    this.technicians.set(technicianId, updatedTechnician);

    return updatedTechnician;
  }

  /**
   * Delete technician (soft delete by setting status to inactive)
   */
  async delete(technicianId: string): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const technician = this.technicians.get(technicianId);

    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    // Soft delete by setting status to inactive
    technician.status = 'inactive';
    technician.updatedAt = new Date();

    this.technicians.set(technicianId, technician);
  }
}

// Export singleton instance
export const technicianService = new TechnicianService();
