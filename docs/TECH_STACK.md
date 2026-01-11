# Technology Stack

This document explains our technology choices and the rationale behind them.

## Mobile App

### React Native + Expo

**What**: Cross-platform mobile framework using React

**Why we chose it**:

- **Single codebase** for iOS and Android (faster development)
- **Over-the-air (OTA) updates** via Expo Updates (fix bugs instantly, no app store wait)
- **Excellent developer experience** (Fast Refresh, great tooling)
- **Native performance** when needed (can drop to native modules)
- **Rich ecosystem** (camera, GPS, push notifications all work out of the box)
- **Future-proof** (can eject to bare workflow if needed)

**Alternatives considered**:

- Flutter: Great performance but Dart ecosystem smaller, no OTA updates
- Native iOS/Android: Best performance but 2x development time, 2x maintenance
- PWA: Works but iOS Safari limitations (notifications, offline, native feel)

**Version**: Expo SDK 50+

### TypeScript

**What**: Typed superset of JavaScript

**Why we chose it**:

- **Catch errors at compile time**, not runtime
- **Excellent autocomplete and IntelliSense**
- **Self-documenting code** (types serve as inline documentation)
- **Safer refactoring** (rename variables, change types confidently)
- **Industry standard** for React Native apps

**Configuration**: Strict mode enabled

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noUnusedLocals": true
}
```

### React Query (TanStack Query)

**What**: Data fetching and caching library

**Why we chose it**:

- **Automatic caching and revalidation** (fetch once, use everywhere)
- **Background refetching** (data stays fresh)
- **Request deduplication** (don't fetch same data twice)
- **Optimistic updates** (instant UI, sync in background)
- **Loading and error states** handled automatically
- **Industry standard** (used by Vercel, Netlify, etc.)

**Alternatives considered**:

- Redux: Too much boilerplate for our needs
- SWR: Similar but React Query has more features
- Apollo Client: Overkill (we're not using GraphQL)

**Version**: @tanstack/react-query v5+

### WatermelonDB

**What**: Reactive, local-first database for React Native

**Why we chose it**:

- **Works offline by default** (critical for basements/crawlspaces)
- **Reactive** (components update automatically when data changes)
- **Fast** (uses JSI for near-native performance)
- **Scales well** (tested with 10,000+ records)
- **Sync built-in** (background sync to server)

**Alternatives considered**:

- AsyncStorage: Too simple, not reactive, slow for large data
- SQLite directly: More control but lose reactivity
- Realm: Good but WatermelonDB has better React integration

**Version**: @nozbe/watermelondb v0.27+

### NativeWind

**What**: Tailwind CSS for React Native

**Why we chose it**:

- **Tailwind utility classes** (familiar if you know web)
- **Consistent spacing and colors** (design system out of the box)
- **Fast development** (no switching between files)
- **Type-safe** (TypeScript support)

**Alternatives considered**:

- StyleSheet: More verbose, no design system
- Styled Components: Runtime performance cost
- Tamagui: More powerful but heavier

**Version**: nativewind v4+

### Expo Router

**What**: File-based routing for React Native (like Next.js)

**Why we chose it**:

- **File-based routing** (folder structure = route structure)
- **Type-safe navigation** (autocomplete for routes)
- **Deep linking built-in** (handle URLs automatically)
- **Layouts and nested routes** (share UI across screens)
- **Future of Expo** (official recommendation)

**Alternatives considered**:

- React Navigation: More manual setup, no file-based routing
- Plain React Navigation: Too much boilerplate

**Version**: expo-router v3+

## Backend API

### Node.js + Fastify

**What**: JavaScript runtime + web framework

**Why we chose it**:

- **Same language** as frontend (TypeScript everywhere)
- **Fast** (Fastify is 2-3x faster than Express)
- **Great TypeScript support** (schemas, validation, types)
- **Rich ecosystem** (thousands of packages)
- **Easy deployment** (runs anywhere)

**Alternatives considered**:

- Python + FastAPI: Great but adds another language
- Go: Fastest but harder to share types with frontend
- Express: Slower, worse TypeScript support

**Version**: Node 20 LTS, Fastify v4+

### PostgreSQL + Prisma

**What**: Relational database + TypeScript ORM

**Why we chose it**:

- **Type-safe database access** (catch errors at compile time)
- **Migrations** (version control for database)
- **Excellent TypeScript support** (generated types from schema)
- **PostgreSQL reliability** (ACID, proven at scale)
- **Easy local development** (Docker for local db)

**Alternatives considered**:

- MongoDB: NoSQL flexibility not needed, harder to maintain
- TypeORM: Good but Prisma has better DX
- Raw SQL: More control but lose type safety

**Version**: PostgreSQL 15+, Prisma v5+

### Pinecone (Vector Database)

**What**: Vector database for AI embeddings

**Why we chose it**:

- **Purpose-built for AI** (semantic search, RAG)
- **Fully managed** (no infrastructure to maintain)
- **Fast** (< 100ms queries at scale)
- **Easy to use** (simple API)
- **Generous free tier** (100k vectors free)

**Alternatives considered**:

- Weaviate: Self-hosted, more complex setup
- pgvector: Postgres extension, slower at scale
- Build our own: Reinventing wheel, slower

**Version**: Pinecone v1+

### Anthropic Claude API

**What**: AI API for chat and text generation

**Why we chose it**:

- **Best in class for reasoning** (diagnostics need reasoning)
- **Large context window** (200k tokens = can inject lots of context)
- **Prompt caching** (90% cost reduction for repeated context)
- **Great at following instructions** (better than GPT-4 for structured tasks)
- **Vision support** (analyze images of equipment)
- **Fast** (< 2 second responses)

**Alternatives considered**:

- OpenAI GPT-4: Good but more expensive, smaller context
- Open source models: Not good enough for diagnostics yet
- Fine-tuned model: Too expensive and complex for MVP

**Version**: Claude Sonnet 4.5 (with Opus 4.5 for complex cases)

## Development Tools

### Jest + React Testing Library

**What**: Testing frameworks

**Why**:

- **Industry standard** for React testing
- **Focus on user behavior** not implementation
- **Great TypeScript support**
- **Fast** with parallel execution

### ESLint + Prettier

**What**: Code linting and formatting

**Why**:

- **Catch bugs** before runtime (ESLint)
- **Consistent formatting** (Prettier)
- **Automatic fixes** (run on save)
- **Team alignment** (everyone uses same style)

### Husky + lint-staged

**What**: Git hooks for pre-commit checks

**Why**:

- **Catch issues before commit** (type check, lint, test)
- **Prevent bad code** from entering codebase
- **Fast** (only check changed files)

## Infrastructure

### Expo Application Services (EAS)

**What**: Build and deploy service for Expo apps

**Why**:

- **Build in the cloud** (no need for Mac for iOS builds)
- **OTA updates** (push updates without app store)
- **Submit to stores** (automate releases)
- **Official Expo tool** (best integration)

### Hosting (TBD - Multiple Options)

**Options we're considering**:

1. **Railway** (Recommended for MVP)
   - Pros: Easy setup, auto-deploys from Git, fair pricing
   - Cons: Startup with less track record

2. **Render**
   - Pros: Similar to Railway, good free tier
   - Cons: Cold starts on free tier

3. **AWS (ECS + RDS)**
   - Pros: Most powerful, scales infinitely
   - Cons: Complex setup, more expensive
   - Use: When we're beyond MVP

**Decision**: Start with Railway, move to AWS if needed

### File Storage

**S3 or Cloudflare R2**

**Why**:

- **Cheap** (pennies per GB)
- **Fast** (CDN included)
- **Reliable** (99.99% uptime)
- **Signed URLs** (secure image uploads)

**Decision**: Cloudflare R2 (cheaper, no egress fees)

### Error Monitoring

**Sentry**

**Why**:

- **Real-time error tracking** (know when things break)
- **Stack traces** (see exactly where errors happen)
- **User context** (know who's affected)
- **Performance monitoring** (find slow screens)
- **Generous free tier** (5k errors/month)

## Security

### Authentication

**JWT tokens + HTTP-only cookies** (backend)

**Why**:

- **Stateless** (no session store needed)
- **Secure** (tokens encrypted, short-lived)
- **Standard** (works everywhere)

### Secrets Management

**Environment variables + Expo Secrets**

**Why**:

- **Never commit secrets** (use .env files)
- **Different per environment** (dev, staging, prod)
- **EAS Secrets** for sensitive values (encrypted)

## Cost Estimates (Monthly)

### MVP (100 users, 5 active techs)

```
Expo EAS (Build + Updates): $29-99/mo
Railway (API + DB):         $20/mo
Pinecone (Vector DB):       $0 (free tier)
Cloudflare R2 (Storage):    $5/mo
Claude API:                 $100-300/mo (depends on usage)
Sentry (Error tracking):    $0 (free tier)
---
Total:                      $154-424/mo
```

### Growth (500 users, 50 active techs)

```
EAS:                        $99/mo
Railway:                    $100/mo (or move to AWS)
Pinecone:                   $70/mo
R2:                         $20/mo
Claude API:                 $1,000-2,000/mo
Sentry:                     $26/mo
---
Total:                      $1,315-2,315/mo
```

## Decision Log

### Why not GraphQL?

- **REST is simpler** for our use case
- **No complex data fetching** (no N+1 problems)
- **React Query handles caching** (main GraphQL benefit)
- **Less tooling** (no code generation needed)

### Why not Firebase?

- **Vendor lock-in** (hard to migrate away)
- **Less control** (can't customize as much)
- **Cost at scale** (expensive for high read/write)
- **Prefer standard tech** (Postgres, Node.js)

### Why Expo over bare React Native?

- **OTA updates** are critical for field app (fix bugs instantly)
- **Faster development** (don't manage native code)
- **Can always eject** if we need more control
- **MVP speed** more important than ultimate control

## Future Considerations

### When to migrate from Railway to AWS?

- When monthly costs > $500 on Railway
- When we need multi-region deployment
- When we need advanced networking (VPC, etc.)
- When we have dedicated DevOps

### When to add Redis?

- When we need advanced caching (user sessions, rate limiting)
- When we need real-time features (WebSockets)
- Probably Phase 2 or 3

### When to consider microservices?

- When team > 10 engineers
- When AI processing becomes complex enough to separate
- Probably not for 1-2 years

## References

- [Expo Documentation](https://docs.expo.dev/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [WatermelonDB Documentation](https://nozbe.github.io/WatermelonDB/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Claude API Documentation](https://docs.anthropic.com/)
