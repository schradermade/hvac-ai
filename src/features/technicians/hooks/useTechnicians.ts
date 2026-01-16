/**
 * Technicians Hooks
 *
 * React Query hooks for technician data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers';
import { technicianService } from '../services/technicianService';
import type { TechnicianFilters, TechnicianFormData } from '../types';

/**
 * Query keys for technician-related queries
 */
const technicianKeys = {
  all: (companyId: string) => ['technicians', companyId] as const,
  list: (companyId: string, filters?: TechnicianFilters) =>
    [...technicianKeys.all(companyId), 'list', filters] as const,
  detail: (technicianId: string) => ['technicians', 'detail', technicianId] as const,
};

/**
 * Hook to get all technicians for current company
 */
export function useTechnicians(filters?: TechnicianFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: technicianKeys.list(user?.companyId || '', filters),
    queryFn: () => technicianService.getAll(user!.companyId, filters),
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get technician by ID
 */
export function useTechnician(technicianId: string) {
  return useQuery({
    queryKey: technicianKeys.detail(technicianId),
    queryFn: () => technicianService.getById(technicianId),
    enabled: !!technicianId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create new technician
 */
export function useCreateTechnician() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TechnicianFormData) => technicianService.create(user!.companyId, data),
    onSuccess: () => {
      // Invalidate technician list queries
      queryClient.invalidateQueries({
        queryKey: technicianKeys.all(user!.companyId),
      });
    },
  });
}

/**
 * Hook to update technician
 */
export function useUpdateTechnician(technicianId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<TechnicianFormData>) => technicianService.update(technicianId, data),
    onSuccess: (updatedTechnician) => {
      // Update detail cache
      queryClient.setQueryData(technicianKeys.detail(technicianId), updatedTechnician);

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: technicianKeys.all(user!.companyId),
      });
    },
  });
}

/**
 * Hook to delete (deactivate) technician
 */
export function useDeleteTechnician() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (technicianId: string) => technicianService.delete(technicianId),
    onSuccess: () => {
      // Invalidate all technician queries
      queryClient.invalidateQueries({
        queryKey: technicianKeys.all(user!.companyId),
      });
    },
  });
}
