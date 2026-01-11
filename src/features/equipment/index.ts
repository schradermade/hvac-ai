// Public API for equipment feature
// Only export what other features need to import

// Export types (type-only exports)
export type { Equipment, EquipmentFormData } from './types';

// Export hooks
// export { useEquipment } from './hooks/useEquipment';

// Export screens
// export { EquipmentScreen } from './screens/EquipmentScreen';

// DO NOT export:
// - Services (other features should use hooks, not services directly)
// - Internal components (only screens are public)
// - Helper functions
