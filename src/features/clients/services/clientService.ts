import type { Client, ClientFormData, ClientFilters, ClientListResponse } from '../types';
import { UNASSIGNED_CLIENT_ID } from '../types';

/**
 * Service for client management operations
 *
 * Currently uses in-memory storage for MVP
 * Will be replaced with real API integration later
 */
class ClientService {
  private clients: Map<string, Client> = new Map();
  private idCounter = 0;

  constructor() {
    // Initialize with special "Unassigned" client for equipment migration
    this.createUnassignedClient();
    // Initialize with test client for development
    this.createTestClient();
  }

  /**
   * Create the special "Unassigned" client for equipment migration
   */
  private createUnassignedClient(): void {
    const unassigned: Client = {
      id: UNASSIGNED_CLIENT_ID,
      name: 'Unassigned Equipment',
      phone: 'N/A',
      address: 'N/A',
      city: 'N/A',
      state: 'N/A',
      zipCode: '00000',
      serviceNotes:
        'This is a special client for equipment not yet assigned to a customer. ' +
        'When servicing equipment, please assign it to the actual client.',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.clients.set(UNASSIGNED_CLIENT_ID, unassigned);
  }

  /**
   * Create a test client for development/testing
   */
  private createTestClient(): void {
    const testClient: Client = {
      id: 'client_test_1',
      name: 'John Smith',
      phone: '555-123-4567',
      address: '123 Main Street',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      email: 'john.smith@example.com',
      secondaryPhone: '555-987-6543',
      warrantyInfo: 'Standard 5-year warranty on HVAC system installed 2020',
      serviceNotes:
        'Prefers morning appointments. Has two dogs, please call before entering backyard.',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    };
    this.clients.set(testClient.id, testClient);
    this.idCounter = 1; // Set counter to 1 since we used client_test_1
  }

  /**
   * Get all clients with optional filtering
   */
  async getAll(filters?: ClientFilters): Promise<ClientListResponse> {
    await this.delay(300);

    let items = Array.from(this.clients.values());

    // Apply search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      items = items.filter(
        (client) =>
          client.name.toLowerCase().includes(searchLower) ||
          client.phone.includes(searchLower) ||
          client.address.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply city filter
    if (filters?.city) {
      items = items.filter((client) => client.city === filters.city);
    }

    // Apply state filter
    if (filters?.state) {
      items = items.filter((client) => client.state === filters.state);
    }

    // Sort by name
    items.sort((a, b) => a.name.localeCompare(b.name));

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Get client by ID
   */
  async getById(id: string): Promise<Client> {
    await this.delay(200);

    const client = this.clients.get(id);
    if (!client) {
      throw new Error(`Client with id ${id} not found`);
    }

    return client;
  }

  /**
   * Create a new client
   */
  async create(data: ClientFormData): Promise<Client> {
    await this.delay(400);

    // Validate required fields
    this.validateClientData(data);

    this.idCounter++;
    const now = new Date();

    const client: Client = {
      id: `client_${this.idCounter}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    this.clients.set(client.id, client);
    return client;
  }

  /**
   * Update an existing client
   */
  async update(id: string, data: Partial<ClientFormData>): Promise<Client> {
    await this.delay(400);

    const existing = await this.getById(id);

    // Prevent updating the special "Unassigned" client's core fields
    if (id === UNASSIGNED_CLIENT_ID) {
      throw new Error('Cannot update the Unassigned client');
    }

    // Validate if required fields are being updated
    const updatedData = { ...existing, ...data };
    this.validateClientData(updatedData);

    const updated: Client = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    this.clients.set(id, updated);
    return updated;
  }

  /**
   * Delete a client
   */
  async delete(id: string): Promise<void> {
    await this.delay(300);

    // Prevent deletion of the special "Unassigned" client
    if (id === UNASSIGNED_CLIENT_ID) {
      throw new Error('Cannot delete the Unassigned client');
    }

    const client = await this.getById(id);
    if (!client) {
      throw new Error(`Client with id ${id} not found`);
    }

    // TODO: Check for related equipment and jobs before deleting
    // For now, we'll allow deletion
    // In future: throw error if client has equipment or jobs

    this.clients.delete(id);
  }

  /**
   * Validate client data
   */
  private validateClientData(data: Partial<ClientFormData>): void {
    const requiredFields = ['name', 'phone', 'address', 'city', 'state', 'zipCode'];

    for (const field of requiredFields) {
      const value = data[field as keyof ClientFormData];
      if (!value || (typeof value === 'string' && !value.trim())) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate phone format (basic validation)
    if (data.phone && !/^\d{10,}$/.test(data.phone.replace(/\D/g, ''))) {
      throw new Error('Phone number must contain at least 10 digits');
    }

    // Validate email format if provided
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate ZIP code (basic US format)
    if (data.zipCode && !/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
      throw new Error('ZIP code must be in format 12345 or 12345-6789');
    }
  }

  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const clientService = new ClientService();
