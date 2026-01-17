# Cloudflare Architecture

This document details how Cloudflare products integrate with HVACOps to provide global-scale backend infrastructure with exceptional performance and cost efficiency.

## Executive Summary

### Why Cloudflare

HVACOps uses Cloudflare as its production backend infrastructure instead of traditional cloud providers (AWS, Google Cloud, Azure) or hosted platforms (Railway, Render) for several compelling reasons:

**1. Integrated Platform vs Stitched Vendors**

Traditional backend architectures require assembling multiple vendors:

- AWS Lambda + API Gateway (compute)
- AWS S3 + CloudFront (storage + CDN)
- Redis/Memcached (caching)
- Pinecone/Weaviate (vector DB)
- Pusher/Ably (WebSockets)
- Datadog (monitoring)

**Cloudflare offers all of these in a single integrated platform:**

- Workers (compute)
- R2 (storage) + CDN (built-in)
- KV (caching)
- Vectorize (vector DB)
- Durable Objects (WebSockets + state)
- Analytics (monitoring)

**2. Global Edge Deployment**

Cloudflare runs on 300+ data centers worldwide. Every Worker request is handled at the edge location closest to the user, resulting in:

- **10-50ms latency** for HVAC technicians anywhere in the world
- No "cold starts" (unlike Lambda)
- Automatic failover and redundancy

**3. Cost Optimization**

| Feature      | Traditional Stack          | Cloudflare          | Savings             |
| ------------ | -------------------------- | ------------------- | ------------------- |
| API hosting  | AWS Lambda: $500/mo        | Workers: $5/mo      | $495/mo (99%)       |
| File storage | S3 + CloudFront: $3,500/mo | R2: $786/mo         | $2,714/mo (78%)     |
| Vector DB    | Pinecone: $70/mo           | Vectorize: $1/mo    | $69/mo (99%)        |
| AI caching   | None: $1,500/mo            | AI Gateway: $600/mo | $900/mo (60%)       |
| Redis cache  | ElastiCache: $50/mo        | KV: $1/mo           | $49/mo (98%)        |
| **Total**    | **$5,620/mo**              | **$1,393/mo**       | **$4,227/mo (75%)** |

**4. Zero Egress Fees**

AWS S3 charges $0.09/GB for data transfer out. With equipment manuals, part photos, and diagnostic attachments, this adds up quickly.

Cloudflare R2 has **zero egress fees**. Serve 100TB/month at no extra cost.

**5. AI Cost Optimization**

Without caching, every "How do I check refrigerant on a Carrier unit?" costs $0.015.

With Cloudflare AI Gateway:

- First request: $0.015 (cache miss)
- Next 99 identical requests: $0 (cache hit)
- **60-80% cost reduction** on AI API calls

### Architecture Philosophy

**Local-First Mobile → Edge API → Global Database**

```
React Native App (offline-capable)
    ↓
Cloudflare Workers (300+ edge locations)
    ├─ AI Gateway (Claude API with caching)
    ├─ Vectorize (semantic knowledge search)
    ├─ Workers AI (embeddings generation)
    ├─ R2 (file storage, zero egress)
    ├─ KV (session cache, settings)
    ├─ D1 (equipment catalog at edge)
    └─ Durable Objects (real-time collab)
    ↓
PostgreSQL (primary data store)
```

**Design Principles:**

1. **Data close to users** - Edge caching for fast reads
2. **Optimistic updates** - Mobile app updates instantly, syncs later
3. **AI cost control** - Aggressive caching of repeated queries
4. **Zero vendor lock-in** - PostgreSQL can move to any provider
5. **Predictable costs** - No surprise bills from egress or cold starts

---

## Current vs Future Architecture

### Current (MVP)

```
React Native App
    ↓
In-Memory Services (mock data)
    ├─ clientService.ts (Map<string, Client>)
    ├─ jobService.ts (Map<string, Job>)
    ├─ equipmentService.ts (Map<string, Equipment>)
    ├─ diagnosticService.ts (Map<string, DiagnosticSession>)
    └─ Mock AI responses (hardcoded HVAC knowledge)
    ↓
AsyncStorage (auth tokens only)
    ↓
No persistence, no real AI, no multi-device sync
```

**Why this works for MVP:**

- Instant UI development without backend dependencies
- No API latency during feature development
- Easy to iterate on data models
- Professional UI/UX refinement without costs

**Limitations:**

- Data lost on app uninstall
- No collaboration between technicians
- No real AI assistance
- No multi-device sync

### Future (Production with Cloudflare)

```
React Native App
    ↓ HTTPS/WebSocket
Cloudflare Workers (Global API)
    ├─ AI Gateway → Claude API (with 60% cache hit rate)
    ├─ Vectorize (HVAC manual semantic search)
    ├─ Workers AI (embedding generation for search)
    ├─ R2 (manuals, photos - zero egress)
    ├─ KV (sessions, settings - edge caching)
    ├─ D1 (equipment catalog - edge reads)
    └─ Durable Objects (real-time collab WebSockets)
    ↓ SQL queries
PostgreSQL (primary data store)
    ├─ Companies, Technicians, Clients
    ├─ Jobs, Equipment, Diagnostic Sessions
    └─ Messages, Participants, Audit Trail
```

**Benefits:**

- **Global performance**: <50ms API response time worldwide
- **Persistent data**: Multi-device sync, data survives uninstalls
- **Real AI**: Claude API with contextual HVAC knowledge injection
- **Collaboration**: Real-time multi-tech diagnostic sessions
- **Cost-efficient**: 75% cheaper than traditional stack
- **Scalable**: Handles 10,000+ technicians without config changes

---

## Cloudflare Workers - Global API Backend

### Purpose

Cloudflare Workers replace the in-memory service layer with a production-grade global API.

**Key Features:**

- **Edge deployment**: Runs in 300+ locations worldwide
- **Zero cold starts**: Always hot, no Lambda warmup delays
- **Auto-scaling**: Handles traffic spikes transparently
- **Integrated platform**: Direct access to R2, KV, D1, Vectorize

### API Endpoint Mapping

All current service methods map to Worker HTTP endpoints:

#### Authentication

| Method | Endpoint            | Maps to                      |
| ------ | ------------------- | ---------------------------- |
| POST   | `/api/auth/login`   | `authService.login()`        |
| POST   | `/api/auth/signup`  | `authService.signup()`       |
| POST   | `/api/auth/logout`  | `authService.logout()`       |
| POST   | `/api/auth/refresh` | `authService.refreshToken()` |

#### Clients

| Method | Endpoint           | Maps to                                    |
| ------ | ------------------ | ------------------------------------------ |
| GET    | `/api/clients`     | `clientService.getAll(companyId, filters)` |
| GET    | `/api/clients/:id` | `clientService.getById(id)`                |
| POST   | `/api/clients`     | `clientService.create(...)`                |
| PUT    | `/api/clients/:id` | `clientService.update(...)`                |
| DELETE | `/api/clients/:id` | `clientService.delete(id)`                 |

#### Jobs

| Method | Endpoint                       | Maps to                                         |
| ------ | ------------------------------ | ----------------------------------------------- |
| GET    | `/api/jobs`                    | `jobService.getAll(companyId, filters)`         |
| GET    | `/api/jobs/today`              | `jobService.getTodaysJobs(companyId)`           |
| GET    | `/api/jobs/technician/:techId` | `jobService.getByTechnician(companyId, techId)` |
| POST   | `/api/jobs/:id/assign`         | `jobService.assign(...)`                        |
| POST   | `/api/jobs/:id/accept`         | `jobService.accept(jobId, techId)`              |
| POST   | `/api/jobs/:id/decline`        | `jobService.decline(jobId, techId, reason)`     |
| POST   | `/api/jobs/:id/start`          | `jobService.startJob(jobId, techId)`            |
| POST   | `/api/jobs/:id/complete`       | `jobService.completeJob(jobId, techId, notes)`  |

#### Equipment

| Method | Endpoint                           | Maps to                                                  |
| ------ | ---------------------------------- | -------------------------------------------------------- |
| GET    | `/api/equipment`                   | `equipmentService.getAll(companyId)`                     |
| GET    | `/api/equipment/client/:clientId`  | `equipmentService.getByClient(companyId, clientId)`      |
| POST   | `/api/equipment/:id/assign-client` | `equipmentService.assignToClient(equipmentId, clientId)` |

#### Diagnostics

| Method | Endpoint                                     | Maps to                                          |
| ------ | -------------------------------------------- | ------------------------------------------------ |
| POST   | `/api/diagnostic/sessions`                   | `diagnosticService.createSession(...)`           |
| GET    | `/api/diagnostic/sessions/:id`               | `diagnosticService.getSession(id)`               |
| GET    | `/api/diagnostic/sessions`                   | `diagnosticService.getAllSessions(companyId)`    |
| GET    | `/api/clients/:clientId/diagnostic-sessions` | `diagnosticService.getSessionsByClient(...)`     |
| POST   | `/api/diagnostic/sessions/:id/messages`      | `diagnosticService.addMessageToSession(...)`     |
| PUT    | `/api/diagnostic/sessions/:id/complete`      | `diagnosticService.completeSession(id, summary)` |
| POST   | `/api/diagnostic/sessions/:id/invite`        | `diagnosticService.inviteTechnician(...)`        |
| POST   | `/api/diagnostic/sessions/:id/leave`         | `diagnosticService.leaveSession(id, techId)`     |
| WS     | `/api/diagnostic/sessions/:id/ws`            | Real-time WebSocket (Durable Objects)            |

#### Parts (Planned)

| Method | Endpoint            | Description                          |
| ------ | ------------------- | ------------------------------------ |
| POST   | `/api/parts/upload` | Upload photo, identify part using AI |
| GET    | `/api/parts/search` | Search parts catalog                 |

#### Technicians

| Method | Endpoint               | Maps to                                        |
| ------ | ---------------------- | ---------------------------------------------- |
| GET    | `/api/technicians`     | `technicianService.getAll(companyId, filters)` |
| GET    | `/api/technicians/:id` | `technicianService.getById(id)`                |
| POST   | `/api/technicians`     | `technicianService.create(...)`                |
| PUT    | `/api/technicians/:id` | `technicianService.update(...)`                |

### Authentication Middleware

Every API request validates the user's JWT token and enforces company context:

```typescript
// workers/api/src/middleware/auth.ts
export async function authenticateRequest(request: Request, env: Env): Promise<AuthUser> {
  // Extract token from Authorization header
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new UnauthorizedError('Missing token');
  }

  // Check KV cache first (fast edge lookup)
  const cacheKey = `session:${token}`;
  const cached = await env.KV_SESSIONS.get(cacheKey, 'json');
  if (cached) {
    return cached as AuthUser;
  }

  // Verify JWT signature and expiry
  const user = await verifyJWT(token, env.JWT_SECRET);
  if (!user) {
    throw new UnauthorizedError('Invalid token');
  }

  // Cache for 1 hour (reduce JWT verification overhead)
  await env.KV_SESSIONS.put(cacheKey, JSON.stringify(user), {
    expirationTtl: 3600,
  });

  return user;
}

// Validate company context (prevent cross-company data access)
export function validateCompanyContext(user: AuthUser, request: Request): void {
  const headerCompanyId = request.headers.get('X-Company-Id');

  if (headerCompanyId && headerCompanyId !== user.companyId) {
    throw new ForbiddenError('Company ID mismatch');
  }
}
```

**Flow:**

1. Mobile app sends: `Authorization: Bearer <jwt-token>`
2. Worker checks KV cache (edge lookup, <5ms)
3. Cache hit → Return user, skip JWT verification
4. Cache miss → Verify JWT, cache result, return user
5. Validate company context matches request

### Multi-Tenant Isolation Pattern

Every endpoint enforces company-based data isolation at the database level:

```typescript
// workers/api/src/routes/clients.ts
export async function GET(request: Request, env: Env) {
  // Authenticate and get user context
  const user = await authenticateRequest(request, env);
  validateCompanyContext(user, request);

  // Extract filters from query params
  const url = new URL(request.url);
  const filters = {
    status: url.searchParams.get('status') || undefined,
    search: url.searchParams.get('search') || undefined,
  };

  // Query database with company filter (ENFORCED SERVER-SIDE)
  const clients = await env.DB.prepare(
    `SELECT * FROM clients
     WHERE company_id = ?
       AND (? IS NULL OR status = ?)
       AND (? IS NULL OR name LIKE ?)
     ORDER BY name ASC`
  )
    .bind(
      user.companyId, // ← User cannot fake this
      filters.status,
      filters.status,
      filters.search,
      `%${filters.search}%`
    )
    .all();

  return Response.json({
    data: clients.results,
    meta: { total: clients.results.length },
  });
}
```

**Security guarantees:**

- ✅ `companyId` comes from verified JWT, not request body
- ✅ Database query explicitly filters by `company_id`
- ✅ User cannot access other companies' data, even with guessed IDs
- ✅ All queries use parameterized statements (SQL injection protection)

### Audit Trail Auto-Population

The backend automatically populates audit fields using the authenticated user:

```typescript
// workers/api/src/routes/clients.ts
export async function POST(request: Request, env: Env) {
  const user = await authenticateRequest(request, env);
  validateCompanyContext(user, request);

  // Parse request body
  const formData = await request.json<ClientFormData>();

  // Validate input (reject system fields if present)
  if (formData.createdBy || formData.modifiedBy || formData.companyId) {
    throw new ValidationError('System fields cannot be set by client');
  }

  // Auto-populate audit fields (NEVER trust frontend)
  const client: Client = {
    id: crypto.randomUUID(),
    companyId: user.companyId, // From authenticated JWT
    ...formData,
    createdBy: user.id,
    createdByName: `${user.firstName} ${user.lastName}`,
    createdAt: new Date().toISOString(),
    modifiedBy: user.id,
    modifiedByName: `${user.firstName} ${user.lastName}`,
    updatedAt: new Date().toISOString(),
  };

  // Insert into database
  await env.DB.prepare(
    `INSERT INTO clients (
      id, company_id, name, phone, email, address,
      created_by, created_by_name, created_at,
      modified_by, modified_by_name, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      client.id,
      client.companyId,
      client.name,
      client.phone,
      client.email,
      client.address,
      client.createdBy,
      client.createdByName,
      client.createdAt,
      client.modifiedBy,
      client.modifiedByName,
      client.updatedAt
    )
    .run();

  return Response.json({ data: client }, { status: 201 });
}
```

**Why this matters:**

- Frontend cannot forge `createdBy` or `modifiedBy` fields
- Audit trail is reliable for compliance and debugging
- Matches existing mobile service pattern (easy migration)

### Worker Project Structure

```
workers/api/
├── src/
│   ├── index.ts                 # Main entry point, routing
│   ├── middleware/
│   │   ├── auth.ts             # Authentication/authorization
│   │   ├── cors.ts             # CORS handling
│   │   ├── errors.ts           # Error handling
│   │   └── validation.ts       # Input validation
│   ├── routes/
│   │   ├── auth.ts             # Auth endpoints
│   │   ├── clients.ts          # Client CRUD
│   │   ├── jobs.ts             # Job management
│   │   ├── equipment.ts        # Equipment CRUD
│   │   ├── diagnostic.ts       # Diagnostic sessions
│   │   ├── parts.ts            # Parts identification
│   │   └── technicians.ts      # Technician management
│   ├── services/
│   │   ├── db.ts               # Database access layer
│   │   ├── ai.ts               # AI Gateway integration
│   │   ├── vector.ts           # Vectorize integration
│   │   └── storage.ts          # R2 integration
│   ├── types/
│   │   ├── env.ts              # Environment bindings
│   │   └── models.ts           # Data models
│   └── utils/
│       ├── jwt.ts              # JWT verification
│       ├── validation.ts       # Input validation
│       └── helpers.ts          # Utility functions
├── wrangler.toml               # Cloudflare config
├── package.json
└── tsconfig.json
```

**Key files:**

- **`index.ts`**: Router that dispatches requests to route handlers
- **`middleware/auth.ts`**: JWT validation + KV caching
- **`routes/*.ts`**: Endpoint handlers (similar to current services)
- **`services/db.ts`**: PostgreSQL query builder (replaces in-memory Maps)
- **`wrangler.toml`**: Cloudflare configuration (bindings, secrets)

---

## AI Gateway - Claude API Proxy with Caching

### Purpose

AI Gateway sits between Workers and the Claude API to provide:

- **Intelligent caching**: Cache repeated diagnostic questions (60-80% hit rate)
- **Rate limiting**: Per company, prevents abuse
- **Fallback routing**: Automatically try alternative models if Claude is down
- **Cost tracking**: Real-time spend monitoring per company
- **Security**: API keys never touch mobile app

### Implementation

```typescript
// workers/api/src/services/ai.ts
export async function generateDiagnosticResponse(
  message: string,
  conversationHistory: Message[],
  equipmentContext: EquipmentContext,
  knowledgeContext: KnowledgeChunk[],
  env: Env
): Promise<string> {
  // Build system prompt with HVAC expertise
  const systemPrompt = buildSystemPrompt();

  // Inject relevant knowledge from vector DB
  const contextPrompt = buildContextPrompt(knowledgeContext);

  // Format conversation history for Claude
  const conversationMessages = conversationHistory.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));

  // Route through AI Gateway (with caching)
  const response = await fetch(
    `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/hvac-ai/anthropic/v1/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: [
          { type: 'text', text: systemPrompt },
          { type: 'text', text: contextPrompt },
        ],
        messages: [...conversationMessages, { role: 'user', content: message }],
      }),
      // AI Gateway caching configuration
      cf: {
        cacheTtl: 3600, // Cache for 1 hour
        cacheKey: buildCacheKey(message, equipmentContext),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Build deterministic cache key (same question → same key)
function buildCacheKey(message: string, context: EquipmentContext): string {
  // Normalize message (lowercase, trim whitespace)
  const normalized = message.toLowerCase().trim();

  // Include equipment type in key (different answers for different systems)
  const equipment = context.systemType || 'general';
  const manufacturer = context.manufacturer || 'generic';

  // Hash to create stable, short key
  return `diagnostic:${equipment}:${manufacturer}:${hashString(normalized)}`;
}

function buildSystemPrompt(): string {
  return `You are an expert HVAC diagnostic assistant helping technicians in the field.

Your role:
- Provide accurate, actionable diagnostic guidance
- Reference equipment manuals and specifications when available
- Suggest step-by-step troubleshooting procedures
- Warn about safety hazards (electrical, refrigerant, etc.)
- Recommend when to escalate to senior technician

Guidelines:
- Be concise but thorough
- Use technical terminology appropriately
- Always consider safety first
- Provide specific measurements/values when possible
- Cite manual page numbers when referencing documentation`;
}

function buildContextPrompt(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) {
    return '';
  }

  const context = chunks
    .map((chunk, i) => `[${i + 1}] ${chunk.source}\n${chunk.content}`)
    .join('\n\n');

  return `Relevant documentation:\n\n${context}\n\nUse this information to provide accurate guidance.`;
}
```

### Cost Optimization Strategy

**Without AI Gateway (no caching):**

```
Scenario: "Check refrigerant on Carrier 24ACC6" asked 100 times
- 100 requests × $0.015 = $1.50 per question
- 1,000 questions/day = $1,500/day
- Monthly cost: $45,000
```

**With AI Gateway (60% cache hit rate):**

```
Scenario: Same question asked 100 times
- First request: $0.015 (cache miss, calls Claude API)
- Next 99 requests: $0 (cache hit, served from edge)
- Cost: $0.015 per unique question

With 1,000 questions/day:
- 40% unique (400) × $0.015 = $6/day
- 60% cached (600) × $0 = $0/day
- Monthly cost: $180

Savings: $44,820/month (99.6% reduction)
```

**Real-world cache hit rates:**

- **Common questions**: 80%+ hit rate
  - "How do I check refrigerant?"
  - "What causes compressor failure?"
  - "Why is my AC freezing?"
- **Equipment-specific**: 60%+ hit rate
  - "Carrier 24ACC6 troubleshooting"
  - "Trane XR13 pressure specs"
- **Unique scenarios**: 0% hit rate
  - "Customer says it's making a scraping noise at 3am"
  - Job-specific context

**Cache invalidation:**

- Time-based: 1 hour TTL (knowledge doesn't change often)
- Manual: Admin dashboard can purge cache for specific questions
- Automatic: New manual version → clear related cache keys

### Rate Limiting

```typescript
// Limit AI requests per company
const rateLimitKey = `ratelimit:ai:${user.companyId}`;
const count = await env.KV_RATELIMIT.get(rateLimitKey);

if (parseInt(count || '0') >= 1000) {
  // 1000 AI requests per hour per company
  throw new RateLimitError('AI request limit exceeded');
}

await env.KV_RATELIMIT.put(
  rateLimitKey,
  (parseInt(count || '0') + 1).toString(),
  { expirationTtl: 3600 } // Reset every hour
);
```

---

## Vectorize + Workers AI - Knowledge Base Search

### Purpose

Vectorize provides semantic search over HVAC documentation without external vector DB services (Pinecone, Weaviate).

**Use cases:**

- Search equipment manuals by natural language question
- Find relevant troubleshooting procedures
- Retrieve specifications for specific models
- Context injection for Claude API (RAG pattern)

**Benefits:**

- **Integrated**: No external service, no API keys, no separate billing
- **Edge deployment**: Low-latency search worldwide
- **Cost-effective**: $0.04 per million queries (vs Pinecone $70/month)
- **Unlimited dimensions**: Store 768-dim embeddings from Workers AI

### Knowledge Base Structure

```typescript
interface KnowledgeChunk {
  id: string;
  content: string; // Text chunk from manual (300-500 words)
  source: string; // "Carrier 24ACC6 Manual p.42"
  equipmentType?: string; // Filter by system type
  manufacturer?: string; // Filter by brand
  category: 'troubleshooting' | 'specs' | 'installation' | 'maintenance';
  metadata: {
    modelNumber?: string;
    lastUpdated: Date;
    pageNumber?: number;
  };
}
```

**Example chunk:**

```json
{
  "id": "carrier-24acc6-refrigerant-check",
  "content": "To check refrigerant levels on Carrier 24ACC6 split systems: 1. Connect gauges to service ports. 2. Normal operating pressures: Suction 68-70 PSI, Discharge 225-275 PSI at 95°F ambient. 3. If pressures are low, check for leaks before adding refrigerant. 4. Use R-410A refrigerant only.",
  "source": "Carrier 24ACC6 Service Manual",
  "equipmentType": "split_system",
  "manufacturer": "Carrier",
  "category": "troubleshooting",
  "metadata": {
    "modelNumber": "24ACC6",
    "pageNumber": 42,
    "lastUpdated": "2024-01-15T00:00:00Z"
  }
}
```

### Implementation

#### Generate Embeddings with Workers AI

```typescript
// workers/api/src/services/vector.ts
export async function generateEmbedding(text: string, env: Env): Promise<number[]> {
  // Use Workers AI (no external API needed)
  const result = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: text,
  });

  // Returns 768-dimensional vector
  return result.data[0];
}
```

**Workers AI models:**

- **`@cf/baai/bge-base-en-v1.5`**: 768-dim, good for English text
- **Cost**: Included in Workers plan, no per-request charge
- **Speed**: <100ms for embedding generation

#### Search Knowledge Base

```typescript
export async function searchKnowledgeBase(
  query: string,
  equipmentContext: EquipmentContext,
  env: Env
): Promise<KnowledgeChunk[]> {
  // Build search query with equipment context
  const searchText = [query, equipmentContext.manufacturer, equipmentContext.modelNumber]
    .filter(Boolean)
    .join(' ');

  // Generate query embedding
  const embedding = await generateEmbedding(searchText, env);

  // Query Vectorize with filters
  const results = await env.VECTORIZE.query(embedding, {
    topK: 5, // Top 5 most relevant chunks
    filter: {
      equipmentType: equipmentContext.systemType,
      manufacturer: equipmentContext.manufacturer,
    },
    returnMetadata: true,
  });

  // Map results to KnowledgeChunk format
  return results.matches.map((match) => ({
    id: match.id,
    content: match.metadata.content as string,
    source: match.metadata.source as string,
    equipmentType: match.metadata.equipmentType as string,
    manufacturer: match.metadata.manufacturer as string,
    category: match.metadata.category as string,
    relevance: match.score, // 0-1 similarity score
  }));
}
```

**Query parameters:**

- **`topK`**: Number of results to return (5-10 typical)
- **`filter`**: Metadata filters (equipment type, manufacturer)
- **`returnMetadata`**: Include full chunk content in results

#### Insert Knowledge Chunk (Admin Operation)

```typescript
export async function addKnowledgeChunk(
  chunk: Omit<KnowledgeChunk, 'id'>,
  env: Env
): Promise<void> {
  const id = crypto.randomUUID();

  // Generate embedding for chunk content
  const embedding = await generateEmbedding(chunk.content, env);

  // Insert into Vectorize
  await env.VECTORIZE.insert([
    {
      id: id,
      values: embedding, // 768-dim vector
      metadata: {
        content: chunk.content,
        source: chunk.source,
        equipmentType: chunk.equipmentType,
        manufacturer: chunk.manufacturer,
        category: chunk.category,
        modelNumber: chunk.metadata.modelNumber,
        pageNumber: chunk.metadata.pageNumber,
        lastUpdated: chunk.metadata.lastUpdated.toISOString(),
      },
    },
  ]);

  console.log(`Inserted knowledge chunk: ${id}`);
}
```

**Bulk import script:**

```typescript
// scripts/import-manuals.ts
async function importManual(pdfPath: string, manufacturer: string) {
  // 1. Extract text from PDF
  const text = await extractTextFromPDF(pdfPath);

  // 2. Split into chunks (300-500 words)
  const chunks = splitIntoChunks(text, 400);

  // 3. Insert each chunk
  for (const chunk of chunks) {
    await addKnowledgeChunk({
      content: chunk.text,
      source: `${manufacturer} Manual p.${chunk.pageNumber}`,
      equipmentType: detectEquipmentType(chunk.text),
      manufacturer: manufacturer,
      category: detectCategory(chunk.text),
      metadata: {
        pageNumber: chunk.pageNumber,
        lastUpdated: new Date(),
      },
    });
  }
}
```

### Diagnostic Flow with Context Injection (RAG Pattern)

**Retrieval-Augmented Generation (RAG):**

```
1. User asks: "Why isn't my AC cooling?"
   ↓
2. Extract equipment context: Carrier 24ACC6, split system
   ↓
3. Generate embedding for: "Why isn't my AC cooling? Carrier 24ACC6"
   ↓
4. Query Vectorize → Top 5 relevant manual sections
   ↓
5. Build Claude API prompt:
   - System: "You are an HVAC expert..."
   - Context: [5 manual chunks with citations]
   - History: [Previous conversation messages]
   - User: "Why isn't my AC cooling?"
   ↓
6. Route through AI Gateway → Claude API
   ↓
7. Claude generates response using injected context
   ↓
8. Return response with citations: "Based on Carrier 24ACC6 Manual p.42..."
```

**Example prompt:**

```
System: You are an expert HVAC diagnostic assistant.

Context:
[1] Carrier 24ACC6 Manual p.42
To check refrigerant levels: Connect gauges to service ports. Normal pressures: Suction 68-70 PSI...

[2] Carrier 24ACC6 Manual p.58
Common cooling issues: 1. Low refrigerant, 2. Dirty coils, 3. Compressor failure...

[3] Carrier Troubleshooting Guide p.12
If AC runs but doesn't cool: Check refrigerant first, then inspect compressor...

History:
[User] My Carrier AC is running but not cooling
[AI] I can help diagnose that. What model is it?
[User] 24ACC6

Current question: Why isn't my AC cooling?

Provide step-by-step diagnostic guidance using the context above. Cite manual page numbers.
```

**Why RAG works:**

- ✅ Claude sees **relevant** documentation, not entire manual
- ✅ Answers are **grounded** in official manuals (reduces hallucination)
- ✅ Technicians get **citations** to verify information
- ✅ Knowledge updates without retraining model

### Cost Comparison

**Pinecone (traditional vector DB):**

- Starter plan: $70/month (1M vectors)
- 10M queries/month: $0.20/1M = $2
- **Total: $72/month**

**Cloudflare Vectorize:**

- Storage: 1M dimensions × $0.04/1M = $0.04/month
- Queries: 10M × $0.04/1M = $0.40/month
- **Total: $0.44/month**

**Savings: $71.56/month (99% reduction)**

---

## R2 - Object Storage (Zero Egress)

### Purpose

Cloudflare R2 provides S3-compatible object storage with **zero egress fees**.

**Use cases:**

- Store equipment manuals (PDFs)
- Parts identification photos
- Diagnostic session attachments
- Equipment photos

**Key benefit:**

AWS S3 charges $0.09/GB for data transfer out. Serving 100TB/month costs $9,000.

Cloudflare R2 has **zero egress fees**. Serve unlimited data at no extra cost.

### Implementation

#### Upload File to R2

```typescript
// workers/api/src/services/storage.ts
export async function uploadFile(
  file: File,
  path: string,
  metadata: Record<string, string>,
  env: Env
): Promise<string> {
  // Generate unique key
  const timestamp = Date.now();
  const key = `${path}/${timestamp}-${file.name}`;

  // Upload to R2
  await env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000', // Cache 1 year
    },
    customMetadata: metadata,
  });

  // Return public CDN URL
  return `https://cdn.hvacops.com/${key}`;
}
```

#### Serve File with Edge Caching

```typescript
export async function serveFile(key: string, env: Env): Promise<Response> {
  const object = await env.R2_BUCKET.get(key);

  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000', // Cache 1 year
      ETag: object.etag,
      'Content-Length': object.size.toString(),
    },
  });
}
```

**Cloudflare CDN benefits:**

- Automatic caching at 300+ edge locations
- No separate CloudFront configuration needed
- Cache purge via API or dashboard

#### Upload Part Photo for Identification

```typescript
export async function uploadPartPhoto(request: Request, env: Env): Promise<{ imageUrl: string }> {
  const user = await authenticateRequest(request, env);
  const formData = await request.formData();
  const image = formData.get('image') as File;

  // Validate
  if (!image || !image.type.startsWith('image/')) {
    throw new ValidationError('Invalid image file');
  }

  if (image.size > 10_000_000) {
    // 10MB limit
    throw new ValidationError('Image too large (max 10MB)');
  }

  // Store in R2 with company namespacing
  const key = `companies/${user.companyId}/parts/${Date.now()}-${image.name}`;

  await env.R2_BUCKET.put(key, image.stream(), {
    httpMetadata: {
      contentType: image.type,
    },
    customMetadata: {
      companyId: user.companyId,
      uploadedBy: user.id,
      uploadedByName: `${user.firstName} ${user.lastName}`,
      uploadedAt: new Date().toISOString(),
    },
  });

  const imageUrl = `https://cdn.hvacops.com/${key}`;

  // TODO: Trigger AI part identification
  // await identifyPart(imageUrl, env);

  return { imageUrl };
}
```

### R2 Bucket Organization

```
R2 Bucket: hvacops-storage
├── companies/
│   ├── {companyId}/
│   │   ├── parts/              # Part photos uploaded by techs
│   │   │   ├── 1234567890-capacitor.jpg
│   │   │   └── 1234567891-compressor.jpg
│   │   ├── diagnostics/        # Diagnostic attachments
│   │   │   └── session-abc-123/
│   │   │       ├── photo-1.jpg
│   │   │       └── video-1.mp4
│   │   └── equipment/          # Equipment photos
│   │       ├── equip-123-front.jpg
│   │       └── equip-123-dataplate.jpg
├── manuals/                     # Global equipment manuals
│   ├── carrier/
│   │   ├── 24ACC6-service-manual.pdf
│   │   └── 24ABC6-installation.pdf
│   ├── trane/
│   │   └── XR13-service-manual.pdf
│   └── lennox/
│       └── ML14-troubleshooting.pdf
└── knowledge-base/              # HVAC reference docs
    ├── troubleshooting/
    │   ├── no-cooling-checklist.pdf
    │   └── refrigerant-leaks.pdf
    ├── specifications/
    │   └── refrigerant-pressure-charts.pdf
    └── procedures/
        ├── brazing-guide.pdf
        └── evacuation-procedure.pdf
```

**Namespace strategy:**

- **Company data**: `companies/{companyId}/` ensures data isolation
- **Global resources**: `manuals/`, `knowledge-base/` accessible to all
- **Access control**: Workers validate company membership before serving files

### Cost Comparison

**AWS S3 + CloudFront (10TB stored, 100TB downloaded/month):**

| Item                     | Calculation         | Cost           |
| ------------------------ | ------------------- | -------------- |
| S3 storage               | 10,000 GB × $0.023  | $230/mo        |
| S3 egress to CloudFront  | 100,000 GB × $0.02  | $2,000/mo      |
| CloudFront data transfer | 100,000 GB × $0.085 | $8,500/mo      |
| CloudFront requests      | 100M × $0.0075/10k  | $75/mo         |
| **Total**                |                     | **$10,805/mo** |

**Cloudflare R2 + CDN (10TB stored, 100TB downloaded/month):**

| Item                  | Calculation        | Cost        |
| --------------------- | ------------------ | ----------- |
| R2 storage            | 10,000 GB × $0.015 | $150/mo     |
| R2 egress             | 100,000 GB × $0    | **$0/mo**   |
| CDN data transfer     | Included           | **$0/mo**   |
| R2 operations (reads) | 100M × $0.36/1M    | $36/mo      |
| **Total**             |                    | **$186/mo** |

**Savings: $10,619/month (98% reduction)**

### S3 Compatibility

R2 is S3-compatible, meaning existing S3 SDKs work without changes:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

// Upload file (same as S3)
await s3.send(
  new PutObjectCommand({
    Bucket: 'hvacops-storage',
    Key: 'companies/abc-123/parts/photo.jpg',
    Body: imageBuffer,
  })
);
```

**Migration from S3:**

- Use AWS CLI: `aws s3 sync s3://old-bucket r2://new-bucket`
- No code changes needed (S3 SDK compatible)
- Update endpoint URL only

---

## KV - Key-Value Storage

### Purpose

Cloudflare KV provides edge-distributed key-value storage for frequently accessed data.

**Use cases:**

- Session caching (validated JWTs)
- Company settings/configuration
- Feature flags
- Rate limiting counters

**Benefits:**

- **Edge caching**: Data replicated to 300+ locations
- **Low latency**: <5ms reads worldwide
- **High read performance**: Optimized for read-heavy workloads
- **Eventual consistency**: Writes propagate globally in ~60 seconds

### Implementation

#### Session Caching

```typescript
// Cache validated JWT in KV (avoid repeated verification)
await env.KV_SESSIONS.put(
  `session:${token}`,
  JSON.stringify(user),
  { expirationTtl: 3600 } // Expire in 1 hour
);

// Read from cache
const cached = await env.KV_SESSIONS.get(`session:${token}`, 'json');
if (cached) {
  return cached as AuthUser;
}
```

**Flow:**

1. User sends request with JWT token
2. Check KV cache: `session:{token}`
3. Cache hit → Return user, skip JWT verification (saves 50ms)
4. Cache miss → Verify JWT, cache result, return user

**Result:**

- 90%+ cache hit rate after initial login
- API latency reduced by 50ms per request
- JWT secret not needed at edge (security)

#### Company Settings

```typescript
// Store company settings at edge
await env.KV_SETTINGS.put(
  `company:${companyId}:settings`,
  JSON.stringify({
    workingHours: { start: '08:00', end: '18:00' },
    timezone: 'America/New_York',
    features: { diagnosticAI: true, partsIdentification: true },
  }),
  { expirationTtl: 86400 } // Cache for 24 hours
);

// Read settings (fast edge lookup)
const settings = await env.KV_SETTINGS.get(`company:${companyId}:settings`, 'json');
```

#### Feature Flags

```typescript
// Global feature flags
await env.KV_SETTINGS.put(
  'feature:diagnosticCollaboration',
  JSON.stringify({ enabled: true, rolloutPercent: 100 }),
  { expirationTtl: 300 } // Cache for 5 minutes (allows quick rollback)
);

// Check feature flag
const feature = await env.KV_SETTINGS.get('feature:diagnosticCollaboration', 'json');

if (feature?.enabled) {
  // Feature is enabled
}
```

#### Rate Limiting

```typescript
// Track API requests per company
const key = `ratelimit:${companyId}:${endpoint}`;
const count = await env.KV_RATELIMIT.get(key);

if (parseInt(count || '0') > limit) {
  throw new RateLimitError(`Rate limit exceeded: ${limit} requests/minute`);
}

// Increment counter
await env.KV_RATELIMIT.put(
  key,
  (parseInt(count || '0') + 1).toString(),
  { expirationTtl: 60 } // Reset every minute
);
```

**Rate limit tiers:**

- **Free tier**: 100 requests/minute per company
- **Pro tier**: 1,000 requests/minute per company
- **Enterprise**: Custom limits

### Cost

**KV Pricing:**

- Reads: $0.50 per 10M reads
- Writes: $5.00 per 10M writes
- Storage: $0.50 per GB-month

**Typical usage (100 technicians):**

- 10M reads/month (session lookups) = $0.50/mo
- 1M writes/month (session updates) = $0.50/mo
- 100MB storage (settings, flags) = $0.05/mo
- **Total: ~$1/month**

**Compared to Redis:**

- **AWS ElastiCache Redis**: $50-200/month (minimum)
- **Upstash Redis**: $10-30/month
- **Cloudflare KV**: $1/month (10x-200x cheaper)

---

## D1 - Edge Database

### Purpose

Cloudflare D1 provides SQLite databases replicated to edge locations for low-latency reads.

**Use cases:**

- Equipment catalog (read-heavy, reference data)
- Parts database (search by model, manufacturer)
- Read replicas of PostgreSQL data

**Benefits:**

- **Edge reads**: Query data at <10ms latency worldwide
- **SQLite compatibility**: Standard SQL, easy to migrate
- **Automatic replication**: Writes propagate to all edge locations
- **Cost-effective**: $0.75 per million reads (vs Aurora $200/month)

### Implementation

#### Equipment Catalog at Edge

```typescript
// workers/api/src/services/db.ts
export async function searchEquipmentCatalog(query: string, env: Env): Promise<Equipment[]> {
  const results = await env.D1_DB.prepare(
    `SELECT id, manufacturer, model, system_type, specs
     FROM equipment_catalog
     WHERE manufacturer LIKE ?1 OR model LIKE ?1
     ORDER BY manufacturer, model
     LIMIT 20`
  )
    .bind(`%${query}%`)
    .all();

  return results.results as Equipment[];
}
```

**Example query:**

```
User searches: "Carrier 24"
→ Returns: Carrier 24ACC6, Carrier 24ABB6, Carrier 24ANB6...
```

#### Sync from Primary Database (Cron Job)

```typescript
// Scheduled worker to sync PostgreSQL → D1
export async function syncEquipmentCatalog(env: Env) {
  console.log('Starting equipment catalog sync...');

  // 1. Read from PostgreSQL (source of truth)
  const equipment = await fetchFromPostgres('SELECT * FROM equipment_catalog ORDER BY id');

  console.log(`Fetched ${equipment.length} equipment records`);

  // 2. Batch insert to D1 (replaces existing data)
  const stmt = env.D1_DB.prepare(
    `INSERT OR REPLACE INTO equipment_catalog
     (id, manufacturer, model, system_type, specs, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
  );

  // D1 batch operation (up to 100 statements)
  const batches = [];
  for (let i = 0; i < equipment.length; i += 100) {
    const batch = equipment
      .slice(i, i + 100)
      .map((e) =>
        stmt.bind(
          e.id,
          e.manufacturer,
          e.model,
          e.system_type,
          JSON.stringify(e.specs),
          new Date().toISOString()
        )
      );
    batches.push(env.D1_DB.batch(batch));
  }

  await Promise.all(batches);

  console.log('Equipment catalog sync complete');
}

// Schedule: wrangler.toml
// [triggers]
// crons = ["0 2 * * *"] # Run at 2am daily
```

**Sync strategy:**

- Daily sync from PostgreSQL (equipment doesn't change often)
- On-demand sync when new equipment added (webhook from admin dashboard)
- D1 is read-only from API (writes go to PostgreSQL)

### D1 Schema

```sql
-- equipment_catalog table (replicated from PostgreSQL)
CREATE TABLE equipment_catalog (
  id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  system_type TEXT, -- split_system, package_unit, etc.
  specs TEXT, -- JSON: { cooling_capacity, refrigerant, etc. }
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_manufacturer ON equipment_catalog(manufacturer);
CREATE INDEX idx_model ON equipment_catalog(model);
CREATE INDEX idx_system_type ON equipment_catalog(system_type);
```

### Cost

**D1 Pricing:**

- Storage: $0.75 per GB-month
- Reads: $0.001 per 1,000 reads (after 5M free/day)
- Writes: $1.00 per 1M writes

**Typical usage:**

- 100MB equipment catalog = $0.08/mo
- 5M reads/month (equipment lookups) = $5/mo
- 10k writes/month (catalog updates) = $0.01/mo
- **Total: ~$5/month**

**Compared to Aurora MySQL:**

- **AWS Aurora MySQL**: $200-500/month (read replicas)
- **Cloudflare D1**: $5/month (98% cheaper)

---

## Durable Objects - Real-Time Collaboration

See [ARCHITECTURE.md § Real-Time Infrastructure](./ARCHITECTURE.md#real-time-infrastructure-cloudflare-durable-objects) for detailed implementation.

### Quick Summary

**Purpose:** WebSocket-based real-time collaboration for diagnostic sessions.

**Key features:**

- One Durable Object = One diagnostic session
- Strong consistency (single-threaded execution)
- Built-in WebSocket support
- Persistent KV storage per object
- Auto-hibernation (cost-effective)

**Data flow:**

```
Technician A (mobile app)
    ↓ WebSocket
Durable Object (session-abc-123)
    ├─ participants: [Tech A, Tech B, AI]
    ├─ connections: [WebSocket A, WebSocket B]
    └─ messages: [...history...]
    ↓ WebSocket broadcast
Technician B (mobile app)
```

**Messages:**

- `participant_joined` - Tech joins session
- `participant_left` - Tech leaves session
- `new_message` - New chat message
- `session_state` - Full session history (on connect)

**Cost:** ~$0.60/month for 100 technicians, 1,000 sessions/month

---

## Database Architecture

### Primary Database (PostgreSQL)

**Source of truth** for all mutable application data.

**Hosting options:**

- **Neon** - Serverless Postgres, generous free tier
- **Supabase** - Postgres + auth + realtime (overkill for us)
- **Railway** - Simple deploy, $5/month minimum
- **AWS RDS** - Traditional managed Postgres

**Schema:**

See full schema in [API Endpoint Mapping](#api-endpoint-mapping) section.

**Key tables:**

- `companies` - Top-level tenant
- `technicians` - Users with roles
- `clients` - HVAC customers
- `jobs` - Scheduled appointments
- `equipment` - HVAC systems
- `diagnostic_sessions` - AI chat sessions
- `diagnostic_messages` - Chat messages
- `diagnostic_participants` - Session members

**Multi-tenant isolation:**

Every table includes `company_id` column. All queries filter by company:

```sql
SELECT * FROM clients WHERE company_id = $1 AND id = $2
```

### Edge Read Replicas

**D1** for equipment catalog (read-only reference data):

- Equipment specifications
- Parts catalog
- Synced daily from PostgreSQL

**KV** for frequently accessed data:

- Session cache (validated JWTs)
- Company settings
- Feature flags

**Pattern:** Cache-aside

```
1. Check edge cache (D1 or KV)
2. Cache hit → Return immediately (< 5ms)
3. Cache miss → Query PostgreSQL
4. Store result in edge cache
5. Return to client
```

### Database Schema

```sql
-- Companies table (top-level tenant)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Technicians table (users with audit fields)
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'lead_tech', 'technician', 'office_staff')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'on_leave')) DEFAULT 'active',
  license_number VARCHAR(100),
  license_expiry DATE,
  hire_date DATE,
  notes TEXT,
  created_by UUID REFERENCES technicians(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  modified_by UUID REFERENCES technicians(id),
  modified_by_name VARCHAR(255),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_technicians_company ON technicians(company_id);
CREATE INDEX idx_technicians_email ON technicians(email);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES technicians(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  modified_by UUID REFERENCES technicians(id),
  modified_by_name VARCHAR(255),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_clients_status ON clients(company_id, status);

-- Equipment table
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(100),
  model_number VARCHAR(100),
  serial_number VARCHAR(100),
  system_type VARCHAR(50),
  install_date DATE,
  warranty_expiry DATE,
  notes TEXT,
  created_by UUID REFERENCES technicians(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  modified_by UUID REFERENCES technicians(id),
  modified_by_name VARCHAR(255),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_company ON equipment(company_id);
CREATE INDEX idx_equipment_client ON equipment(client_id);

-- Jobs table (with assignment tracking)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN (
    'unassigned', 'assigned', 'accepted', 'declined',
    'in_progress', 'completed', 'cancelled'
  )),
  priority VARCHAR(50) DEFAULT 'normal',
  scheduled_date TIMESTAMP,
  completed_at TIMESTAMP,

  -- Assignment tracking
  assigned_to UUID REFERENCES technicians(id),
  assigned_by UUID REFERENCES technicians(id),
  assigned_by_name VARCHAR(255),
  assigned_at TIMESTAMP,
  accepted_at TIMESTAMP,
  declined_at TIMESTAMP,
  decline_reason TEXT,

  notes TEXT,
  created_by UUID REFERENCES technicians(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  modified_by UUID REFERENCES technicians(id),
  modified_by_name VARCHAR(255),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_client ON jobs(client_id);
CREATE INDEX idx_jobs_assigned ON jobs(assigned_to);
CREATE INDEX idx_jobs_status ON jobs(company_id, status);
CREATE INDEX idx_jobs_scheduled ON jobs(company_id, scheduled_date);

-- Diagnostic sessions table
CREATE TABLE diagnostic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('guided', 'expert', 'quick')),
  summary TEXT,
  completed_at TIMESTAMP,
  is_collaborative BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES technicians(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  modified_by UUID REFERENCES technicians(id),
  modified_by_name VARCHAR(255),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_company ON diagnostic_sessions(company_id);
CREATE INDEX idx_sessions_client ON diagnostic_sessions(client_id);
CREATE INDEX idx_sessions_created ON diagnostic_sessions(company_id, created_at DESC);

-- Messages table (diagnostic session messages)
CREATE TABLE diagnostic_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sender_id VARCHAR(255), -- Technician ID, 'ai', or 'system'
  sender_name VARCHAR(255),
  sender_role VARCHAR(50), -- primary, invited, ai
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON diagnostic_messages(session_id, timestamp);

-- Participants table (session participants)
CREATE TABLE diagnostic_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  technician_id VARCHAR(255) NOT NULL, -- 'ai' for AI participant
  role VARCHAR(50) NOT NULL CHECK (role IN ('primary', 'invited', 'ai')),
  name VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  left_at TIMESTAMP
);

CREATE INDEX idx_participants_session ON diagnostic_participants(session_id);
CREATE INDEX idx_participants_tech ON diagnostic_participants(technician_id, left_at);
```

---

## Migration Strategy

### Phase 1: Workers API Foundation (Week 1-2)

**Goal:** Replace in-memory services with production API.

**Tasks:**

1. Set up Cloudflare Workers project
   - Create `wrangler.toml` configuration
   - Set up TypeScript project structure
   - Configure environment bindings (KV, R2, D1, Vectorize)

2. Implement authentication middleware
   - JWT verification
   - KV session caching
   - Company context validation

3. Create database access layer
   - PostgreSQL connection (via `node:postgres` or compatible)
   - Query builder utilities
   - Transaction support

4. Migrate core endpoints
   - Auth: `POST /api/auth/login`, `POST /api/auth/signup`
   - Clients: `GET /api/clients`, `POST /api/clients`, `GET /api/clients/:id`
   - Jobs: `GET /api/jobs`, `GET /api/jobs/today`

5. Update mobile app API client
   - Change `baseURL` to Cloudflare Workers URL
   - Add `X-Company-Id` header to requests
   - Test auth flow end-to-end

6. Test multi-tenant isolation
   - Create 2 test companies
   - Verify data isolation (Company A can't see Company B data)
   - Test all CRUD operations

**Success criteria:**

- ✅ Mobile app successfully logs in via Workers API
- ✅ Clients and jobs CRUD operations work
- ✅ Multi-tenant isolation verified
- ✅ Auth token caching reduces latency by 50ms

### Phase 2: AI Integration (Week 3-4)

**Goal:** Replace mock AI responses with real Claude API + knowledge base.

**Tasks:**

1. Set up AI Gateway
   - Create AI Gateway in Cloudflare dashboard
   - Configure cache settings (TTL, cache key strategy)
   - Set up monitoring and cost tracking

2. Integrate Claude API
   - Implement `generateDiagnosticResponse()` function
   - Build system prompts for HVAC expertise
   - Add conversation history formatting
   - Test API calls with sample questions

3. Build knowledge base ingestion pipeline
   - Create script to extract text from PDF manuals
   - Split into 400-word chunks
   - Generate embeddings with Workers AI
   - Insert into Vectorize

4. Implement semantic search
   - Create `searchKnowledgeBase()` function
   - Test query relevance (top 5 chunks)
   - Add metadata filters (manufacturer, equipment type)

5. Implement context injection (RAG)
   - Combine search results with conversation history
   - Build prompt with injected context
   - Test citation generation

6. Migrate diagnostic endpoints
   - `POST /api/diagnostic/sessions`
   - `POST /api/diagnostic/sessions/:id/messages`
   - Replace mock responses with real AI

7. Test cost savings
   - Monitor cache hit rates (target 60%+)
   - Compare costs: cached vs non-cached
   - Adjust cache TTL if needed

**Success criteria:**

- ✅ Diagnostic sessions use real Claude API
- ✅ Responses cite manual page numbers
- ✅ Cache hit rate >60%
- ✅ AI costs <$1,000/month for 100 technicians

### Phase 3: File Storage (Week 5)

**Goal:** Replace local file storage with R2 + CDN.

**Tasks:**

1. Set up R2 buckets
   - Create `hvacops-storage` bucket
   - Configure CORS for mobile uploads
   - Set up CDN domain (`cdn.hvacops.com`)

2. Implement file upload endpoints
   - `POST /api/parts/upload` - Upload part photo
   - `POST /api/diagnostic/sessions/:id/attachments` - Add file to session
   - `POST /api/equipment/:id/photos` - Equipment photo

3. Migrate equipment manuals
   - Upload existing PDF manuals to R2
   - Update knowledge base to reference R2 URLs
   - Test PDF serving via CDN

4. Add part photo identification
   - Integrate Claude vision API or external service
   - Process uploaded photos
   - Return identified part info

5. Configure CDN caching
   - Set `Cache-Control` headers
   - Test edge caching (verify served from edge)
   - Configure cache purge rules

6. Test zero-egress delivery
   - Serve 1GB file, verify no egress charges
   - Compare costs to S3

**Success criteria:**

- ✅ Part photos upload to R2
- ✅ Equipment manuals serve from CDN
- ✅ Files cached at edge (sub-50ms delivery)
- ✅ Storage costs <$200/month for 10TB

### Phase 4: Real-Time Collaboration (Week 6-7)

**Goal:** Enable multi-tech diagnostic sessions with WebSockets.

**Tasks:**

1. Implement Durable Objects class
   - Create `DiagnosticSession` Durable Object
   - Handle WebSocket upgrade
   - Implement message broadcasting
   - Add participant join/leave logic

2. Add WebSocket support to Workers
   - Route `/api/diagnostic/sessions/:id/ws` to Durable Object
   - Pass auth token to Durable Object
   - Test WebSocket connection from browser

3. Update mobile app with WebSocket hooks
   - Create `useDiagnosticWebSocket(sessionId)` hook
   - Handle connection, messages, disconnection
   - Update React Query cache on new messages

4. Test multi-participant synchronization
   - 2 mobile devices join same session
   - Send messages, verify both receive instantly
   - Test participant join/leave notifications

5. Load test with concurrent users
   - Simulate 100 concurrent sessions
   - Monitor Durable Object request duration
   - Verify no memory leaks or crashes

**Success criteria:**

- ✅ 2+ technicians can chat in real-time
- ✅ Messages appear instantly (<100ms latency)
- ✅ Participant list updates automatically
- ✅ Durable Objects cost <$2/month for 1,000 sessions

### Phase 5: Optimization (Week 8)

**Goal:** Fine-tune performance, add monitoring, prepare for production.

**Tasks:**

1. Add D1 for equipment catalog
   - Create D1 database
   - Replicate equipment catalog from PostgreSQL
   - Implement daily sync cron job
   - Update API to query D1 for catalog searches

2. Implement edge caching strategies
   - Cache equipment catalog queries (5 min TTL)
   - Cache company settings (1 hour TTL)
   - Add conditional requests (ETag, If-None-Match)

3. Add monitoring and alerts
   - Set up Cloudflare Analytics
   - Configure Sentry error tracking
   - Add custom metrics (AI costs, cache hit rates)
   - Create alerts for high error rates

4. Performance testing and tuning
   - Load test API endpoints (1,000 req/sec)
   - Optimize slow queries (add indexes)
   - Profile Worker CPU usage
   - Test cold start times (should be 0ms)

5. Production deployment
   - Set up staging environment
   - Deploy Workers to production
   - Configure custom domains
   - Update mobile app to production API URL

**Success criteria:**

- ✅ API handles 1,000 requests/sec
- ✅ P95 latency <100ms worldwide
- ✅ Monitoring dashboards live
- ✅ Production deployment successful

---

## Cost Analysis

### Current (Mock/MVP): $0/month

No backend infrastructure costs during MVP phase.

### Production with Cloudflare

#### Cloudflare Workers (Compute)

| Item         | Usage     | Cost      |
| ------------ | --------- | --------- |
| Requests     | 10M/month | $5/mo     |
| CPU time     | Included  | $0/mo     |
| **Subtotal** |           | **$5/mo** |

_(First 100,000 requests/day free = 3M/month free)_

#### AI Gateway + Claude API

| Item                         | Usage                          | Cost        |
| ---------------------------- | ------------------------------ | ----------- |
| AI Gateway                   | Included                       | $0/mo       |
| Claude API (with caching)    | 100k queries/mo, 60% cache hit | $600/mo     |
| Claude API (without caching) | 100k queries/mo                | $1,500/mo   |
| **Subtotal**                 |                                | **$600/mo** |
| **Savings vs no caching**    |                                | **$900/mo** |

#### R2 Storage (Files + CDN)

| Item                           | Usage               | Cost           |
| ------------------------------ | ------------------- | -------------- |
| Storage                        | 50TB stored         | $750/mo        |
| Downloads                      | 100TB (zero egress) | $0/mo          |
| Operations                     | 100M reads          | $36/mo         |
| **Subtotal**                   |                     | **$786/mo**    |
| **S3 + CloudFront equivalent** |                     | $10,805/mo     |
| **Savings**                    |                     | **$10,019/mo** |

#### Vectorize (Vector DB)

| Item                    | Usage             | Cost          |
| ----------------------- | ----------------- | ------------- |
| Queries                 | 10M/month         | $0.40/mo      |
| Dimensions stored       | 1M (768-dim each) | $0.04/mo      |
| **Subtotal**            |                   | **$0.44/mo**  |
| **Pinecone equivalent** |                   | $72/mo        |
| **Savings**             |                   | **$71.56/mo** |

#### KV (Session Cache)

| Item                 | Usage     | Cost       |
| -------------------- | --------- | ---------- |
| Reads                | 10M/month | $0.50/mo   |
| Writes               | 1M/month  | $0.50/mo   |
| Storage              | 100MB     | $0.05/mo   |
| **Subtotal**         |           | **$1/mo**  |
| **Redis equivalent** |           | $50/mo     |
| **Savings**          |           | **$49/mo** |

#### D1 (Edge Database)

| Item         | Usage     | Cost      |
| ------------ | --------- | --------- |
| Storage      | 100MB     | $0.08/mo  |
| Reads        | 5M/month  | $5/mo     |
| Writes       | 10k/month | $0.01/mo  |
| **Subtotal** |           | **$5/mo** |

#### Durable Objects (WebSockets)

| Item                  | Usage                   | Cost          |
| --------------------- | ----------------------- | ------------- |
| Requests              | 600k/month              | $0.09/mo      |
| Duration              | 1,000 sessions × 10 min | $0.50/mo      |
| Storage               | 1MB                     | $0.01/mo      |
| **Subtotal**          |                         | **$0.60/mo**  |
| **Pusher equivalent** |                         | $50/mo        |
| **Savings**           |                         | **$49.40/mo** |

### Total Monthly Cost Summary

| Component     | Cloudflare    | Traditional Stack | Savings                      |
| ------------- | ------------- | ----------------- | ---------------------------- |
| Compute       | $5            | $500 (Lambda)     | $495 (99%)                   |
| Storage       | $786          | $10,805 (S3+CF)   | $10,019 (93%)                |
| Vector DB     | $0.44         | $72 (Pinecone)    | $71.56 (99%)                 |
| AI caching    | Included      | —                 | $900 (60% AI cost reduction) |
| Session cache | $1            | $50 (Redis)       | $49 (98%)                    |
| Edge DB       | $5            | —                 | —                            |
| WebSockets    | $0.60         | $50 (Pusher)      | $49.40 (99%)                 |
| **Total**     | **$1,398/mo** | **$11,477/mo**    | **$10,079/mo (88%)**         |

**ROI:** Cloudflare saves $10,079/month = **$120,948/year**

---

## Environment Configuration

### wrangler.toml

```toml
name = "hvacops-api"
main = "src/index.ts"
compatibility_date = "2024-01-15"

# Bindings to Cloudflare resources
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "hvacops-storage"

[[kv_namespaces]]
binding = "KV_SESSIONS"
id = "your-kv-namespace-id-sessions"

[[kv_namespaces]]
binding = "KV_SETTINGS"
id = "your-kv-namespace-id-settings"

[[kv_namespaces]]
binding = "KV_RATELIMIT"
id = "your-kv-namespace-id-ratelimit"

[[d1_databases]]
binding = "D1_DB"
database_name = "equipment-catalog"
database_id = "your-d1-database-id"

[[vectorize]]
binding = "VECTORIZE"
index_name = "hvac-knowledge-base"

[[ai]]
binding = "AI"

[durable_objects]
bindings = [
  { name = "DIAGNOSTIC_SESSIONS", class_name = "DiagnosticSession" }
]

# Secrets (set via: wrangler secret put <NAME>)
# - JWT_SECRET (for JWT signing)
# - ANTHROPIC_API_KEY (Claude API key)
# - DATABASE_URL (PostgreSQL connection string)
# - CF_ACCOUNT_ID (Cloudflare account ID)
# - R2_ACCESS_KEY_ID (R2 S3-compatible access)
# - R2_SECRET_ACCESS_KEY (R2 S3-compatible secret)

# Custom domains
[env.production]
name = "hvacops-api"
route = "api.hvacops.com/*"

[env.staging]
name = "hvacops-api-staging"
route = "api-staging.hvacops.com/*"
```

### Set Secrets

```bash
# Set JWT secret
wrangler secret put JWT_SECRET
# Enter secret: your-256-bit-secret

# Set Claude API key
wrangler secret put ANTHROPIC_API_KEY
# Enter secret: sk-ant-...

# Set PostgreSQL URL
wrangler secret put DATABASE_URL
# Enter secret: postgresql://user:pass@host:5432/db

# Set Cloudflare account ID
wrangler secret put CF_ACCOUNT_ID
# Enter secret: your-account-id

# Set R2 credentials (for S3-compatible access)
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
```

### Environment Types

```typescript
// workers/api/src/types/env.ts
export interface Env {
  // Bindings
  R2_BUCKET: R2Bucket;
  KV_SESSIONS: KVNamespace;
  KV_SETTINGS: KVNamespace;
  KV_RATELIMIT: KVNamespace;
  D1_DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: any; // Cloudflare AI binding
  DIAGNOSTIC_SESSIONS: DurableObjectNamespace;

  // Secrets
  JWT_SECRET: string;
  ANTHROPIC_API_KEY: string;
  DATABASE_URL: string;
  CF_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}
```

---

## Monitoring & Observability

### Cloudflare Analytics

Built-in analytics for Workers:

- Request count
- Error rate
- CPU time
- Invocation duration (P50, P95, P99)

**Access:** Cloudflare Dashboard → Workers & Pages → Analytics

### Custom Logging

```typescript
// workers/api/src/middleware/logging.ts
export async function logRequest(
  request: Request,
  response: Response,
  duration: number,
  env: Env
): Promise<void> {
  // Write to Cloudflare Analytics Engine
  await env.ANALYTICS.writeDataPoint({
    blobs: [
      request.method, // GET, POST, etc.
      new URL(request.url).pathname, // /api/clients
      response.status.toString(), // 200, 404, etc.
    ],
    doubles: [duration], // Request duration in ms
    indexes: [new Date().toISOString()], // Timestamp
  });
}
```

### AI Cost Tracking

```typescript
// Track AI API usage per company
export async function trackAIUsage(
  companyId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cached: boolean,
  env: Env
): Promise<void> {
  await env.ANALYTICS.writeDataPoint({
    blobs: [
      companyId,
      model, // claude-3-5-sonnet-20241022
      cached ? 'hit' : 'miss', // Cache status
    ],
    doubles: [inputTokens, outputTokens, calculateCost(inputTokens, outputTokens, cached)],
    indexes: [new Date().toISOString()],
  });
}

function calculateCost(inputTokens: number, outputTokens: number, cached: boolean): number {
  if (cached) return 0; // Cache hit = free

  // Claude 3.5 Sonnet pricing
  const inputCost = (inputTokens / 1_000_000) * 3.0; // $3 per 1M input tokens
  const outputCost = (outputTokens / 1_000_000) * 15.0; // $15 per 1M output tokens

  return inputCost + outputCost;
}
```

### Error Tracking (Sentry)

```typescript
import * as Sentry from '@sentry/cloudflare';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.ENVIRONMENT, // production, staging
    });

    try {
      return await handleRequest(request, env);
    } catch (error) {
      Sentry.captureException(error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
```

### Alerts

Configure alerts in Cloudflare Dashboard:

- **High error rate**: >5% errors in 5 minutes
- **High latency**: P95 > 500ms for 5 minutes
- **AI budget**: Daily spend > $100
- **Rate limit abuse**: Company exceeds 10,000 requests/hour

---

## Security Considerations

### API Keys

- ✅ Never in mobile app code
- ✅ Stored as Worker secrets (encrypted at rest)
- ✅ Accessed via `env` bindings at runtime
- ✅ Rotatable without app updates

### JWT Validation

- ✅ Every request verifies JWT signature
- ✅ Token expiry checked (1 hour default)
- ✅ Results cached in KV (1 hour TTL)
- ✅ Refresh tokens supported

### Multi-Tenant Isolation

- ✅ `companyId` from authenticated JWT, not request body
- ✅ Database queries filter by `company_id` (enforced server-side)
- ✅ R2 paths include company namespace (`companies/{companyId}/`)
- ✅ User cannot access other companies' data, even with guessed IDs

### Rate Limiting

- ✅ Per company, per endpoint
- ✅ Tracked in KV with sliding windows
- ✅ Returns 429 when exceeded
- ✅ Prevents abuse and cost overruns

### Input Validation

- ✅ All user input validated (type, format, length)
- ✅ Reject unexpected fields (prevent injection)
- ✅ Sanitize for SQL injection (parameterized queries)
- ✅ Sanitize for XSS (no raw HTML in responses)

### CORS

```typescript
// Allow mobile app origins only
const ALLOWED_ORIGINS = [
  'capacitor://localhost', // iOS
  'http://localhost', // Android
  'https://app.hvacops.com', // Web app
];

export function handleCORS(request: Request): Response | null {
  const origin = request.headers.get('Origin');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Company-Id',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return null; // Not a preflight request
}
```

---

## Summary

### Why Cloudflare for HVACOps

1. **Integrated platform** - All infrastructure needs in one place (no vendor stitching)
2. **Global edge deployment** - <50ms API latency worldwide
3. **Cost-effective** - 88% cheaper than traditional stack ($1,398/mo vs $11,477/mo)
4. **Zero egress fees** - Serve unlimited files at no extra cost
5. **AI cost optimization** - 60% AI cost reduction via caching
6. **Developer experience** - Simple deployment, no server management
7. **Scalability** - Handles 10,000+ technicians without configuration changes

### Migration Path

- **Phase 1** (Week 1-2): Workers API foundation
- **Phase 2** (Week 3-4): AI integration with Claude + Vectorize
- **Phase 3** (Week 5): File storage with R2
- **Phase 4** (Week 6-7): Real-time collaboration with Durable Objects
- **Phase 5** (Week 8): Optimization and production launch

### Key Metrics

- **API latency**: <50ms worldwide (P95)
- **AI cache hit rate**: 60-80%
- **Storage cost**: $786/mo for 50TB (vs $10,805/mo on AWS)
- **Total cost**: $1,398/mo (vs $11,477/mo traditional stack)
- **Savings**: $10,079/mo = $120,948/year

### Next Steps

1. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for application architecture
2. Study [CODING_STANDARDS.md](./CODING_STANDARDS.md) for code patterns
3. Set up Cloudflare account and create Workers project
4. Begin Phase 1 migration (Workers API foundation)
