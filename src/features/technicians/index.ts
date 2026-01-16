/**
 * Technicians Feature Module
 *
 * Public API for technicians feature
 */

// Export screens
export { TechnicianListScreen } from './screens/TechnicianListScreen';
export { TechnicianDetailScreen } from './screens/TechnicianDetailScreen';
export { CreateTechnicianScreen } from './screens/CreateTechnicianScreen';
export { MyProfileScreen } from './screens/MyProfileScreen';

// Export hooks
export {
  useTechnicians,
  useTechnician,
  useCreateTechnician,
  useUpdateTechnician,
  useDeleteTechnician,
} from './hooks/useTechnicians';
export { useCurrentTechnician } from './hooks/useCurrentTechnician';

// Export components
export { TechnicianCard } from './components/TechnicianCard';
export { TechnicianForm } from './components/TechnicianForm';
export { CertificationBadges } from './components/CertificationBadges';

// Export types
export type {
  Technician,
  TechnicianRole,
  TechnicianStatus,
  Certification,
  CertificationType,
  TechnicianFormData,
  TechnicianFilters,
  TechnicianListResponse,
} from './types';

// Export service (for testing only - use hooks in components)
export { technicianService } from './services/technicianService';
