import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../services/jobService';
import type { JobFormData, JobFilters } from '../types';

/**
 * Query keys for job-related queries
 */
const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), { filters }] as const,
  todays: () => [...jobKeys.lists(), 'today'] as const,
  byClient: (clientId: string) => [...jobKeys.lists(), 'client', clientId] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

/**
 * Hook for getting today's jobs
 * Refreshes every minute to stay current
 */
export function useTodaysJobs() {
  return useQuery({
    queryKey: jobKeys.todays(),
    queryFn: () => jobService.getTodaysJobs(),
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Hook for getting all jobs with optional filters
 */
export function useJobList(filters?: JobFilters) {
  return useQuery({
    queryKey: jobKeys.list(filters || {}),
    queryFn: () => jobService.getAll(filters),
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
  return useQuery({
    queryKey: jobKeys.byClient(clientId),
    queryFn: () => jobService.getByClient(clientId),
    enabled: !!clientId,
  });
}

/**
 * Hook for creating a new job
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JobFormData) => jobService.create(data),
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
    mutationFn: ({ id, data }: { id: string; data: Partial<JobFormData> }) =>
      jobService.update(id, data),
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
