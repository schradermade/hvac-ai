# ADR 003: Offline-First Architecture

**Status**: Accepted
**Date**: 2026-01-11
**Decision Makers**: Technical Team
**Tags**: architecture, offline, data-sync

## Context

HVAC technicians work in environments with poor or no internet connectivity:

- **Basements** (concrete walls block signal)
- **Crawlspaces** (underground, no signal)
- **Rural areas** (spotty coverage)
- **Large buildings** (thick walls, no cell service)

Our app must work reliably in these conditions. Techs cannot wait for connectivity to:

- Ask diagnostic questions
- View equipment information
- Take photos
- Document work

A traditional "online-only" app would be unusable for our target users.

## Decision

We will build an **offline-first architecture** using WatermelonDB for local data storage with background synchronization to the server.

## Architecture

### Data Flow

```
User Action
    ↓
Local Database (WatermelonDB) → UI Updates (Reactive)
    ↓
Sync Queue
    ↓
Background Sync (when online)
    ↓
API Server
```

### Key Principles

1. **Local First**: All data writes go to local database first
2. **Reactive UI**: UI updates automatically when local data changes
3. **Optimistic Updates**: Show changes immediately, sync in background
4. **Sync Queue**: Operations queue when offline, process when online
5. **Conflict Resolution**: Last-write-wins with timestamps

## Implementation

### WatermelonDB for Local Storage

```typescript
// lib/storage/database.ts
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'hvac_ai',
  jsi: true, // Performance boost
});

export const database = new Database({
  adapter,
  modelClasses: [Job, Equipment, Message, Photo],
});
```

### Model Definition

```typescript
// lib/storage/models/Job.ts
import { Model } from '@nozbe/watermelondb';
import { field, text, date, children } from '@nozbe/watermelondb/decorators';

export class Job extends Model {
  static table = 'jobs';
  static associations = {
    messages: { type: 'has_many', foreignKey: 'job_id' },
    photos: { type: 'has_many', foreignKey: 'job_id' },
  };

  @text('customer_name') customerName!: string;
  @text('address') address!: string;
  @text('status') status!: string;
  @date('scheduled_at') scheduledAt!: Date;
  @field('is_synced') isSynced!: boolean;
  @date('synced_at') syncedAt?: Date;

  @children('messages') messages!: Query<Message>;
  @children('photos') photos!: Query<Photo>;
}
```

### Sync Queue

```typescript
// lib/sync/syncQueue.ts
class SyncQueue {
  private queue: SyncOperation[] = [];

  async addOperation(operation: SyncOperation): Promise<void> {
    this.queue.push(operation);
    await this.persistQueue(); // Save to AsyncStorage
    if (await this.isOnline()) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    while (this.queue.length > 0 && (await this.isOnline())) {
      const operation = this.queue[0];

      try {
        await this.executeOperation(operation);
        this.queue.shift(); // Remove from queue
        await this.persistQueue();
      } catch (error) {
        if (this.isRetryableError(error)) {
          break; // Stop processing, try again later
        } else {
          // Non-retryable error, remove from queue
          this.queue.shift();
          await this.logError(operation, error);
        }
      }
    }
  }

  private async executeOperation(op: SyncOperation): Promise<void> {
    switch (op.type) {
      case 'CREATE':
        await apiClient.post(op.endpoint, op.data);
        break;
      case 'UPDATE':
        await apiClient.put(op.endpoint, op.data);
        break;
      case 'DELETE':
        await apiClient.delete(op.endpoint);
        break;
    }

    // Mark as synced in local database
    await database.write(async () => {
      const record = await database.get(op.table).find(op.localId);
      await record.update((r) => {
        r.isSynced = true;
        r.syncedAt = new Date();
      });
    });
  }
}

export const syncQueue = new SyncQueue();
```

### Network Status Listener

```typescript
// lib/sync/networkListener.ts
import NetInfo from '@react-native-community/netinfo';

export function setupNetworkListener(): void {
  NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      // Came back online, process sync queue
      syncQueue.processQueue();
    }
  });
}
```

### Usage in Features

```typescript
// features/diagnostic/hooks/useDiagnostic.ts
export function useDiagnostic(jobId: string) {
  // Observe local database (reactive)
  const messages = useDatabase(
    () =>
      database
        .get<Message>('messages')
        .query(Q.where('job_id', jobId), Q.sortBy('created_at', Q.asc)),
    [jobId]
  );

  const sendMessage = async (text: string) => {
    // 1. Write to local database (instant UI update)
    const newMessage = await database.write(async () => {
      return await database.get<Message>('messages').create((message) => {
        message.jobId = jobId;
        message.text = text;
        message.isSynced = false;
        message.createdAt = new Date();
      });
    });

    // 2. Queue for sync
    await syncQueue.addOperation({
      type: 'CREATE',
      table: 'messages',
      localId: newMessage.id,
      endpoint: `/jobs/${jobId}/messages`,
      data: { text, created_at: newMessage.createdAt },
    });

    // UI already updated from step 1 (reactive)
  };

  return { messages, sendMessage };
}
```

## Rationale

### Why Offline-First?

1. **Core Requirement**: Techs work in basements, crawlspaces, buildings with no signal
2. **Better UX**: App always works, no "loading" states for local data
3. **Faster**: Local reads are instant (no network latency)
4. **Reliability**: App works even if server is down

### Why WatermelonDB?

1. **Built for React Native**: First-class React integration
2. **Reactive**: UI updates automatically when data changes
3. **Fast**: Uses JSI for near-native performance
4. **Scalable**: Tested with 10,000+ records
5. **Sync Built-in**: Has synchronization primitives
6. **Lazy Loading**: Only loads data when needed

**Alternatives considered:**

- AsyncStorage: Too simple, not reactive, slow for complex queries
- SQLite directly: No reactivity, more boilerplate
- Realm: Good but heavier, WatermelonDB has better React integration

## Data Synchronization Strategy

### Sync Direction

1. **Local → Server**: Changes made offline sync when online
2. **Server → Local**: Pull updates from server periodically

### Conflict Resolution

**Strategy**: Last-Write-Wins (LWW) with timestamps

```typescript
// If local and server both modified same record
if (localRecord.updatedAt > serverRecord.updated_at) {
  // Local is newer, push to server
  await syncQueue.addOperation({ type: 'UPDATE', ... });
} else {
  // Server is newer, update local
  await database.write(async () => {
    await localRecord.update((r) => {
      Object.assign(r, serverRecord);
      r.isSynced = true;
    });
  });
}
```

**Why LWW?**

- Simple to implement
- Good enough for our use case (single user per device)
- Avoids complex merge logic

**Limitations:**

- If same record edited on multiple devices, last edit wins
- **Mitigation**: Most data is device-specific (messages tied to job, photos taken on device)

### Sync Triggers

1. **On app launch** (pull updates)
2. **When network returns** (process queued operations)
3. **Periodic background sync** (every 5 minutes when online)
4. **Manual refresh** (pull-to-refresh)

### What Gets Synced

**Synced bidirectionally:**

- Jobs (assigned jobs sync from server)
- Equipment data (shared across company)
- User profile

**Synced up only (local → server):**

- Messages (diagnostic conversations)
- Photos (uploaded to S3)
- Job notes
- Time tracking

**Never synced (local only):**

- App preferences
- UI state
- Cached AI responses

## Alternatives Considered

### Online-Only Architecture

**Pros**:

- Simpler implementation
- No sync complexity
- Always latest data

**Cons**:

- **Unusable in basements/crawlspaces** (dealbreaker)
- Requires constant connectivity
- Slow (every action requires network)
- Poor UX (loading spinners everywhere)

**Why rejected**: Core requirement is offline capability.

### Offline-Only with Email Export

**Pros**:

- Extremely simple
- No server needed
- Always works

**Cons**:

- No real-time collaboration
- Data loss if device is lost
- No analytics or insights
- Can't integrate with other systems

**Why rejected**: Need server integration for AI, parts lookup, team features.

### Firebase (Firestore Offline)

**Pros**:

- Offline built-in
- Real-time sync
- Managed service

**Cons**:

- **Vendor lock-in** (hard to migrate away)
- Limited query capabilities
- Expensive at scale
- NoSQL (harder to model relational data)
- Less control over sync logic

**Why rejected**: Want more control, prefer SQL, avoid vendor lock-in.

### Apollo Client with GraphQL

**Pros**:

- Great caching
- Offline mutations
- Active ecosystem

**Cons**:

- Requires GraphQL backend (we're using REST)
- More complex setup
- Cache management can be tricky

**Why rejected**: Not using GraphQL. WatermelonDB is better for React Native.

## Implementation Phases

### Phase 1: MVP

- [ ] WatermelonDB setup and schema
- [ ] Basic sync queue (create, update operations)
- [ ] Network status listener
- [ ] Offline indicator in UI
- [ ] Manual sync button

### Phase 2: Enhanced Sync

- [ ] Automatic background sync
- [ ] Conflict resolution
- [ ] Sync status per record
- [ ] Retry failed operations
- [ ] Delete operations in sync queue

### Phase 3: Advanced Features

- [ ] Partial sync (only changed data)
- [ ] Compressed sync payloads
- [ ] Sync analytics
- [ ] Multi-device sync (pull changes from other devices)

## Consequences

### Positive

- **Works offline** (core requirement met)
- **Fast UX** (instant local reads/writes)
- **Resilient** (no data loss when offline)
- **Reactive UI** (automatic updates)
- **Competitive advantage** (most apps don't work offline)

### Negative

- **Increased complexity** (sync logic, conflict resolution)
- **Storage limits** (device storage is finite)
- **Testing complexity** (need to test offline scenarios)
- **Debugging harder** (sync issues can be subtle)

### Risks

1. **Data loss during sync**:
   - **Mitigation**: Queue operations persistently, retry failed operations
   - **Monitoring**: Log sync failures to Sentry

2. **Storage limits exceeded**:
   - **Mitigation**: Implement data cleanup (remove old synced data)
   - **Early warning**: Monitor storage usage, warn user at 80%

3. **Sync conflicts**:
   - **Mitigation**: Last-write-wins is simple and works for our use case
   - **Monitoring**: Log conflicts, review patterns

4. **Performance degradation with large datasets**:
   - **Mitigation**: WatermelonDB lazy loading, indexed queries
   - **Monitoring**: Track query performance

## Success Metrics

This architecture is successful if:

- [ ] App works in airplane mode for all core features
- [ ] 95%+ of operations sync successfully when online
- [ ] Local database queries complete in < 100ms
- [ ] Zero data loss reports from users
- [ ] Sync conflicts < 1% of operations

## Testing Strategy

### Unit Tests

- Sync queue logic
- Conflict resolution
- Network status handling

### Integration Tests

- Write to local DB → verify sync queue
- Simulate network failure → verify queuing
- Simulate network return → verify sync

### E2E Tests

- Create job offline → go online → verify synced
- Take photo offline → verify uploads when online
- Multi-step workflow offline → verify all synced

### Manual Testing Checklist

- [ ] Create data in airplane mode
- [ ] Toggle airplane mode on/off
- [ ] Poor connection simulation (network throttling)
- [ ] Server downtime simulation
- [ ] Large dataset sync (100+ items)

## Monitoring

Track these metrics in production:

- **Sync success rate** (% of operations that sync successfully)
- **Sync latency** (time from local write to server confirmation)
- **Queue depth** (how many operations pending)
- **Conflict rate** (how often conflicts occur)
- **Storage usage** (local database size)

## Review

**Review date**: After MVP launch (Month 6)

Questions to answer:

- Is sync reliability acceptable?
- Are conflicts common?
- Is performance good with real data?
- Do users understand offline mode?
- Would we make the same decision again?

## References

- [WatermelonDB Documentation](https://nozbe.github.io/WatermelonDB/)
- [Offline First Principles](https://offlinefirst.org/)
- [Local-First Software](https://www.inkandswitch.com/local-first/)
- [React Native NetInfo](https://github.com/react-native-netinfo/react-native-netinfo)
