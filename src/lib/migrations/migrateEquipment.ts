import { equipmentService } from '@/features/equipment/services/equipmentService';

/**
 * Migrate existing equipment to have clientId
 *
 * This migration runs automatically on app startup.
 * It assigns all equipment without a clientId to the "Unassigned" client.
 *
 * The "Unassigned" client is created automatically by the clientService
 * when it initializes.
 */
export async function migrateEquipmentToClients(): Promise<void> {
  console.log('[Migration] Starting equipment migration...');

  try {
    // Migrate all equipment without clientId
    const migratedCount = await equipmentService.migrateExistingEquipment();

    if (migratedCount === 0) {
      console.log('[Migration] No equipment needs migration.');
    } else {
      console.log(`[Migration] Migrated ${migratedCount} equipment items to Unassigned client.`);
    }

    console.log('[Migration] Equipment migration complete!');
  } catch (error) {
    console.error('[Migration] Failed:', error);
    throw error;
  }
}

/**
 * Check if migration is needed
 * Returns true if there is any equipment without clientId
 */
export async function needsEquipmentMigration(): Promise<boolean> {
  const { items } = await equipmentService.getAll();
  return items.some((eq) => !eq.clientId);
}
