# Copilot Session Notes

Date: 2026-01-21

## What we completed

- **D1 schema + migrations**
  - Added core tables for copilot data: tenants, users, clients, properties, equipment, jobs, job_events, notes.
  - Files:
    - `db/migrations/0001_copilot_core.sql`
    - `db/migrations/0002_seed_copilot_sample.sql`

- **Worker scaffolding**
  - Created Worker entry at `src/worker.ts`.
  - Routes implemented:
    - `GET /api/jobs/:jobId/ai/context`
    - `POST /api/jobs/:jobId/ai/session` (stub)
    - `POST /api/jobs/:jobId/ai/chat` (OpenAI integration)
    - `POST /api/vectorize/reindex/job/:jobId`

- **Job context snapshot**
  - Implemented D1 query helper: `src/server/copilot/jobContext.ts`.

- **Evidence and citations**
  - Added job evidence pipeline with scope expansion:
    - Job-level first, then property-level if sparse, then client-level notes.
  - File: `src/server/copilot/jobEvidence.ts`.

- **OpenAI chat integration**
  - Chat endpoint calls OpenAI and parses JSON output.
  - Uses `gpt-4o-mini` and `text-embedding-3-small`.

- **Vectorize integration**
  - Added Vectorize binding in `wrangler.toml`:
    - `VECTORIZE_INDEX` → `hvacops-copilot`
  - Vectorize query in chat pipeline (optional; gated by binding).
  - Added embeddings + upsert pipeline:
    - `src/server/copilot/indexing.ts`
    - Endpoint: `POST /api/vectorize/reindex/job/:jobId`
    - Script: `scripts/vectorizeSeed.js`

- **Security update**
  - Reindex endpoint secured by `VECTORIZE_ADMIN_TOKEN` (separate from OpenAI key).
  - Doc: `docs/vectorize-setup.md`.

- **Developer docs**
  - `docs/copilot-dev.md` added with step-by-step local/remote setup.

- **Debugging support**
  - Added `x-debug: 1` header support in chat:
    - Returns vectorize enabled state, match count, filters, and unfiltered matches.
  - Added fallback logic: if Vectorize filtered query returns 0, fetch unfiltered and filter locally by tenant/job.

## 2026-01-24 Updates

- **Vectorize filtering fixed**
  - Added metadata indexes for `tenant_id` + `job_id` in Vectorize.
  - Filtered queries now work; fallback remains as safety with warning log.
  - Debug fields show `vectorFilterUsed` and `vectorFilterFallbackUsed`.

- **Production-grade error handling**
  - Added `JobNotFoundError` and returned `404` for missing jobs.
  - Updated `/ai/context`, `/ai/chat`, `/ai/session`, `/vectorize/reindex` to use 404s vs 500s.

- **Cloudflare Access auth**
  - New D1 table: `access_identities` (`db/migrations/0003_access_identities.sql`).
  - Access JWT middleware in `src/server/copilot/auth/access.ts`.
  - Copilot routes now use Access JWT; dev-only fallback behind `ALLOW_DEV_AUTH=1`.
  - Service token support: `common_name` used when `sub` is empty.

- **Cloudflare-first MVP doc**
  - Added `docs/COPILOT_PRODUCTION_MVP.md` with auth architecture + required env vars.

## Current state (verified)

- Browser login (Access OTP) works and returns context JSON.
- Service token access works via `CF-Access-Client-Id` + `CF-Access-Client-Secret`.
- Access identity mapping required in D1 to resolve tenant/user.

## What remains to do (next session)

1. Add `access_identities` seed mapping for real users/tenants.
2. Add UI + API wiring for real data ingestion (jobs/clients/notes).
3. Add rate limiting + observability for production hardening.

## Current state (verified)

- `/ai/chat` returns answers with citations from D1 evidence.
- Vectorize index contains data (confirmed via unfiltered matches).
- Filtered Vectorize query returns 0; fallback retrieves matches.
- Debug output confirms filter mismatch but metadata shows correct tenant/job values.

## What remains to do

1. **Fix Vectorize filter query**
   - Determine correct filter syntax for Cloudflare Vectorize.
   - Remove fallback once filters work.

2. **Add ingestion pipeline for all new notes/events**
   - Decide on a queue-based indexing pipeline (Cloudflare Queues).
   - Trigger reindex on note/job_event updates (not just manual endpoint).

3. **Session persistence**
   - Add tables for ai_sessions + ai_messages (optional D1 logging).
   - Wire session endpoint to store/retrieve session metadata.

4. **Caching**
   - Optional KV cache for job context snapshot (to reduce repeated queries).

5. **UI integration**
   - Tie Worker endpoints to the Jobs “Get AI Help” UI.

## Commands we used today

- Local D1 schema:
  - `wrangler d1 execute hvacops --local --file db/migrations/0001_copilot_core.sql`
  - `wrangler d1 execute hvacops --local --file db/migrations/0002_seed_copilot_sample.sql`

- Remote D1 schema + seed:
  - `wrangler d1 execute hvacops --remote --file db/migrations/0001_copilot_core.sql`

## 2026-01-28 Updates

- **LLM portability architecture implemented (core + adapter split)**
  - Created `src/llm-core/` for portable logic (prompts, parsing, config, orchestration, retrieval types, telemetry types).
  - Created `src/llm-adapters/hvacops/` for app-specific logic (context/evidence, retrieval, model provider, persistence, routes, telemetry).
  - Added adapter entrypoint + env interface for portability:
    - `src/llm-adapters/hvacops/register.ts`
    - `src/llm-adapters/hvacops/types/env.ts`

- **Refactor phases completed**
  - Phase 1: moved prompts/parsing/config into `llm-core`.
  - Phase 2: core orchestrator + model types + re-exports for compatibility.
  - Phase 3: adapterized OpenAI provider + Vectorize helpers/retriever.
  - Phase 4: adapterized context/evidence and persistence stores.
  - Phase 5: moved chat route to adapter + thin server route.
  - Phase 6: added core tests + adapter integration tests.

- **New docs**
  - `docs/principles/LLM_PORTABLE_ARCH.md` (architecture + mapping)
  - `docs/principles/LLM_PORTABLE_ARCH_PROGRESS.md` (progress tracker)
  - `docs/principles/LLM_PORTABILITY_LESSON.md` (master educational lesson)

- **LLM test harness**
  - Added `jest.llm.config.js`, `tsconfig.jest.json`, `scripts/test-llm.sh`
  - Added `test:llm` script in `package.json`
  - Installed `ts-jest` for isolated LLM tests
  - Tests pass via `npm run test:llm`

- **Streaming + provider wiring**
  - Streaming path now uses provider stream; non-streaming uses core orchestrator.
  - Persistence wired through adapter stores (no raw SQL in route).

- **Telemetry hooks**
  - Core telemetry interface added: `src/llm-core/telemetry/types.ts`
  - Orchestrator emits lifecycle events + latency and token usage.
  - OpenAI provider returns usage in `ChatCompletion`.
  - Adapter console telemetry added: `src/llm-adapters/hvacops/telemetry/logger.ts`
  - Chat route emits retrieval + streaming events with requestId.

- **Portability polish**
  - Adapter no longer depends on server `workerTypes` for Vectorize types.
  - Adapter exports `registerLLMRoutes` and `LLMAdapterEnv`.

- **Commits pushed (selected)**
  - Scaffold/move core logic
  - Adapterize model/retrieval
  - Adapterize context/persistence
  - Move chat route into adapter
  - Add LLM tests + configs
  - Add adapter entrypoint + env types
  - Add master lesson doc
  - `wrangler d1 execute hvacops --remote --file db/migrations/0002_seed_copilot_sample.sql`

- Vectorize index:
  - `wrangler vectorize create hvacops-copilot --dimensions 1536 --metric cosine`

- Start Worker:
  - `wrangler dev --remote`

- Seed Vectorize:
  - `node scripts/vectorizeSeed.js --tenant=tenant_demo --job=job_demo`

- Test chat:
  - `curl -X POST -H "x-tenant-id: tenant_demo" -H "content-type: application/json" -d '{"message":"Any notes about rattling?"}' http://localhost:8787/api/jobs/job_demo/ai/chat`

- Debug chat:
  - `curl -X POST -H "x-tenant-id: tenant_demo" -H "content-type: application/json" -H "x-debug: 1" -d '{"message":"Any notes about rattling?"}' http://localhost:8787/api/jobs/job_demo/ai/chat`

## Open questions

- Confirm correct Vectorize filter syntax for metadata fields (tenant_id, job_id).
- Should Vectorize results include property/client scope (same rules as evidence)?
- Should chat logs be persisted in D1 or stored in R2?

## Telemetry plan (Logpush → R2)

**Goal:** Production‑grade LLM telemetry with minimal maintenance. Use Workers Logs + Logpush to deliver structured events into R2 for durable storage, later dashboards, and cost observability.

**What we will log (already emitted by telemetry hooks):**

- LLM lifecycle events (request started/completed/failed)
- Retrieval metadata (evidence counts, fallback usage)
- Token usage (input/output/total)
- Latency (end‑to‑end)

**Pipeline:**

```
Workers Logs / Trace Events
      │
      ▼
Logpush Job (Workers dataset + fields)
      │
      ▼
R2 Bucket (hvacops-llm-logs)
```

**Setup steps (when ready):**

1. Create R2 bucket: `hvacops-llm-logs`
2. Create Logpush job for Workers Logs dataset → R2 destination
3. Select fields: `event_timestamp`, `script_name`, `request_id`, `message`, `log_level`, `metadata`
4. Start with sampling if volume is high (e.g., 10–25%)
5. Verify delivery by inspecting R2 objects

**Notes:**

- Logpush requires Workers Paid (minimum $5/month).
- We can later export R2 logs into Datadog/BigQuery if needed.

## 2026-01-25 Updates

### What we completed

- **Auth worker + OIDC login flow working**
  - Cloudflare Access SaaS OIDC app configured and working (email OTP).
  - Fixed authorize URL: uses `/authorization` endpoint.
  - Auth worker endpoints: `/auth/authorize`, `/auth/callback`, `/auth/exchange`, `/auth/refresh`, `/.well-known/jwks.json`.
  - Expo Go login works with proxy redirect.

- **Auth storage + tenant mapping**
  - User now maps `tenantId` -> `companyId` in app auth exchange.
  - Added dev debug footer + clear auth data button in Jobs tab.

- **Seeded prod D1**
  - One-time seed SQL added: `db/seed/0001_prod_demo.sql`
  - Inserts `tenant_demo`, 10 clients, 10 properties, 10 jobs (scheduled in Feb 2026).
  - Run: `wrangler d1 execute hvacops --remote --file db/seed/0001_prod_demo.sql`

- **API wiring (in progress)**
  - Added API helper `src/lib/api/copilotApi.ts`.
  - Jobs and clients services now call API when `EXPO_PUBLIC_COPILOT_API_URL` is set:
    - `src/features/jobs/services/jobService.ts`
    - `src/features/clients/services/clientService.ts`
  - Added worker routes:
    - `src/server/copilot/routes/jobs.ts` (`GET /api/jobs`, `GET /api/jobs/:id`, `POST /api/jobs`)
    - `src/server/copilot/routes/clients.ts` (`GET /api/clients`, `GET /api/clients/:id`)
  - Registered routes in `src/server/copilot/routes/index.ts`.
  - API worker deployed after changes.

- **Access blocking removed**
  - Cloudflare Access app `hvac-ai-api` was deleted (it intercepted `/api/*`).

### Current issues

- **Jobs list still empty**
  - The app hits `/api/jobs` but receives `401`.
  - Debug footer shows JWT auth fails.

- **JWKS was broken + leaked**
  - `/.well-known/jwks.json` was 500 due to non-extractable key; fixed by importing key as extractable.
  - JWKS response included private fields (`d`, `p`, `q`, ...). We must rotate the key.
  - Fix added to strip private fields in `src/auth/worker.ts`.
  - JWKS now returns 200 JSON but key rotation is still required.

### Required fixes (next session)

1. **Rotate JWT key and redeploy auth worker**
   - Ensure JWKS is public-only (no private fields).
   - Update secret and redeploy:
     - `wrangler secret put AUTH_JWT_PRIVATE_KEY --config wrangler.auth.toml < auth_jwt_private_pkcs8.pem`
     - `wrangler deploy --config wrangler.auth.toml`

2. **Set API worker JWT secrets and redeploy**
   - These must be set on `hvac-ai` (API worker) to validate app tokens:
     - `AUTH_JWKS_URL=https://hvacops-auth.hvac-ai.workers.dev/.well-known/jwks.json`
     - `AUTH_JWT_ISSUER=https://hvacops-auth.hvac-ai.workers.dev`
     - `AUTH_JWT_AUD=hvacops-mobile`
   - Commands:
     - `wrangler secret put AUTH_JWKS_URL --config wrangler.toml`
     - `wrangler secret put AUTH_JWT_ISSUER --config wrangler.toml`
     - `wrangler secret put AUTH_JWT_AUD --config wrangler.toml`
     - `wrangler deploy`

3. **Retest Jobs API**
   - In app: use "Test Jobs API" button in debug footer.
   - Expected: `200 application/json` with job count.

4. **If list still empty after auth fix**
   - Date filtering: seed jobs are in Feb 2026; set calendar range accordingly.
   - Alternatively, re-seed with "today" dates.

### Useful references

- Auth worker config: `wrangler.auth.toml`
- API worker config: `wrangler.toml`
- Auth docs: `docs/AUTH.md`

## 2026-01-26 Updates

### What we completed

- **Auth role persistence fix**
  - Prevented auth upsert from overwriting existing DB roles with IdP default.
  - Refresh now returns canonical user info from `hvacops-auth`.
  - Files:
    - `src/auth/worker.ts`
    - `src/features/auth/services/authService.ts`
    - `src/providers/AuthProvider.tsx`

- **Job note flow + auto reindex**
  - Added in-app “Add Note” modal for job detail.
  - Notes created via `/api/ingest/notes` with idempotency support.
  - Auto reindex triggered asynchronously after note insert.
  - Files:
    - `src/features/jobs/screens/JobDetailScreen.tsx`
    - `src/features/jobs/services/jobService.ts`
    - `src/server/copilot/routes/ingest.ts`

- **Technicians + assignments**
  - Added technician API routes (`GET /api/technicians`, `GET /api/technicians/:id`, `POST /api/technicians`).
  - Job create supports optional assignment; added assignment endpoint.
  - Job form supports selecting a technician before create.
  - Files:
    - `src/server/copilot/routes/technicians.ts`
    - `src/server/copilot/routes/jobs.ts`
    - `src/features/jobs/components/JobForm.tsx`
    - `src/features/jobs/types.ts`

- **Debug cleanup**
  - Removed debug footer and `/api/debug/jwks` route from production UI/API.
  - Files:
    - `src/features/jobs/screens/TodaysJobsScreen.tsx`
    - `src/server/copilot/routes/debug.ts`
    - `src/server/copilot/routes/index.ts`

### Current state (verified)

- Login via Cloudflare Access OIDC works in Expo Go.
- Technicians can be created and assigned to new jobs.
- Job detail supports adding technician notes.
- Chat answers include new note content after ingest + reindex.

### Still needs to be done

1. **Admin/role management UI**
   - Promote/demote users without touching D1 directly.
2. **Production-safe role updates**
   - Add an admin API endpoint (auth worker or API worker) to update roles.
3. **Operational hardening**
   - Optional: queue-based reindexing for notes/events at scale.

### Known issues

- Role changes require a fresh login/refresh to take effect in the app.
  - With the auth fix, roles no longer revert to `technician`, but the app still needs a new token to pick up changes.

## 2026-01-27 Updates

### What we completed

- **Copilot chat persistence + streaming**
  - Added D1 tables for conversations/messages with audit metadata.
  - Chat now supports streaming responses and stores user/assistant messages.
  - Conversation history is fetched on open to preserve context.
  - Files:
    - `db/migrations/0005_copilot_conversations.sql`
    - `db/migrations/0006_copilot_message_audit.sql`
    - `src/server/copilot/routes/chat.ts`
    - `src/features/jobs/services/jobCopilotService.ts`
    - `src/features/jobs/hooks/useJobCopilot.ts`

- **Evidence pipeline hardening**
  - Evidence now includes author name/email for notes.
  - Fixed SQL ordering ambiguity in evidence queries.
  - Files:
    - `src/server/copilot/jobEvidence.ts`
    - `src/server/copilot/routes/chat.ts`

- **Chat UI upgrades**
  - Sources are collapsible (collapsed by default).
  - Each source is a bounded card with snippet, divider, author, and date.
  - Source count is shown in a circular badge.
  - Files:
    - `src/features/diagnostic/components/MessageBubble.tsx`
    - `src/features/diagnostic/types.ts`

- **Chat list stability**
  - Non-inverted list with `maintainVisibleContentPosition` to keep the Sources header anchored on expand/collapse.
  - Chat opens to latest message consistently.
  - File:
    - `src/features/jobs/components/JobCopilotMessageList.tsx`

- **Job detail layout refinements**
  - Job Details now focuses on status/type/equipment + description.
  - Removed redundant client/assignment/schedule fields from Job Details.
  - Start/Complete and AI Help buttons share a single row; AI footnote shown below.
  - File:
    - `src/features/jobs/screens/JobDetailScreen.tsx`

- **Auth user naming**
  - Added `first_name` / `last_name` to auth DB with backfill from `name`.
  - Auth worker now stores and returns first/last name, and embeds them in JWT.
  - Mobile auth parsing prefers first/last name when present.
  - Files:
    - `db/auth/0002_auth_user_names.sql`
    - `src/auth/worker.ts`
    - `src/features/auth/services/authService.ts`

### Current state (verified)

- Copilot chat persists between opens and streams responses.
- Sources render in a compact, skimmable format with author/date.
- Sources expansion no longer shifts the header position.
- Job details screen is less redundant and more compact.

### Still needs to be done

1. **Backfill hvacops user names**
   - My Profile reads from `hvacops.users`; ensure first/last names are populated there.
2. **Deploy auth + API workers after schema changes**
   - `wrangler deploy --config wrangler.auth.toml`
   - `wrangler deploy`
3. **Role/tenant admin UI**
   - Provide UI/API to manage roles and profile fields.

### Known issues / follow-ups

- My Profile may still show blank names until `hvacops.users` is updated or synced.
- Chat position is not preserved between leaving and re-entering (intentional for now).
