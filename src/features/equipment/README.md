# Equipment Feature

## Overview

[Describe what this feature does]

## Files

- `types.ts` - TypeScript interfaces and types
- `services/equipmentService.ts` - Business logic (API calls, data transformation)
- `hooks/useEquipment.ts` - React hooks for state management
- `components/` - Feature-specific UI components
- `screens/` - Screen components
- `index.ts` - Public API (only exports what other features need)

## Usage

```typescript
import { useEquipment } from '@/features/equipment';

function MyComponent() {
  const { data, isLoading } = useEquipment('123');

  if (isLoading) return <LoadingSpinner />;

  return <View>{/* Use data */}</View>;
}
```

## Development

### Adding a new component

1. Create component in `components/` folder
2. Keep under 150 lines
3. Add props interface at the top

### Adding a new screen

1. Create screen in `screens/` folder
2. Keep under 200 lines
3. Compose from smaller components
4. Use hooks for data and logic

### Testing

Run tests for this feature:

```bash
npm test -- src/features/equipment
```
