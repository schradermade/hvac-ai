import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers';
import { jobService } from '../services/jobService';
import type { JobFormData, JobFilters } from '../types';

/**
 * Query keys for job-related queries
 */
const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (companyId: string, filters: JobFilters) =>
    [...jobKeys.lists(), companyId, { filters }] as const,
  todays: (companyId: string) => [...jobKeys.lists(), companyId, 'today'] as const,
  byClient: (companyId: string, clientId: string) =>
    [...jobKeys.lists(), companyId, 'client', clientId] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

/**
 * Hook for getting today's jobs
 * Refreshes every minute to stay current
 */
export function useTodaysJobs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: jobKeys.todays(user?.companyId || ''),
    queryFn: () => jobService.getTodaysJobs(user!.companyId),
    refetchInterval: 60000, // Refresh every minute
    enabled: !!user?.companyId,
  });
}

/**
 * Hook for getting all jobs with optional filters
 */
export function useJobList(filters?: JobFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: jobKeys.list(user?.companyId || '', filters || {}),
    queryFn: () => jobService.getAll(user!.companyId, filters),
    enabled: !!user?.companyId,
  });
}

/**
 * Hook for getting job details by ID
 */
export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => jobService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook for getting jobs by client
 */
export function useJobsByClient(clientId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: jobKeys.byClient(user?.companyId || '', clientId),
    queryFn: () => jobService.getByClient(user!.companyId, clientId),
    enabled: !!user?.companyId && !!clientId,
  });
}

/**
 * Hook for creating a new job
 */
export function useCreateJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JobFormData) => jobService.create(user!.companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

/**
 * Hook for updating an existing job
 */
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<import('../types').Job, 'id' | 'createdAt'>>;
    }) => jobService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}

/**
 * Hook for deleting a job
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
}
