import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers';
import { jobService } from '../services/jobService';

/**
 * Query keys for job assignment queries
 */
const jobAssignmentKeys = {
  myJobs: (companyId: string, technicianId: string) =>
    ['jobs', 'assigned', companyId, technicianId] as const,
};

/**
 * Hook for getting jobs assigned to current user
 */
export function useMyJobs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: jobAssignmentKeys.myJobs(user?.companyId || '', user?.id || ''),
    queryFn: () => jobService.getByTechnician(user!.companyId, user!.id),
    enabled: !!user?.companyId && !!user?.id,
  });
}

/**
 * Hook for assigning a job to a technician (admin action)
 */
export function useAssignJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      technicianId,
      technicianName,
    }: {
      jobId: string;
      technicianId: string;
      technicianName: string;
    }) =>
      jobService.assign(
        jobId,
        technicianId,
        technicianName,
        user!.id,
        `${user!.firstName} ${user!.lastName}`
      ),
    onSuccess: () => {
      // Invalidate job lists to refresh assignment status
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

/**
 * Hook for accepting an assigned job (technician action)
 */
export function useAcceptJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => jobService.accept(jobId, user!.id),
    onSuccess: () => {
      // Invalidate job lists and my jobs
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

/**
 * Hook for declining an assigned job (technician action)
 */
export function useDeclineJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, reason }: { jobId: string; reason?: string }) =>
      jobService.decline(jobId, user!.id, reason),
    onSuccess: () => {
      // Invalidate job lists and my jobs
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

/**
 * Hook for unassigning a job (admin action)
 */
export function useUnassignJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) =>
      jobService.unassign(jobId, user!.id, `${user!.firstName} ${user!.lastName}`),
    onSuccess: () => {
      // Invalidate job lists to refresh assignment status
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
