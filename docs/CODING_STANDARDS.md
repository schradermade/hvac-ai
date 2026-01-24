# Coding Standards

These standards ensure our codebase remains maintainable, consistent, and professional. Following these patterns makes the code look like it was written by a staff-level engineering team.

## Production-Grade Requirement

All code changes must be production-quality in both implementation and behavior. Avoid brittle checks, ad-hoc logic, or shortcuts that would be unacceptable in a production system. Prefer explicit error types, clear failure modes, and maintainable patterns that scale with the codebase.

## Core Principles

1. **Clarity over cleverness** - Code should be obvious
2. **Explicit over implicit** - No magic, clear data flow
3. **Small focused modules** - Each file has one clear purpose
4. **Composition over configuration** - Build from small pieces
5. **Type safety** - TypeScript strict mode, no `any`
6. **Test the right things** - Services and critical logic, not trivial components

## File Organization

### Feature Module Structure

Every feature follows this exact structure:

```
features/[feature-name]/
├── components/          # Feature-specific UI components
│   ├── ComponentA.tsx
│   └── ComponentB.tsx
├── hooks/              # Feature-specific hooks
│   ├── useFeatureName.ts
│   └── useFeatureAction.ts
├── screens/            # Screen components
│   └── FeatureScreen.tsx
├── services/           # Business logic (no React)
│   ├── featureService.ts
│   └── __tests__/
│       └── featureService.test.ts
├── types.ts            # Feature types
├── index.ts            # Public API
└── __tests__/          # Integration tests
```

### File Size Limits

Enforce these limits to keep code maintainable:

- **Components**: 150 lines maximum
- **Hooks**: 100 lines maximum
- **Services**: 300 lines maximum
- **Screens**: 200 lines maximum
- **Utility functions**: 50 lines maximum

**If a file exceeds these limits, split it into smaller pieces.**

**Note:** If a service has many private helper methods (like response generators), consider extracting them into separate modules (e.g., `diagnosticResponses.ts`) that the main service imports.

### Public API Pattern

Every feature must have an `index.ts` that explicitly exports its public interface:

```typescript
// features/diagnostic/index.ts

// Export screens
export { DiagnosticScreen } from './screens/DiagnosticScreen';

// Export hooks
export { useDiagnostic } from './hooks/useDiagnostic';

// Export types (use type-only imports)
export type { DiagnosticMode, DiagnosticState } from './types';

// DO NOT export services, components, or internal utilities
// Other features should only use the hook, not the service directly
```

## Code Patterns

### Pattern 1: Logic in Hooks, Not Components

**❌ Anti-pattern: Logic in Components**

```typescript
function DiagnosticScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/messages')
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const sendMessage = async (text: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      setMessages([...messages, data]);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return <View>...</View>;
}
```

**✅ Best Practice: Logic in Hooks**

```typescript
// hooks/useDiagnostic.ts
export function useDiagnostic(jobId: string) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['diagnostic', jobId, 'messages'],
    queryFn: () => diagnosticService.getMessages(jobId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      diagnosticService.sendMessage(jobId, message),
    onSuccess: (newMessage) => {
      queryClient.setQueryData(
        ['diagnostic', jobId, 'messages'],
        (old: Message[]) => [...old, newMessage]
      );
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading || sendMessageMutation.isLoading,
    error: messagesQuery.error ?? sendMessageMutation.error,
    sendMessage: sendMessageMutation.mutate,
  };
}

// screens/DiagnosticScreen.tsx
function DiagnosticScreen({ jobId }: Props) {
  const diagnostic = useDiagnostic(jobId);

  return (
    <View>
      {diagnostic.isLoading && <LoadingSpinner />}
      {diagnostic.error && <ErrorMessage error={diagnostic.error} />}
      <MessageList messages={diagnostic.messages} />
      <MessageInput onSend={diagnostic.sendMessage} />
    </View>
  );
}
```

**Why:**

- Component is purely presentational (easy to understand, easy to change)
- Business logic is reusable
- State management is encapsulated
- Testing is straightforward (test hook, not component)

### Pattern 2: Service Layer (Pure Business Logic)

Services contain business logic with **no React dependencies**:

**✅ Best Practice: Service Layer**

```typescript
// services/diagnosticService.ts
import { apiClient } from '@/lib/api';
import type { DiagnosticMessage, DiagnosticResponse } from '../types';

class DiagnosticService {
  /**
   * Send a diagnostic message and get AI response
   */
  async sendMessage(
    jobId: string,
    message: string,
    context?: EquipmentContext
  ): Promise<DiagnosticResponse> {
    const payload = this.buildMessagePayload(message, context);
    const response = await apiClient.post<DiagnosticResponse>(`/jobs/${jobId}/diagnostic`, payload);
    return this.normalizeResponse(response);
  }

  /**
   * Get diagnostic history for a job
   */
  async getMessages(jobId: string): Promise<DiagnosticMessage[]> {
    const response = await apiClient.get<DiagnosticMessage[]>(`/jobs/${jobId}/diagnostic/messages`);
    return response.map(this.normalizeMessage);
  }

  // Private helper methods
  private buildMessagePayload(message: string, context?: EquipmentContext): MessagePayload {
    return {
      message: message.trim(),
      timestamp: new Date().toISOString(),
      equipment_context: context
        ? {
            manufacturer: context.manufacturer,
            model: context.model,
            system_type: context.systemType,
          }
        : undefined,
    };
  }

  private normalizeResponse(raw: any): DiagnosticResponse {
    return {
      id: raw.id,
      content: raw.content,
      confidence: raw.confidence_score,
      suggestions: raw.next_steps?.map(this.normalizeSuggestion) ?? [],
      timestamp: new Date(raw.created_at),
    };
  }

  private normalizeMessage(raw: any): DiagnosticMessage {
    // Transform API response to app domain model
  }

  private normalizeSuggestion(raw: any): Suggestion {
    // Transform suggestion data
  }
}

// Export singleton instance
export const diagnosticService = new DiagnosticService();
```

**Why:**

- Pure functions are easy to test (no mocking React)
- Can be used in hooks, components, or background jobs
- Business logic is explicit and documented
- Clear separation: Service = "what", Hook = "when", Component = "how"

### Pattern 3: Component Composition

Build screens from small, focused components:

**❌ Anti-pattern: Monolithic Component**

```typescript
function DiagnosticScreen({
  messages,
  onSendMessage,
  equipment,
  onEquipmentChange,
  mode,
  onModeChange,
  isLoading,
  error,
  // ... 15 more props
}: DiagnosticScreenProps) {
  return (
    <View style={styles.container}>
      {/* 500 lines of JSX */}
    </View>
  );
}
```

**✅ Best Practice: Composed Components**

```typescript
// screens/DiagnosticScreen.tsx (< 200 lines)
import { DiagnosticHeader } from '../components/DiagnosticHeader';
import { MessageList } from '../components/MessageList';
import { DiagnosticInput } from '../components/DiagnosticInput';
import { EquipmentBanner } from '@/features/equipment/components/EquipmentBanner';

interface Props {
  jobId: string;
}

export function DiagnosticScreen({ jobId }: Props) {
  const diagnostic = useDiagnostic(jobId);
  const equipment = useCurrentEquipment(jobId);

  return (
    <View style={styles.container}>
      <DiagnosticHeader
        mode={diagnostic.mode}
        onModeChange={diagnostic.setMode}
      />

      {equipment.data && (
        <EquipmentBanner equipment={equipment.data} />
      )}

      <MessageList
        messages={diagnostic.messages}
        isLoading={diagnostic.isLoading}
      />

      <DiagnosticInput
        onSendMessage={diagnostic.sendMessage}
        onSendImage={diagnostic.sendImage}
        disabled={diagnostic.isLoading}
      />
    </View>
  );
}

// Each component is 50-100 lines, focused on one thing
```

### Pattern 4: Type-Safe API Client

**✅ Best Practice: Centralized API Client**

```typescript
// lib/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { storage } from '@/lib/storage';
import type { ApiError, ApiResponse } from './types';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor: add auth token
    this.client.interceptors.request.use(async (config) => {
      const token = await storage.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: normalize errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => Promise.reject(this.normalizeError(error))
    );
  }

  private normalizeError(error: AxiosError): ApiError {
    if (error.response) {
      return {
        type: 'api_error',
        status: error.response.status,
        message: error.response.data?.message ?? 'Request failed',
        details: error.response.data,
      };
    } else if (error.request) {
      return {
        type: 'network_error',
        message: 'No response from server. Check your connection.',
      };
    } else {
      return {
        type: 'unknown_error',
        message: error.message,
      };
    }
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url);
    return response.data.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data.data;
  }
}

export const apiClient = new ApiClient(ENV.API_URL);
```

## TypeScript Standards

### Strict Configuration

Always use TypeScript strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Type Rules

1. **No `any` types** - Use `unknown` if type is truly unknown
2. **Explicit return types** on all public functions
3. **Use type inference** for local variables
4. **Prefer interfaces** for public APIs, types for unions/intersections

**Examples:**

```typescript
// ✅ Good: Explicit return type
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Good: Type inference for local variables
const total = calculateTotal(items); // TypeScript infers number

// ✅ Good: Interface for public API
export interface DiagnosticMessage {
  id: string;
  content: string;
  timestamp: Date;
}

// ✅ Good: Type for unions
export type DiagnosticMode = 'guided' | 'expert' | 'quick';

// ❌ Bad: Using any
function processData(data: any) {
  // Don't do this
  return data.foo;
}

// ✅ Good: Using unknown with type guard
function processData(data: unknown): string {
  if (isValidData(data)) {
    return data.foo;
  }
  throw new Error('Invalid data');
}

function isValidData(data: unknown): data is { foo: string } {
  return typeof data === 'object' && data !== null && 'foo' in data;
}
```

## Naming Conventions

### Files

```
kebab-case.ts          # Utility files, services, etc.
PascalCase.tsx         # Component files (match component name)
useCamelCase.ts        # Hook files
```

### Code

```typescript
// Components: PascalCase
export function DiagnosticScreen() {}

// Hooks: useCamelCase
export function useDiagnostic() {}

// Services: camelCase singleton
export const diagnosticService = new DiagnosticService();

// Constants: UPPER_SNAKE_CASE
export const MAX_MESSAGE_LENGTH = 500;
export const API_TIMEOUT = 30000;

// Types/Interfaces: PascalCase
export interface DiagnosticMessage {}
export type DiagnosticMode = 'guided' | 'expert' | 'quick';

// Functions: camelCase
export function formatMessage(message: string): string {}

// Private methods: camelCase with underscore prefix (optional)
private _buildPayload() {}
```

## Import Organization

Organize imports in this order:

```typescript
// 1. External dependencies (React, libraries)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';

// 2. Internal absolute imports (@ prefix for src/)
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

// 3. Relative imports (same feature)
import { useDiagnostic } from '../hooks/useDiagnostic';
import { diagnosticService } from '../services/diagnosticService';
import type { DiagnosticMode, DiagnosticMessage } from '../types';

// 4. Assets
import Logo from '@/assets/logo.png';

// 5. Styles (if not inline)
import styles from './styles';
```

## Error Handling

### Consistent Error Types

```typescript
// lib/errors/types.ts
export type AppError =
  | { type: 'network_error'; message: string }
  | { type: 'api_error'; status: number; message: string; details?: any }
  | { type: 'validation_error'; field: string; message: string }
  | { type: 'unknown_error'; message: string };

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### Error Boundaries

Wrap features in error boundaries:

```typescript
// lib/errors/ErrorBoundary.tsx
import React from 'react';
import * as Sentry from '@sentry/react-native';

export class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error!} reset={this.reset} />;
    }
    return this.props.children;
  }

  private reset = () => {
    this.setState({ hasError: false, error: null });
  };
}
```

## Testing Standards

### What to Test

**✅ Do test:**

- Services (business logic)
- Utility functions
- Custom hooks
- Complex components

**❌ Don't test:**

- Simple presentational components
- Third-party libraries
- Obvious React behavior
- Styles

### Service Tests (Unit Tests)

```typescript
// services/__tests__/diagnosticService.test.ts
import { diagnosticService } from '../diagnosticService';
import { apiClient } from '@/lib/api';

jest.mock('@/lib/api');

describe('DiagnosticService', () => {
  describe('sendMessage', () => {
    it('should send message with correct payload', async () => {
      const mockResponse = { id: '1', content: 'response' };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      await diagnosticService.sendMessage('job-1', 'test message');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/jobs/job-1/diagnostic',
        expect.objectContaining({
          message: 'test message',
          timestamp: expect.any(String),
        })
      );
    });

    it('should include equipment context when provided', async () => {
      const context = {
        manufacturer: 'Carrier',
        model: '24ACC6',
        systemType: 'split_system',
      };

      await diagnosticService.sendMessage('job-1', 'test', context);

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          equipment_context: expect.objectContaining({
            manufacturer: 'Carrier',
          }),
        })
      );
    });
  });
});
```

### Hook Tests (Integration Tests)

```typescript
// hooks/__tests__/useDiagnostic.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useDiagnostic } from '../useDiagnostic';
import { diagnosticService } from '../../services/diagnosticService';

jest.mock('../../services/diagnosticService');

describe('useDiagnostic', () => {
  it('should fetch messages on mount', async () => {
    const mockMessages = [{ id: '1', content: 'test' }];
    (diagnosticService.getMessages as jest.Mock).mockResolvedValue(mockMessages);

    const { result } = renderHook(() => useDiagnostic('job-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.messages).toEqual(mockMessages);
  });
});
```

## Performance Guidelines

### Component Optimization

```typescript
// ✅ Good: Memoize expensive components
export const MessageList = React.memo(function MessageList({
  messages
}: Props) {
  return (
    <FlashList
      data={messages}
      renderItem={renderMessage}
      estimatedItemSize={100}
    />
  );
});

// ✅ Good: Use useCallback for callbacks passed to children
function DiagnosticScreen() {
  const handleSendMessage = useCallback((message: string) => {
    diagnosticService.sendMessage(message);
  }, []);

  return <MessageInput onSend={handleSendMessage} />;
}
```

### List Rendering

```typescript
// ✅ Good: Use FlashList for large lists
import { FlashList } from '@shopify/flash-list';

function MessageList({ messages }: Props) {
  return (
    <FlashList
      data={messages}
      renderItem={({ item }) => <MessageItem message={item} />}
      estimatedItemSize={100}
      keyExtractor={(item) => item.id}
    />
  );
}

// ❌ Bad: Don't use FlatList for large lists
```

## Code Review Checklist

Before committing, verify:

- [ ] No files exceed size limits
- [ ] All public functions have explicit return types
- [ ] No `any` types
- [ ] Imports are organized correctly
- [ ] No console.logs left in code
- [ ] Services have tests
- [ ] TypeScript has zero errors
- [ ] ESLint has zero warnings
- [ ] Component props have interface definitions
- [ ] Error handling is present
- [ ] Loading states are handled

## Resources

- Review `src/features/_example/` for reference implementations
- Read [FEATURE_DEVELOPMENT.md](./FEATURE_DEVELOPMENT.md) before building features
- Refer to [ARCHITECTURE.md](./ARCHITECTURE.md) for high-level patterns
