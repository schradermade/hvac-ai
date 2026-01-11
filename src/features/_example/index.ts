// Public API for _example feature
// This is a reference implementation - demonstrates what to export

// ✅ Export screens (other features can use them)
export { ExampleScreen } from './screens/ExampleScreen';

// ✅ Export hooks (other features can use them)
export {
  useExampleList,
  useExample,
  useCreateExample,
  useUpdateExample,
  useDeleteExample,
} from './hooks/useExample';

// ✅ Export types (type-only exports)
export type { Example, ExampleFormData, ExampleFilters, ExampleStatus } from './types';

// ❌ DO NOT export:
// - Services (exampleService) - other features should use hooks, not services directly
// - Internal components (ExampleCard) - only screens are public
// - Helper functions
// - Implementation details

// Why this matters:
// 1. Clear public API - other features know what they can use
// 2. Easy to refactor - can change internals without breaking other features
// 3. Prevents tight coupling - features don't directly depend on each other's implementation
// 4. Self-documenting - index.ts shows the feature's capabilities
