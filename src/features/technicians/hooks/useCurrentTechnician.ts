/**
 * Current Technician Hook
 *
 * Hook to get the technician record for the currently logged-in user
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers';
import { technicianService } from '../services/technicianService';

/**
 * Hook to get current user's technician record
 *
 * This retrieves the full technician profile for the logged-in user,
 * which includes certifications, license info, etc.
 */
export function useCurrentTechnician() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['technicians', 'current', user?.id],
    queryFn: () => technicianService.getById(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
