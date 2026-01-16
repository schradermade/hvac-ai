import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers';
import { equipmentService } from '../services/equipmentService';
import type { EquipmentFormData } from '../types';

/**
 * Query keys for equipment-related queries
 */
const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (companyId: string, filters: string) =>
    [...equipmentKeys.lists(), companyId, { filters }] as const,
  byClient: (companyId: string, clientId: string) =>
    [...equipmentKeys.lists(), companyId, 'client', clientId] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
};

/**
 * Hook for getting all equipment items
 */
export function useEquipmentList() {
  const { user } = useAuth();

  return useQuery({
    queryKey: equipmentKeys.list(user?.companyId || '', ''),
    queryFn: () => equipmentService.getAll(user!.companyId),
    enabled: !!user?.companyId,
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
 * Hook for getting equipment by client
 */
export function useEquipmentByClient(clientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: equipmentKeys.byClient(user?.companyId || '', clientId),
    queryFn: () => equipmentService.getByClient(user!.companyId, clientId),
    enabled: !!user?.companyId && !!clientId,
  });
}

/**
 * Hook for creating equipment
 */
export function useCreateEquipment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EquipmentFormData) =>
      equipmentService.create(
        user!.companyId,
        user!.id,
        `${user!.firstName} ${user!.lastName}`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
    },
  });
}

/**
 * Hook for updating equipment
 */
export function useUpdateEquipment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EquipmentFormData> }) =>
      equipmentService.update(id, user!.id, `${user!.firstName} ${user!.lastName}`, data),
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

/**
 * Hook for assigning equipment to a client
 */
export function useAssignEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ equipmentId, clientId }: { equipmentId: string; clientId: string }) =>
      equipmentService.assignToClient(equipmentId, clientId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.detail(variables.equipmentId) });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.byClient('', variables.clientId) });
    },
  });
}
