import { useEffect, useState } from 'react';
import {
  migrateEquipmentToClients,
  needsEquipmentMigration,
} from '@/lib/migrations/migrateEquipment';

/**
 * Hook to run data migrations on app startup
 *
 * Currently handles:
 * - Equipment migration: Assign equipment without clientId to "Unassigned" client
 *
 * Returns:
 * - isComplete: true when all migrations have finished
 * - error: any error that occurred during migration
 */
export function useMigrations() {
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function runMigrations() {
      try {
        // Check if equipment migration is needed
        const needsMigration = await needsEquipmentMigration();

        if (needsMigration) {
          console.log('[App] Running equipment migration...');
          await migrateEquipmentToClients();
        }

        setIsComplete(true);
      } catch (err) {
        console.error('[App] Migration error:', err);
        setError(err as Error);
      }
    }

    runMigrations();
  }, []);

  return { isComplete, error };
}
