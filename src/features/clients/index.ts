// Public API for clients feature

// Export types
export type { Client, ClientFormData, ClientFilters, ClientListResponse } from './types';
export { UNASSIGNED_CLIENT_ID } from './types';

// Export hooks
export {
  useClientList,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from './hooks/useClients';

// Export components
export { ClientCard } from './components/ClientCard';
export { ClientForm } from './components/ClientForm';

// Export screens
export { ClientListScreen } from './screens/ClientListScreen';
export { ClientDetailScreen } from './screens/ClientDetailScreen';
