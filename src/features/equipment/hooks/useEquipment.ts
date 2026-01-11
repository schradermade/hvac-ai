import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentService } from '../services/equipmentService';
import type { EquipmentFormData } from '../types';

/**
 * Query keys for equipment-related queries
 */
const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (filters: string) => [...equipmentKeys.lists(), { filters }] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
};

/**
 * Hook for getting all equipment items
 */
export function useEquipmentList() {
  return useQuery({
    queryKey: equipmentKeys.lists(),
    queryFn: () => equipmentService.getAll(),
  });
}

/**
 * Hook for getting equipment details
 */
export function useEquipment(id: string) {
  return useQuery({
    queryKey: equipmentKeys.detail(id),
    queryFn: () => equipmentService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook for creating equipment
 */
export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EquipmentFormData) => equipmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
    },
  });
}

/**
 * Hook for updating equipment
 */
export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EquipmentFormData> }) =>
      equipmentService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
    },
  });
}

/**
 * Hook for deleting equipment
 */
export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => equipmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
    },
  });
}
