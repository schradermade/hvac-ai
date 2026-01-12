// Public API for equipment feature
// Only export what other features need to import

// Export types (type-only exports)
export type { Equipment, EquipmentFormData, SystemType } from './types';

// Export hooks
export {
  useEquipmentList,
  useEquipment,
  useEquipmentByClient,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
  useAssignEquipment,
} from './hooks/useEquipment';

// Export components
export { EquipmentCard } from './components/EquipmentCard';
export { EquipmentForm } from './components/EquipmentForm';

// DO NOT export:
// - Services (other features should use hooks, not services directly)
// - Internal helper components
// - Helper functions
