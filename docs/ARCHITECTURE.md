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

**Current Implementation:**

- **Framework**: React Native with Expo (managed workflow)
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation (stack + bottom tab navigation)
- **State Management**: React Query (server state) + React Context (local state)
- **Database**: AsyncStorage (key-value persistence)
- **AI Integration**: Mock diagnostic responses (Claude API integration planned)
- **Styling**: React Native StyleSheet with design tokens

**Planned Upgrades:**

- **Navigation**: Migration to Expo Router for file-based routing
- **Database**: WatermelonDB for local-first reactive data
- **AI Integration**: Anthropic Claude API with vector DB context injection
- **Styling**: NativeWind (Tailwind for React Native)

See [TECH_STACK.md](./TECH_STACK.md) for detailed rationale.

## Project Structure

```
hvac-ai/
├── src/
│   ├── navigation/                # React Navigation setup
│   │   ├── RootNavigator.tsx     # Stack navigator with auth flow
│   │   ├── TabNavigator.tsx      # Bottom tab navigation (role-based)
│   │   └── types.ts              # Navigation type definitions
│   │
│   ├── screens/                   # Top-level screens
│   │   ├── CopilotScreen.tsx     # AI copilot tab (diagnostic history)
│   │   ├── EquipmentScreen.tsx   # Equipment list screen
│   │   └── SettingsScreen.tsx    # Settings with logout
│   │
│   ├── features/                  # Feature modules
│   │   ├── _example/             # Reference implementation
│   │   ├── auth/                 # Authentication (login, signup, logout)
│   │   ├── clients/              # Client management
│   │   ├── jobs/                 # Job/appointment management with assignment
│   │   ├── equipment/            # Equipment management
│   │   ├── diagnostic/           # AI diagnostic assistant (collaborative)
│   │   ├── technicians/          # Technician & company management
│   │   └── company/              # Company entity
│   │
│   ├── lib/                       # Shared infrastructure
│   │   ├── api/                  # API client with auth token injection
│   │   ├── storage/              # Auth storage (AsyncStorage)
│   │   ├── migrations/           # Data migrations (equipment, multi-tenant)
│   │   ├── types/                # Global types (Auditable interface)
│   │   └── utils/                # Utility functions
│   │
│   ├── components/ui/             # Design system components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── HeroSection.tsx
│   │   ├── Spinner.tsx
│   │   └── tokens.ts             # Design tokens (colors, spacing, typography)
│   │
│   ├── hooks/                     # Global hooks
│   │   └── useMigrations.ts      # Data migration hook
│   ├── providers/                 # Context providers
│   │   ├── AuthProvider.tsx      # Global auth state
│   │   └── index.ts
│   └── types/                     # Global types
│
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md
│   ├── CODING_STANDARDS.md
│   ├── FEATURE_DEVELOPMENT.md
│   └── DESIGN_PRINCIPLES.md
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
import { diagnosticService } from '@/features/diagnostic/services/diagnosticService';
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
│   Screens & Navigation           │  navigation/, screens/
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
│   UI Components (Design System)  │  components/ui/
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

**Current MVP Implementation:**

The diagnostic feature currently uses mock AI responses with professional HVAC knowledge hardcoded into the service layer. This allows for rapid feature development and UI/UX refinement without API dependencies.

**Planned Production Architecture:**

Our production AI integration will use **context injection**, not model training:

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

## Offline-First Strategy (Planned)

The app is designed to work without internet (implementation in progress):

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

## Authentication Architecture

**Fully Implemented:** Login, signup, logout, session management with secure token storage.

### Token Flow

```
User Login → authService.login() → JWT Token + User Data
    ↓
AsyncStorage (authStorage.ts)
    ↓
AuthProvider (React Context) → Global auth state
    ↓
RootNavigator checks isAuthenticated
    ↓
- Not authenticated: Show Auth Screens (Login/Signup)
- Authenticated: Show Main App (TabNavigator + Screens)
```

### Key Components

**AuthProvider** (`src/providers/AuthProvider.tsx`):

- Global React Context providing auth state to entire app
- Manages user session, token, and authentication status
- Handles initialization (checks AsyncStorage for existing session)
- Exposes `useAuth()` hook for accessing auth state

**authStorage** (`src/lib/storage/authStorage.ts`):

- Secure storage using AsyncStorage
- Methods: `getAuthToken()`, `setAuthToken()`, `getUserData()`, `setUserData()`, `clearAuthData()`
- Persists across app restarts

**authService** (`src/features/auth/services/authService.ts`):

- Business logic for authentication operations
- Methods: `login()`, `signup()`, `logout()`, `refreshToken()`
- Mock implementation for MVP (accepts any credentials)
- Returns `AuthResponse` with token, user, and expiry

### Auth User Model

```typescript
interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  role: TechnicianRole; // admin, lead_tech, technician, office_staff
}
```

### Protected Routes

**RootNavigator** conditionally renders screens based on `isAuthenticated`:

```typescript
{isAuthenticated ? (
  <>
    <Stack.Screen name="Main" component={TabNavigator} />
    <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
    {/* ... other authenticated screens */}
  </>
) : (
  <>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </>
)}
```

### Role-Based Access

Roles determine:

- **Tab visibility**: Admins see Technicians tab, others don't
- **Feature access**: Job assignment only for admins
- **UI elements**: Edit/delete buttons based on permissions

Access roles via `useAuth()` hook:

```typescript
const { user } = useAuth();
const isAdmin = user?.role === 'admin';
```

## Multi-Tenant Data Model

**Fully Implemented:** Company-based data isolation with technician management.

### Entity Hierarchy

```
Company (Top Level)
  ↓
  ├── Technicians (employees)
  │   ├── Admin (full access)
  │   ├── Lead Tech (assign jobs, view all)
  │   ├── Technician (own jobs only)
  │   └── Office Staff (scheduling, clients)
  │
  └── Data (isolated by companyId)
      ├── Clients
      ├── Jobs
      ├── Equipment
      └── Diagnostic Sessions
```

### Company Model

```typescript
interface Company {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Technician Model

```typescript
type TechnicianRole = 'admin' | 'lead_tech' | 'technician' | 'office_staff';
type TechnicianStatus = 'active' | 'inactive' | 'on_leave';

interface Technician {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: TechnicianRole;
  status: TechnicianStatus;
  certifications: Certification[];
  licenseNumber?: string;
  licenseExpiry?: Date;
  hireDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Data Isolation Pattern

All entities include `companyId` for isolation:

```typescript
interface Client {
  id: string;
  companyId: string; // ← Isolates data by company
  name: string;
  // ... other fields
}
```

Services filter by company:

```typescript
// clientService.ts
async getAll(companyId: string, filters?: ClientFilters): Promise<ClientListResponse> {
  // Filter clients by companyId
  const companyClients = Array.from(this.clients.values())
    .filter(client => client.companyId === companyId);
  // ... apply additional filters
}
```

Hooks get companyId from auth context:

```typescript
export function useClients(filters?: ClientFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clients', user.companyId, filters],
    queryFn: () => clientService.getAll(user.companyId, filters),
  });
}
```

### Audit Trail

All entities extend `Auditable` interface:

```typescript
interface Auditable {
  createdBy: string; // Technician ID
  createdByName?: string; // Cached for display
  createdAt: Date;
  modifiedBy: string; // Technician ID
  modifiedByName?: string; // Cached for display
  updatedAt: Date;
}
```

Every create/update operation tracks who made the change:

```typescript
async create(companyId: string, technicianId: string, technicianName: string, data: ClientFormData) {
  const client: Client = {
    id: generateId(),
    companyId,
    ...data,
    createdBy: technicianId,
    createdByName: technicianName,
    createdAt: new Date(),
    modifiedBy: technicianId,
    modifiedByName: technicianName,
    updatedAt: new Date(),
  };
  // ... save client
}
```

Displayed in detail screens:

```
History Section:
- Created by: John Smith • Jan 15, 2024
- Last modified: Alice Johnson • Jan 20, 2024
```

## Job Assignment Workflow

**Fully Implemented:** Admin assigns jobs to technicians, techs accept/decline, track status.

### Assignment Status Flow

```
unassigned → assigned → accepted → in_progress → completed
               ↓
            declined
```

### Job Assignment Model

```typescript
export interface JobAssignment {
  technicianId: string;
  technicianName: string;
  assignedAt: Date;
  assignedBy: string; // Admin who assigned
  assignedByName: string;
  acceptedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
}

export interface Job extends Auditable {
  id: string;
  companyId: string;
  clientId: string;
  status: AppointmentStatus; // includes assignment statuses
  assignment?: JobAssignment; // Present when job is assigned
  // ... other fields
}
```

### Assignment Operations

**Admin assigns job:**

```typescript
// jobService.ts
async assign(
  jobId: string,
  technicianId: string,
  technicianName: string,
  assignedBy: string,
  assignedByName: string
): Promise<Job> {
  const job = this.jobs.get(jobId);

  job.assignment = {
    technicianId,
    technicianName,
    assignedAt: new Date(),
    assignedBy,
    assignedByName,
  };
  job.status = 'assigned'; // Pending acceptance

  this.jobs.set(jobId, job);
  return job;
}
```

**Technician accepts job:**

```typescript
async accept(jobId: string, technicianId: string): Promise<Job> {
  const job = this.jobs.get(jobId);

  if (!job.assignment || job.assignment.technicianId !== technicianId) {
    throw new Error('Not authorized to accept this job');
  }

  job.assignment.acceptedAt = new Date();
  job.status = 'accepted';

  this.jobs.set(jobId, job);
  return job;
}
```

**Technician declines job:**

```typescript
async decline(jobId: string, technicianId: string, reason?: string): Promise<Job> {
  const job = this.jobs.get(jobId);

  job.assignment.declinedAt = new Date();
  job.assignment.declineReason = reason;
  job.status = 'declined';

  this.jobs.set(jobId, job);
  return job;
}
```

### UI Components

**TodaysJobsScreen** - Filter toggle:

- "All Jobs" - Shows all company jobs (admin view)
- "My Jobs" - Shows only assigned-to-current-user jobs (tech view)

**JobCard** - Shows assignment info:

- Assignment badge (assigned/accepted/declined)
- Technician name if assigned
- Visual indicator if job is yours

**JobDetailScreen** - Assignment section:

- Shows assigned technician with avatar
- Assignment status badge
- Accept/Decline buttons (if assigned to current user and status is "assigned")
- Assign button (if admin and job is unassigned)

**AssignJobModal** - Technician picker:

- List of available technicians
- Shows current workload for each
- Search/filter technicians
- Assign button to complete assignment

### React Query Patterns

```typescript
// Get jobs assigned to current user
export function useMyJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.myJobs(user!.companyId, user!.id),
    queryFn: () => jobService.getByTechnician(user!.companyId, user!.id),
  });
}

// Assign job mutation
export function useAssignJob() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, technicianId, technicianName }) =>
      jobService.assign(
        jobId,
        technicianId,
        technicianName,
        user!.id,
        `${user!.firstName} ${user!.lastName}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all() });
    },
  });
}
```

## Collaborative Diagnostic Architecture

**Fully Implemented:** Multi-participant AI chat sessions with real-time collaboration.

### Collaborative Session Model

```typescript
export type ParticipantRole = 'primary' | 'invited' | 'ai';

export interface Participant {
  id: string; // 'ai' or technician ID
  role: ParticipantRole;
  name: string;
  joinedAt: Date;
  leftAt?: Date;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;

  // Sender attribution for collaborative sessions
  senderId?: string; // Technician ID (undefined for AI)
  senderName?: string;
  senderRole?: ParticipantRole;
}

export interface DiagnosticSession {
  id: string;
  companyId: string;
  messages: Message[];

  // Collaborative features
  participants: Participant[]; // Includes AI + all techs
  isCollaborative: boolean; // True if >1 human participant

  // ... other fields
}
```

### Collaboration Flow

**1. Junior tech starts session:**

```typescript
// diagnosticService.ts - createSession()
const participants: Participant[] = [
  {
    id: 'ai',
    role: 'ai',
    name: 'HVAC.ai',
    joinedAt: now,
  },
  {
    id: technicianId,
    role: 'primary', // Session creator
    name: technicianName,
    joinedAt: now,
  },
];

const session = {
  // ... session fields
  participants,
  isCollaborative: false, // Only 1 human initially
};
```

**2. Junior tech invites senior tech:**

```typescript
// diagnosticService.ts - inviteTechnician()
async inviteTechnician(
  sessionId: string,
  invitedTechnicianId: string,
  invitedTechnicianName: string,
  invitedBy: string,
  invitedByName: string
): Promise<DiagnosticSession> {
  const session = await this.getSession(sessionId);

  // Add new participant
  const newParticipant: Participant = {
    id: invitedTechnicianId,
    role: 'invited',
    name: invitedTechnicianName,
    joinedAt: new Date(),
  };
  session.participants.push(newParticipant);

  // Add system message
  const systemMessage: Message = {
    id: this.generateMessageId(),
    role: 'user',
    content: `${invitedTechnicianName} joined the conversation`,
    timestamp: new Date(),
    senderId: 'system',
    senderName: 'System',
    senderRole: 'ai',
  };
  session.messages.push(systemMessage);

  // Update collaborative flag
  const humanParticipants = session.participants.filter(p => p.id !== 'ai' && !p.leftAt);
  session.isCollaborative = humanParticipants.length > 1;

  return session;
}
```

**3. Send message with attribution:**

```typescript
// diagnosticService.ts - addMessageToSession()
async addMessageToSession(
  sessionId: string,
  request: SendMessageRequest,
  senderId?: string,
  senderName?: string
): Promise<DiagnosticSession> {
  const session = await this.getSession(sessionId);

  // Find sender's participant role
  const senderParticipant = session.participants.find(p => p.id === senderId);
  const senderRole = senderParticipant?.role;

  // Add user message with sender attribution
  const userMessage: Message = {
    id: this.generateMessageId(),
    role: 'user',
    content: request.content,
    timestamp: new Date(),
    senderId,
    senderName,
    senderRole,
  };
  session.messages.push(userMessage);

  // Generate AI response (visible to all participants)
  // ...
}
```

### UI Components

**DiagnosticChatScreen** - Main collaborative interface:

- **ParticipantsList**: Horizontal avatar list showing all active participants + AI
- **Invite button**: Opens InviteTechnicianModal
- **MessageList**: Shows messages with sender attribution
- **ChatInput**: Send messages (attributed to current user)

**ParticipantsList** - Shows who's in the session:

```
[Avatar: AI] [Avatar: You] [Avatar: Bob] [+ Invite]
```

- Circular avatars (32x32pt)
- AI has indigo background with sparkles icon
- Techs have primary background with person icon
- Online indicator (green dot) for active participants
- "Invite" button to add more techs

**MessageBubble** - Color-coded by participant role:

- **Primary tech** (session creator): Blue (#2563eb)
- **Invited techs**: Purple (#9333ea)
- **AI**: Indigo (#6366f1)
- **System messages**: Gray, centered

```tsx
{
  /* Sender name (only in collaborative mode) */
}
{
  isCollaborative && !isOwnMessage && (
    <Text style={[styles.senderName, { color: getSenderColor(role) }]}>{senderName}</Text>
  );
}

{
  /* Message bubble with role-based color */
}
<View style={[styles.bubble, { backgroundColor: getBubbleColor(role) }]}>
  <Text>{content}</Text>
</View>;
```

**InviteTechnicianModal** - Bottom sheet to select technician:

- Lists available technicians (excluding current participants)
- Shows role, certifications, online status
- Search/filter functionality
- Invite button sends invitation immediately

### React Query Hooks

```typescript
// Invite technician
export function useInviteTechnician() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, technicianId, technicianName }) =>
      diagnosticService.inviteTechnician(
        sessionId,
        technicianId,
        technicianName,
        user!.id,
        `${user!.firstName} ${user!.lastName}`
      ),
    onSuccess: (session) => {
      queryClient.setQueryData(QUERY_KEYS.session(session.id), session);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

// Leave session
export function useLeaveSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => diagnosticService.leaveSession(sessionId, user!.id),
    onSuccess: (session) => {
      queryClient.setQueryData(QUERY_KEYS.session(session.id), session);
    },
  });
}
```

### System Messages

Special messages for join/leave events:

```
• Alice Johnson joined the conversation
• Bob Wilson left the conversation
```

- Centered, italic, gray text
- Small font size
- Timestamp in parentheses
- No bubble, no sender attribution

### 3-Way Conversation Example

```
[Alice - Blue bubble]
The AC unit isn't cooling properly. Compressor is running but no cold air.

[AI - Indigo bubble]
Let's check the refrigerant level first. What's the pressure reading on the suction line?

[Alice - Blue bubble]
I don't have a gauge with me. Should I get one?

[Bob - Purple bubble]
@Alice I'm nearby and have a gauge. What's the address? I can help.

[Alice - Blue bubble]
123 Main St. Thanks Bob!

[AI - Indigo bubble]
Great teamwork. Bob, when you arrive, check both suction and discharge pressures.
```

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
