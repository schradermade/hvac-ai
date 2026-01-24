import { useEffect, useState } from 'react';
import { useAuth } from '@/providers';
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
  const { user } = useAuth();
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function runMigrations() {
      if (!user?.companyId) {
        setIsComplete(true);
        return;
      }

      try {
        // Check if equipment migration is needed
        const needsMigration = await needsEquipmentMigration(user.companyId);

        if (needsMigration) {
          console.warn('[App] Running equipment migration...');
          await migrateEquipmentToClients();
        }

        setIsComplete(true);
      } catch (err) {
        console.error('[App] Migration error:', err);
        setError(err as Error);
      }
    }

    runMigrations();
  }, [user?.companyId]);

  return { isComplete, error };
}
