import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exampleService } from '../services/exampleService';
import type { Example, ExampleFormData, ExampleFilters } from '../types';

/**
 * Query keys for example-related queries
 *
 * Organize query keys hierarchically:
 * - all: base key for all example queries
 * - lists: all list queries
 * - list: specific list query with filters
 * - details: all detail queries
 * - detail: specific detail query by id
 */
const exampleKeys = {
  all: ['examples'] as const,
  lists: () => [...exampleKeys.all, 'list'] as const,
  list: (filters?: ExampleFilters) => [...exampleKeys.lists(), filters] as const,
  details: () => [...exampleKeys.all, 'detail'] as const,
  detail: (id: string) => [...exampleKeys.details(), id] as const,
};

/**
 * Hook for fetching list of examples
 *
 * Features:
 * - Automatic caching (5 minutes stale time)
 * - Background refetching
 * - Automatic retry on failure
 *
 * @param filters - Optional filters for the list
 */
export function useExampleList(filters?: ExampleFilters) {
  return useQuery({
    queryKey: exampleKeys.list(filters),
    queryFn: () => exampleService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching single example by ID
 *
 * Features:
 * - Longer stale time (30 minutes) - detail data changes less frequently
 * - Enabled only when ID is provided
 * - Automatic caching and background updates
 *
 * @param id - Example ID
 */
export function useExample(id: string) {
  return useQuery({
    queryKey: exampleKeys.detail(id),
    queryFn: () => exampleService.getById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for creating new example
 *
 * Features:
 * - Invalidates list queries on success (refetches lists)
 * - Returns mutation helpers (mutate, mutateAsync, isLoading, etc.)
 * - Automatic error handling
 *
 * Usage:
 * ```typescript
 * const createExample = useCreateExample();
 *
 * const handleCreate = () => {
 *   createExample.mutate(formData, {
 *     onSuccess: (newExample) => {
 *       console.log('Created:', newExample);
 *     },
 *   });
 * };
 * ```
 */
export function useCreateExample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExampleFormData) => exampleService.create(data),
    onSuccess: (newExample) => {
      // Invalidate all list queries (they'll refetch automatically)
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });

      // Optionally set the new example in the cache
      queryClient.setQueryData(exampleKeys.detail(newExample.id), newExample);
    },
  });
}

/**
 * Hook for updating existing example
 *
 * Features:
 * - Optimistic updates (UI updates immediately)
 * - Automatic rollback on error
 * - Invalidates related queries on success
 *
 * Usage:
 * ```typescript
 * const updateExample = useUpdateExample();
 *
 * const handleUpdate = () => {
 *   updateExample.mutate({ id: '1', data: { title: 'New Title' } });
 * };
 * ```
 */
export function useUpdateExample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExampleFormData> }) =>
      exampleService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches (so they don't overwrite optimistic update)
      await queryClient.cancelQueries({ queryKey: exampleKeys.detail(id) });

      // Snapshot previous value
      const previousExample = queryClient.getQueryData<Example>(exampleKeys.detail(id));

      // Optimistically update
      if (previousExample) {
        queryClient.setQueryData<Example>(exampleKeys.detail(id), {
          ...previousExample,
          ...data,
          updatedAt: new Date(),
        });
      }

      return { previousExample };
    },
    onError: (_error, { id }, context) => {
      // Rollback on error
      if (context?.previousExample) {
        queryClient.setQueryData(exampleKeys.detail(id), context.previousExample);
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch after mutation completes (success or error)
      queryClient.invalidateQueries({ queryKey: exampleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}

/**
 * Hook for deleting example
 *
 * Features:
 * - Removes from cache immediately on success
 * - Invalidates list queries
 *
 * Usage:
 * ```typescript
 * const deleteExample = useDeleteExample();
 *
 * const handleDelete = (id: string) => {
 *   if (confirm('Are you sure?')) {
 *     deleteExample.mutate(id);
 *   }
 * };
 * ```
 */
export function useDeleteExample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => exampleService.delete(id),
    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: exampleKeys.detail(id) });

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}
