# Feature Development Guide

This guide walks you through building a new feature from start to finish, following our established patterns.

## Quick Start

```bash
# Generate feature scaffold
npm run create-feature [feature-name]

# This creates:
# src/features/[feature-name]/
#   ├── components/
#   ├── hooks/
#   ├── screens/
#   ├── services/
#   ├── __tests__/
#   ├── types.ts
#   └── index.ts
```

## Development Workflow

Follow these steps for every feature:

### 1. Define Types First (Contract-Driven Development)

Start by defining the data structures and interfaces in `types.ts`:

```typescript
// features/parts/types.ts

/**
 * Represents a HVAC part in the system
 */
export interface Part {
  id: string;
  partNumber: string;
  manufacturer: string;
  description: string;
  category: PartCategory;
  price?: number;
  imageUrl?: string;
}

/**
 * Form data for part search
 */
export interface PartSearchParams {
  query: string;
  category?: PartCategory;
  manufacturer?: string;
}

/**
 * Part categories
 */
export type PartCategory =
  | 'compressor'
  | 'capacitor'
  | 'contactor'
  | 'thermostat'
  | 'fan_motor'
  | 'other';

/**
 * API response for part search
 */
export interface PartSearchResponse {
  parts: Part[];
  total: number;
  hasMore: boolean;
}
```

**Why start with types?**

- Defines the "contract" for your feature
- Makes API design explicit
- Enables autocomplete while writing services
- Catches errors early

### 2. Build the Service Layer

Write pure business logic in `services/`:

```typescript
// features/parts/services/partService.ts
import { apiClient } from '@/lib/api';
import type { Part, PartSearchParams, PartSearchResponse } from '../types';

/**
 * Service for part-related operations
 */
class PartService {
  /**
   * Search for parts based on query
   */
  async search(params: PartSearchParams): Promise<PartSearchResponse> {
    const queryString = this.buildQueryString(params);
    const response = await apiClient.get<PartSearchResponse>(`/parts/search?${queryString}`);
    return this.normalizeSearchResponse(response);
  }

  /**
   * Get part details by ID
   */
  async getById(id: string): Promise<Part> {
    const response = await apiClient.get<Part>(`/parts/${id}`);
    return this.normalizePart(response);
  }

  /**
   * Identify part from image
   */
  async identifyFromImage(imageUri: string): Promise<Part[]> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'part.jpg',
    } as any);

    const response = await apiClient.post<Part[]>('/parts/identify', formData);
    return response.map(this.normalizePart);
  }

  // Private helper methods
  private buildQueryString(params: PartSearchParams): string {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.query);
    if (params.category) searchParams.append('category', params.category);
    if (params.manufacturer) searchParams.append('manufacturer', params.manufacturer);
    return searchParams.toString();
  }

  private normalizeSearchResponse(raw: any): PartSearchResponse {
    return {
      parts: raw.results?.map(this.normalizePart) ?? [],
      total: raw.total ?? 0,
      hasMore: raw.has_more ?? false,
    };
  }

  private normalizePart(raw: any): Part {
    return {
      id: raw.id,
      partNumber: raw.part_number,
      manufacturer: raw.manufacturer,
      description: raw.description,
      category: raw.category,
      price: raw.price,
      imageUrl: raw.image_url,
    };
  }
}

export const partService = new PartService();
```

**Service layer checklist:**

- [ ] No React dependencies (no hooks, no JSX)
- [ ] All public methods have JSDoc comments
- [ ] All public methods have explicit return types
- [ ] API responses are normalized to domain models
- [ ] Error handling delegates to API client

### 3. Write Service Tests

Test business logic before building UI:

```typescript
// features/parts/services/__tests__/partService.test.ts
import { partService } from '../partService';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api');

describe('PartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should search parts with query', async () => {
      const mockResponse = {
        results: [{ id: '1', part_number: 'CAP-123' }],
        total: 1,
        has_more: false,
      };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await partService.search({ query: 'capacitor' });

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/parts/search?q=capacitor')
      );
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0].partNumber).toBe('CAP-123');
    });

    it('should include optional parameters in query', async () => {
      await partService.search({
        query: 'capacitor',
        category: 'capacitor',
        manufacturer: 'Carrier',
      });

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('category=capacitor'));
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('manufacturer=Carrier'));
    });
  });

  describe('getById', () => {
    it('should fetch part by id', async () => {
      const mockPart = { id: '1', part_number: 'CAP-123' };
      (apiClient.get as jest.Mock).mockResolvedValue(mockPart);

      const result = await partService.getById('1');

      expect(apiClient.get).toHaveBeenCalledWith('/parts/1');
      expect(result.partNumber).toBe('CAP-123');
    });
  });
});
```

**Run tests:**

```bash
npm test -- features/parts/services
```

### 4. Create Custom Hooks

Hooks manage state and connect services to components:

```typescript
// features/parts/hooks/usePartSearch.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partService } from '../services/partService';
import type { PartSearchParams, Part } from '../types';

/**
 * Query keys for part-related queries
 */
const partKeys = {
  all: ['parts'] as const,
  search: (params: PartSearchParams) => [...partKeys.all, 'search', params] as const,
  detail: (id: string) => [...partKeys.all, 'detail', id] as const,
};

/**
 * Hook for searching parts
 */
export function usePartSearch(params: PartSearchParams) {
  return useQuery({
    queryKey: partKeys.search(params),
    queryFn: () => partService.search(params),
    enabled: params.query.length > 0, // Only search if query exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for getting part details
 */
export function usePartDetail(id: string) {
  return useQuery({
    queryKey: partKeys.detail(id),
    queryFn: () => partService.getById(id),
    staleTime: 30 * 60 * 1000, // 30 minutes (parts don't change often)
  });
}

/**
 * Hook for identifying parts from images
 */
export function usePartIdentification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageUri: string) => partService.identifyFromImage(imageUri),
    onSuccess: (parts) => {
      // Optionally cache identified parts
      parts.forEach((part) => {
        queryClient.setQueryData(partKeys.detail(part.id), part);
      });
    },
  });
}
```

**Hook patterns:**

- Use React Query for server state
- Define query keys at the top
- Enable/disable queries based on conditions
- Set appropriate staleTime based on data volatility
- Optimistically update cache when appropriate

### 5. Build UI Components

Create small, focused components:

```typescript
// features/parts/components/PartCard.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Button } from '@/components/ui';
import type { Part } from '../types';

interface PartCardProps {
  part: Part;
  onSelect?: (part: Part) => void;
}

export function PartCard({ part, onSelect }: PartCardProps) {
  return (
    <View style={styles.container}>
      {part.imageUrl && (
        <Image source={{ uri: part.imageUrl }} style={styles.image} />
      )}

      <View style={styles.content}>
        <Text style={styles.partNumber}>{part.partNumber}</Text>
        <Text style={styles.manufacturer}>{part.manufacturer}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {part.description}
        </Text>

        {part.price && (
          <Text style={styles.price}>${part.price.toFixed(2)}</Text>
        )}
      </View>

      {onSelect && (
        <Button
          title="Select"
          onPress={() => onSelect(part)}
          size="small"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  partNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  manufacturer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
});
```

**Component guidelines:**

- Props interface defined at the top
- Use design system components from `@/ui/`
- Keep under 150 lines
- StyleSheet at the bottom
- Memoize if expensive to render

### 6. Build Screen Components

Screens compose components and hooks:

```typescript
// features/parts/screens/PartSearchScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, FlatList, StyleSheet } from 'react-native';
import { usePartSearch } from '../hooks/usePartSearch';
import { PartCard } from '../components/PartCard';
import { LoadingSpinner } from '@/components/ui';
import { ErrorMessage } from '@/components/ui';
import { EmptyState } from '@/components/ui';
import type { Part } from '../types';

interface PartSearchScreenProps {
  onSelectPart: (part: Part) => void;
}

export function PartSearchScreen({ onSelectPart }: PartSearchScreenProps) {
  const [query, setQuery] = useState('');
  const { data, isLoading, error } = usePartSearch({ query });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search parts..."
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {isLoading && <LoadingSpinner />}

      {error && <ErrorMessage error={error} />}

      {data && data.parts.length === 0 && (
        <EmptyState
          title="No parts found"
          description="Try a different search term"
        />
      )}

      {data && data.parts.length > 0 && (
        <FlatList
          data={data.parts}
          renderItem={({ item }) => (
            <PartCard part={item} onSelect={onSelectPart} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
});
```

**Screen patterns:**

- Compose from smaller components
- Use hooks for data and logic
- Handle loading, error, and empty states
- Keep under 200 lines

### 7. Export Public API

Only export what other features need:

```typescript
// features/parts/index.ts

// Export screens
export { PartSearchScreen } from './screens/PartSearchScreen';

// Export hooks
export { usePartSearch, usePartDetail, usePartIdentification } from './hooks/usePartSearch';

// Export types (type-only exports)
export type { Part, PartSearchParams, PartCategory } from './types';

// DO NOT export:
// - Services (other features should use hooks, not services directly)
// - Internal components (only screens are public)
// - Helper functions
```

### 8. Integration

Add your feature to the app's navigation:

**Option A: Add as a new tab (most common)**

```typescript
// navigation/TabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PartSearchScreen } from '@/features/parts';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator>
      {/* ...existing tabs... */}
      <Tab.Screen
        name="Parts"
        component={PartSearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

**Option B: Add as a detail screen in stack navigator**

```typescript
// navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PartDetailScreen } from '@/features/parts';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Main" component={TabNavigator} />
      {/* Add detail screen */}
      <Stack.Screen
        name="PartDetail"
        component={PartDetailScreen}
        options={{ title: 'Part Details' }}
      />
    </Stack.Navigator>
  );
}
```

**Option C: Create a standalone screen component**

```typescript
// screens/PartsScreen.tsx
import React from 'react';
import { PartSearchScreen } from '@/features/parts';

export function PartsScreen() {
  const handleSelectPart = (part: Part) => {
    // Handle part selection (e.g., navigate to detail)
    navigation.navigate('PartDetail', { partId: part.id });
  };

  return <PartSearchScreen onSelectPart={handleSelectPart} />;
}
```

## Pre-Commit Checklist

Before committing your feature, verify:

### Code Quality

- [ ] All files are under size limits (components < 150 lines, etc.)
- [ ] No `any` types
- [ ] All public functions have explicit return types
- [ ] All public functions have JSDoc comments
- [ ] No console.logs left in code
- [ ] Imports are organized correctly

### Testing

- [ ] Service has unit tests
- [ ] All tests pass: `npm test`
- [ ] TypeScript has zero errors: `npm run type-check`
- [ ] ESLint has zero warnings: `npm run lint`

### Documentation

- [ ] Types have JSDoc comments
- [ ] Complex logic is commented
- [ ] Public API is documented in index.ts

### Functionality

- [ ] Feature works as expected
- [ ] Loading states are handled
- [ ] Error states are handled
- [ ] Empty states are handled
- [ ] Works offline (if applicable)

## Common Patterns

### Optimistic Updates

```typescript
export function useCreatePart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePartData) => partService.create(data),
    onMutate: async (newPart) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: partKeys.all });

      // Snapshot previous value
      const previousParts = queryClient.getQueryData(partKeys.all);

      // Optimistically update
      queryClient.setQueryData(partKeys.all, (old: Part[]) => [
        ...old,
        { ...newPart, id: 'temp-id' },
      ]);

      return { previousParts };
    },
    onError: (err, newPart, context) => {
      // Rollback on error
      queryClient.setQueryData(partKeys.all, context?.previousParts);
    },
    onSettled: () => {
      // Refetch after success or error
      queryClient.invalidateQueries({ queryKey: partKeys.all });
    },
  });
}
```

### Dependent Queries

```typescript
export function usePartWithSuppliers(partId: string) {
  const partQuery = usePartDetail(partId);

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', partId],
    queryFn: () => supplierService.getForPart(partId),
    enabled: !!partQuery.data, // Only fetch suppliers after part is loaded
  });

  return {
    part: partQuery.data,
    suppliers: suppliersQuery.data,
    isLoading: partQuery.isLoading || suppliersQuery.isLoading,
    error: partQuery.error ?? suppliersQuery.error,
  };
}
```

### Debounced Search

```typescript
import { useDeferredValue } from 'react';

export function usePartSearch() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const searchQuery = useQuery({
    queryKey: partKeys.search({ query: deferredQuery }),
    queryFn: () => partService.search({ query: deferredQuery }),
    enabled: deferredQuery.length > 0,
  });

  return {
    query,
    setQuery,
    ...searchQuery,
  };
}
```

## Troubleshooting

### "Module not found" errors

- Check that you're using `@/` prefix for absolute imports
- Verify the file exists at the path
- Run `npm run type-check` to see TypeScript errors

### Tests failing

- Clear Jest cache: `npm test -- --clearCache`
- Check that mocks are set up correctly
- Verify test data matches expected types

### TypeScript errors

- Run `npm run type-check` to see all errors
- Check that all imports have proper types
- Ensure no `any` types are used

### Performance issues

- Use React DevTools Profiler to find slow components
- Memoize expensive components with `React.memo`
- Use `useCallback` for callback props
- Consider using FlashList for long lists

## Next Steps

- Review existing features in `src/features/` for examples
- Read [CODING_STANDARDS.md](./CODING_STANDARDS.md) for detailed patterns
- Check `src/features/_example/` for reference implementation
