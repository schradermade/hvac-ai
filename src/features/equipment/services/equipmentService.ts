import type { Equipment, EquipmentFormData, EquipmentListResponse } from '../types';

/**
 * Equipment Service
 *
 * Currently uses in-memory storage for MVP.
 * Will be replaced with real API/database later.
 *
 * Provides CRUD operations for equipment profiles.
 */
class EquipmentService {
  private equipment: Map<string, Equipment> = new Map();
  private idCounter = 0;

  /**
   * Get all equipment
   */
  async getAll(): Promise<EquipmentListResponse> {
    await this.delay(300);

    const items = Array.from(this.equipment.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Get equipment by ID
   */
  async getById(id: string): Promise<Equipment> {
    await this.delay(200);

    const equipment = this.equipment.get(id);
    if (!equipment) {
      throw new Error('Equipment not found');
    }

    return equipment;
  }

  /**
   * Create new equipment
   */
  async create(data: EquipmentFormData): Promise<Equipment> {
    await this.delay(400);

    this.idCounter++;
    const now = new Date();

    const equipment: Equipment = {
      id: `eq_${this.idCounter}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    this.equipment.set(equipment.id, equipment);

    return equipment;
  }

  /**
   * Update existing equipment
   */
  async update(id: string, data: Partial<EquipmentFormData>): Promise<Equipment> {
    await this.delay(400);

    const existing = this.equipment.get(id);
    if (!existing) {
      throw new Error('Equipment not found');
    }

    const updated: Equipment = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    this.equipment.set(id, updated);

    return updated;
  }

  /**
   * Delete equipment
   */
  async delete(id: string): Promise<void> {
    await this.delay(300);

    if (!this.equipment.has(id)) {
      throw new Error('Equipment not found');
    }

    this.equipment.delete(id);
  }

  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const equipmentService = new EquipmentService();
