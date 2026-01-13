# Architecture Overview

## Vision

HVACOps is an AI-powered mobile application for HVAC technicians, providing on-demand diagnostic help, parts identification, and technical knowledge in the field.

## Core Principles

Our architecture is guided by these principles:

1. **Feature-based architecture** - Organize by feature, not by technical layer
2. **Composition over configuration** - Small, focused modules that compose together
3. **Explicit over implicit** - Clear data flow, no magic
4. **Colocate related code** - Features are self-contained
5. **Progressive enhancement** - Build simple, add complexity only when needed
6. **Type safety everywhere** - TypeScript strict mode, runtime validation
7. **Local-first** - App works offline, syncs when online
8. **Separation of concerns** - Business logic separate from UI

## Technology Stack

- **Framework**: React Native with Expo (managed workflow)
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Query (server state) + React Context (local state)
- **Database**: WatermelonDB (local-first, reactive)
- **AI Integration**: Anthropic Claude API (with context injection)
- **Styling**: NativeWind (Tailwind for React Native)

See [TECH_STACK.md](./TECH_STACK.md) for detailed rationale.

## Project Structure

```
hvac-ai/
├── src/
│   ├── app/                       # Expo Router - app screens
│   │   ├── _layout.tsx           # Root layout
│   │   ├── (auth)/               # Auth flow screens
│   │   └── (main)/               # Main app screens
│   │
│   ├── features/                  # Feature modules
│   │   ├── _example/             # Reference implementation
│   │   ├── diagnostic/           # AI diagnostic assistant
│   │   ├── equipment/            # Equipment management
│   │   ├── parts/                # Parts identification
│   │   └── job-notes/            # Job documentation
│   │
│   ├── lib/                       # Shared infrastructure
│   │   ├── api/                  # API client
│   │   ├── storage/              # Local database
│   │   ├── ai/                   # AI client wrapper
│   │   ├── sync/                 # Offline sync
│   │   └── utils/                # Pure utility functions
│   │
│   ├── ui/                        # Design system components
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Card/
│   │
│   ├── hooks/                     # Global hooks
│   ├── providers/                 # Context providers
│   └── types/                     # Global types
│
├── docs/                          # Documentation
├── scripts/                       # Development scripts
└── assets/                        # Static assets
```

## Feature Module Architecture

Each feature is a self-contained module with clear boundaries:

```
features/[feature-name]/
├── components/       # Feature-specific UI components
├── hooks/           # Feature-specific hooks (business logic)
├── screens/         # Screen components
├── services/        # Business logic (pure, no React)
├── types.ts         # TypeScript types
├── index.ts         # Public API - only exports what's needed externally
└── __tests__/       # Tests
```

**Key concepts:**

- **Services** contain pure business logic (no React dependencies)
- **Hooks** manage state and side effects (use services internally)
- **Components** are purely presentational (use hooks for data)
- **Public API** (`index.ts`) explicitly defines what other features can import

Example:

```typescript
// ✅ Good: Other features import from public API
import { useDiagnostic } from '@/features/diagnostic';

// ❌ Bad: Don't reach into internal implementation
import { DiagnosticService } from '@/features/diagnostic/services/diagnosticService';
```

## Data Flow Architecture

### Server State (React Query)

All data from the API flows through React Query:

```
API ← → React Query ← → Custom Hook ← → Component
                ↓
          Local Cache
```

**Benefits:**

- Automatic caching and revalidation
- Loading and error states handled automatically
- Request deduplication
- Background refetching

### Local State (WatermelonDB)

All persistent data is stored locally first:

```
User Action → Service → WatermelonDB → Sync Queue → API
                             ↓
                       Component (reactive)
```

**Benefits:**

- Works offline by default
- Instant UI updates
- Automatic reactivity
- Syncs in background

### Component State (React)

Ephemeral UI state uses React hooks:

```
Component → useState/useReducer → Component
```

## Layered Architecture

Our code is organized in layers, with clear dependencies:

```
┌─────────────────────────────────┐
│   Screens (Expo Router)         │  app/
├─────────────────────────────────┤
│   Feature Modules                │  features/
│   ├── Components                 │
│   ├── Hooks (use services)       │
│   └── Services (pure logic)      │
├─────────────────────────────────┤
│   Shared Infrastructure          │  lib/
│   ├── API Client                 │
│   ├── Database                   │
│   └── Utilities                  │
├─────────────────────────────────┤
│   UI Components (Design System)  │  ui/
└─────────────────────────────────┘
```

**Dependency rules:**

- Higher layers can depend on lower layers
- Lower layers cannot depend on higher layers
- Features should not depend on other features (use composition instead)

## Key Patterns

### 1. Custom Hooks for Business Logic

**Don't** put business logic in components:

```typescript
// ❌ Anti-pattern
function DiagnosticScreen() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetch('/api/messages').then(res => res.json()).then(setMessages);
  }, []);

  return <MessageList messages={messages} />;
}
```

**Do** extract logic to custom hooks:

```typescript
// ✅ Best practice
function DiagnosticScreen() {
  const { messages, isLoading } = useDiagnostic();
  return <MessageList messages={messages} isLoading={isLoading} />;
}

// In hooks/useDiagnostic.ts
function useDiagnostic() {
  return useQuery({
    queryKey: ['diagnostic', 'messages'],
    queryFn: () => diagnosticService.getMessages(),
  });
}
```

### 2. Service Layer for Pure Logic

Services contain pure business logic with no React dependencies:

```typescript
// services/diagnosticService.ts
class DiagnosticService {
  async sendMessage(jobId: string, message: string): Promise<DiagnosticResponse> {
    const payload = this.buildPayload(message);
    const response = await apiClient.post(`/jobs/${jobId}/diagnostic`, payload);
    return this.normalizeResponse(response);
  }

  private buildPayload(message: string) {
    // Business logic here
  }

  private normalizeResponse(raw: any): DiagnosticResponse {
    // Transform API response to domain model
  }
}

export const diagnosticService = new DiagnosticService();
```

**Benefits:**

- Easy to test (no mocking React)
- Reusable across hooks and components
- Clear separation of concerns

### 3. Component Composition

Build small, focused components that compose together:

```typescript
// ✅ Good: Composed from small components
function DiagnosticScreen() {
  return (
    <View>
      <DiagnosticHeader />
      <EquipmentBanner />
      <MessageList />
      <DiagnosticInput />
    </View>
  );
}

// Each component is 50-100 lines, focused on one thing
```

### 4. Type-Safe API Client

Single centralized API client with interceptors:

```typescript
// lib/api/client.ts
class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({ baseURL });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Add auth token to all requests
    this.client.interceptors.request.use(async (config) => {
      const token = await storage.getAuthToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Normalize errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(this.normalizeError(error))
    );
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url);
    return response.data.data;
  }

  // ... post, put, delete
}

export const apiClient = new ApiClient(ENV.API_URL);
```

### 5. Error Boundaries

Wrap features in error boundaries for graceful failure:

```typescript
function App() {
  return (
    <ErrorBoundary fallback={<ErrorScreen />}>
      <DiagnosticScreen />
    </ErrorBoundary>
  );
}
```

## AI Integration Architecture

Our AI integration uses **context injection**, not model training:

```
User Question
    ↓
Equipment Context
    ↓
Query Vector DB ← Knowledge Base (HVAC expertise)
    ↓
Top N Relevant Chunks
    ↓
Build Prompt (System + Context + Question)
    ↓
Claude API
    ↓
Response
```

**Key components:**

- **Knowledge Base**: Curated HVAC content (diagnostics, specs, procedures)
- **Vector DB**: Pinecone or Weaviate for semantic search
- **Embeddings**: Convert knowledge to vectors for search
- **Context Injection**: Relevant knowledge added to each Claude API call
- **Prompt Engineering**: Carefully crafted system prompts

## Offline-First Strategy

The app is designed to work without internet:

1. **All data stored locally first** (WatermelonDB)
2. **Sync queue** for operations that need server
3. **Optimistic updates** for better UX
4. **Background sync** when connection available
5. **Conflict resolution** for multi-device usage

See [ADR 003](./adr/003-offline-first.md) for details.

## Security Considerations

- **API keys**: Never in client code (use backend proxy)
- **Authentication**: JWT tokens, stored securely
- **Data encryption**: Sensitive data encrypted at rest
- **HTTPS only**: All network requests
- **Input validation**: Both client and server side

## Performance Guidelines

- **Bundle size**: Keep under 5MB for fast downloads
- **Startup time**: Target < 3 seconds on mid-range devices
- **60 FPS**: Use native components, optimize re-renders
- **Image optimization**: Use Expo Image for automatic optimization
- **List rendering**: Use FlashList for large lists

## Testing Strategy

```
         E2E Tests (5%)        ← Critical user flows
           /\
          /  \
    Integration Tests (25%)    ← Hooks, complex components
       /        \
      /          \
  Unit Tests (70%)             ← Services, utilities, pure functions
```

- **Unit tests**: Services, utilities (Jest)
- **Integration tests**: Hooks, components (React Testing Library)
- **E2E tests**: Critical flows (Maestro or Detox)

## Deployment Architecture

- **App Distribution**: Expo EAS Build → App Stores
- **OTA Updates**: Expo Updates for JavaScript changes
- **Backend**: API hosted on Railway/Render/AWS
- **Database**: PostgreSQL (Supabase or RDS)
- **Vector DB**: Pinecone or Weaviate (cloud)
- **File Storage**: S3 or Cloudflare R2
- **Monitoring**: Sentry for error tracking

## Next Steps

- Review [CODING_STANDARDS.md](./CODING_STANDARDS.md) for code organization
- Read [FEATURE_DEVELOPMENT.md](./FEATURE_DEVELOPMENT.md) before building features
- Explore `src/features/_example/` for reference implementation
