/**
 * Company Service
 *
 * Business logic for company operations
 * Mock implementation for MVP - will integrate with API later
 */

import type { Company, CompanyFormData } from '../types';

/**
 * Service class for company-related operations
 */
class CompanyService {
  // Mock in-memory storage
  private companies: Map<string, Company> = new Map();

  constructor() {
    // Initialize with default test company
    this.initializeTestData();
  }

  /**
   * Initialize test data
   */
  private initializeTestData(): void {
    const testCompany: Company = {
      id: 'company_test_1',
      name: 'Test HVAC Company',
      phone: '(555) 000-0000',
      email: 'info@testhvac.com',
      address: '123 Main Street',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      website: 'https://testhvac.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    this.companies.set(testCompany.id, testCompany);
  }

  /**
   * Get company by ID
   */
  async getById(companyId: string): Promise<Company> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const company = this.companies.get(companyId);

    if (!company) {
      throw new Error(`Company not found: ${companyId}`);
    }

    return company;
  }

  /**
   * Update company information
   */
  async update(companyId: string, data: CompanyFormData): Promise<Company> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const existingCompany = this.companies.get(companyId);

    if (!existingCompany) {
      throw new Error(`Company not found: ${companyId}`);
    }

    const updatedCompany: Company = {
      ...existingCompany,
      ...data,
      updatedAt: new Date(),
    };

    this.companies.set(companyId, updatedCompany);

    return updatedCompany;
  }
}

// Export singleton instance
export const companyService = new CompanyService();
