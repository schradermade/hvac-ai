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
    // Initialize with test clients for development
    this.createTestClients();
  }

  /**
   * Create the special "Unassigned" client for equipment migration
   */
  private createUnassignedClient(): void {
    const unassigned: Client = {
      id: UNASSIGNED_CLIENT_ID,
      companyId: 'company_test_1',
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
   * Create test clients for development/testing
   */
  private createTestClients(): void {
    const testClients: Client[] = [
      {
        id: 'client_test_1',
        companyId: 'company_test_1',
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
      },
      {
        id: 'client_test_2',
        name: 'Sarah Johnson',
        phone: '555-234-5678',
        address: '456 Oak Avenue',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60614',
        email: 'sarah.j@email.com',
        serviceNotes: 'New construction, installed system in 2023',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
      },
      {
        id: 'client_test_3',
        name: 'Michael Chen',
        phone: '555-345-6789',
        address: '789 Elm Drive',
        city: 'Naperville',
        state: 'IL',
        zipCode: '60540',
        email: 'mchen@business.com',
        warrantyInfo: '10-year extended warranty through 2028',
        serviceNotes: 'Commercial property, requires after-hours service',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: 'client_test_4',
        name: 'Emily Rodriguez',
        phone: '555-456-7890',
        address: '321 Maple Court',
        city: 'Aurora',
        state: 'IL',
        zipCode: '60505',
        email: 'emily.r@gmail.com',
        secondaryPhone: '555-111-2222',
        serviceNotes: 'Prefers text messages for appointment reminders',
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-03-10'),
      },
      {
        id: 'client_test_5',
        name: 'David Wilson',
        phone: '555-567-8901',
        address: '555 Pine Street',
        city: 'Joliet',
        state: 'IL',
        zipCode: '60435',
        warrantyInfo: 'Manufacturer warranty expires 2025',
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-02-15'),
      },
      {
        id: 'client_test_6',
        name: 'Jennifer Martinez',
        phone: '555-678-9012',
        address: '888 Cedar Lane',
        city: 'Rockford',
        state: 'IL',
        zipCode: '61101',
        email: 'jmartinez@company.com',
        serviceNotes: 'Gate code: 1234. Park on street.',
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
      },
      {
        id: 'client_test_7',
        name: 'Robert Taylor',
        phone: '555-789-0123',
        address: '147 Birch Boulevard',
        city: 'Peoria',
        state: 'IL',
        zipCode: '61602',
        email: 'rtaylor@email.com',
        secondaryPhone: '555-333-4444',
        warrantyInfo: 'Premium service plan, annual maintenance included',
        serviceNotes: 'Elderly homeowner, please be patient',
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01'),
      },
      {
        id: 'client_test_8',
        name: 'Amanda Brown',
        phone: '555-890-1234',
        address: '963 Willow Way',
        city: 'Evanston',
        state: 'IL',
        zipCode: '60201',
        email: 'abrown@home.net',
        serviceNotes: 'Historic home, special equipment required',
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-02-20'),
      },
      {
        id: 'client_test_9',
        name: 'Christopher Lee',
        phone: '555-901-2345',
        address: '258 Spruce Circle',
        city: 'Schaumburg',
        state: 'IL',
        zipCode: '60193',
        email: 'clee@business.org',
        warrantyInfo: 'Transfer warranty from previous owner',
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15'),
      },
      {
        id: 'client_test_10',
        name: 'Lisa Anderson',
        phone: '555-012-3456',
        address: '741 Hickory Hill',
        city: 'Champaign',
        state: 'IL',
        zipCode: '61820',
        email: 'landerson@mail.com',
        secondaryPhone: '555-555-6666',
        serviceNotes: 'Call before arrival, works from home',
        createdAt: new Date('2024-01-30'),
        updatedAt: new Date('2024-01-30'),
      },
      {
        id: 'client_test_11',
        name: 'James Thompson',
        phone: '555-123-7890',
        address: '852 Poplar Place',
        city: 'Bloomington',
        state: 'IL',
        zipCode: '61701',
        warrantyInfo: 'Extended warranty purchased 2023',
        serviceNotes: 'Large property, multiple units',
        createdAt: new Date('2024-02-25'),
        updatedAt: new Date('2024-02-25'),
      },
      {
        id: 'client_test_12',
        name: 'Patricia Garcia',
        phone: '555-234-8901',
        address: '369 Ash Avenue',
        city: 'Decatur',
        state: 'IL',
        zipCode: '62521',
        email: 'pgarcia@icloud.com',
        serviceNotes: 'Prefers afternoon appointments after 2pm',
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-03-05'),
      },
      {
        id: 'client_test_13',
        name: 'Daniel White',
        phone: '555-345-9012',
        address: '951 Magnolia Drive',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704',
        email: 'dwhite@fastmail.com',
        warrantyInfo: 'No warranty, older system',
        serviceNotes: 'System needs replacement soon',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
      },
      {
        id: 'client_test_14',
        name: 'Jessica Harris',
        phone: '555-456-0123',
        address: '753 Walnut Street',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60622',
        email: 'jharris@domain.com',
        secondaryPhone: '555-777-8888',
        serviceNotes: 'Condo building, coordinate with property manager',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10'),
      },
      {
        id: 'client_test_15',
        name: 'Matthew Clark',
        phone: '555-567-1234',
        address: '159 Dogwood Court',
        city: 'Oak Park',
        state: 'IL',
        zipCode: '60302',
        email: 'mclark@work.com',
        warrantyInfo: 'Maintenance contract expires December 2024',
        createdAt: new Date('2024-03-20'),
        updatedAt: new Date('2024-03-20'),
      },
      {
        id: 'client_test_16',
        name: 'Michelle Lewis',
        phone: '555-678-2345',
        address: '357 Sycamore Lane',
        city: 'Wheaton',
        state: 'IL',
        zipCode: '60187',
        email: 'mlewis@home.net',
        serviceNotes: 'Recently purchased home, need full inspection',
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05'),
      },
      {
        id: 'client_test_17',
        name: 'Kevin Walker',
        phone: '555-789-3456',
        address: '486 Chestnut Road',
        city: 'Downers Grove',
        state: 'IL',
        zipCode: '60515',
        email: 'kwalker@email.com',
        secondaryPhone: '555-999-0000',
        warrantyInfo: 'Premium plan with unlimited service calls',
        serviceNotes: 'VIP client, priority service',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
      },
      {
        id: 'client_test_18',
        name: 'Nancy Hall',
        phone: '555-890-4567',
        address: '624 Beech Drive',
        city: 'Elgin',
        state: 'IL',
        zipCode: '60120',
        email: 'nhall@mail.com',
        serviceNotes: 'Tenant property, contact owner for major repairs',
        createdAt: new Date('2024-03-12'),
        updatedAt: new Date('2024-03-12'),
      },
      {
        id: 'client_test_19',
        name: 'Steven Young',
        phone: '555-901-5678',
        address: '792 Redwood Avenue',
        city: 'Arlington Heights',
        state: 'IL',
        zipCode: '60004',
        email: 'syoung@business.com',
        warrantyInfo: 'Commercial warranty through 2026',
        serviceNotes: 'Office building, service during business hours only',
        createdAt: new Date('2024-02-28'),
        updatedAt: new Date('2024-02-28'),
      },
      {
        id: 'client_test_20',
        name: 'Karen King',
        phone: '555-012-6789',
        address: '135 Cottonwood Circle',
        city: 'Bolingbrook',
        state: 'IL',
        zipCode: '60440',
        email: 'kking@personal.com',
        secondaryPhone: '555-222-3333',
        serviceNotes: 'Smart thermostat installed, app access available',
        createdAt: new Date('2024-01-22'),
        updatedAt: new Date('2024-01-22'),
      },
      {
        id: 'client_test_21',
        name: 'Brian Scott',
        phone: '555-123-9876',
        address: '468 Laurel Street',
        city: 'DeKalb',
        state: 'IL',
        zipCode: '60115',
        email: 'bscott@mail.org',
        warrantyInfo: 'Standard warranty, 2 years remaining',
        serviceNotes: 'New customer, first service appointment',
        createdAt: new Date('2024-03-25'),
        updatedAt: new Date('2024-03-25'),
      },
      {
        id: 'client_test_22',
        name: 'Margaret Wilson',
        phone: '555-234-5678',
        address: '892 Forest Glen Road',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62703',
        email: 'mwilson@email.com',
        petInfo:
          '1 large German Shepherd (Max) - very protective, barks at strangers. Keep gates closed.',
        serviceNotes: 'Please text before arrival. Equipment in backyard.',
        createdAt: new Date('2024-03-28'),
        updatedAt: new Date('2024-03-28'),
      },
    ];

    testClients.forEach((client) => {
      this.clients.set(client.id, client);
    });

    this.idCounter = 22; // Set counter to 22 since we used client_test_1 through client_test_22
  }

  /**
   * Get all clients for a company with optional filtering
   */
  async getAll(companyId: string, filters?: ClientFilters): Promise<ClientListResponse> {
    await this.delay(300);

    let items = Array.from(this.clients.values()).filter(
      (client) => client.companyId === companyId
    );

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
  async create(companyId: string, data: ClientFormData): Promise<Client> {
    await this.delay(400);

    // Validate required fields
    this.validateClientData(data);

    this.idCounter++;
    const now = new Date();

    const client: Client = {
      id: `client_${this.idCounter}`,
      companyId,
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
