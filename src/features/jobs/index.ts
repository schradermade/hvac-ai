// Public API for jobs feature

// Export types
export type {
  Job,
  JobType,
  AppointmentStatus,
  JobFormData,
  JobFilters,
  JobListResponse,
  JobAssignment,
} from './types';

// Export hooks
export {
  useTodaysJobs,
  useJobList,
  useJob,
  useJobsByClient,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
} from './hooks/useJobs';

// Export assignment hooks
export {
  useMyJobs,
  useAssignJob,
  useAcceptJob,
  useDeclineJob,
  useUnassignJob,
} from './hooks/useJobAssignment';

// Export components
export { JobCard } from './components/JobCard';
export { JobForm } from './components/JobForm';
export { JobAssignmentBadge } from './components/JobAssignmentBadge';
export { JobActionButtons } from './components/JobActionButtons';
export { AssignJobModal } from './components/AssignJobModal';

// Export screens
export { TodaysJobsScreen } from './screens/TodaysJobsScreen';
export { JobDetailScreen } from './screens/JobDetailScreen';
